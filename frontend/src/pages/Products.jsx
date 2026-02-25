import { useCallback, useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct, fetchInvoices, updateProductVariantStockQty } from "../services/api";

// Unit conversion constants/helpers for size normalization.
const MM_PER_INCH = 25.4;
const roundTo = (value, decimals) => Number(value.toFixed(decimals));

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

const formatInchFraction = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";

  const whole = Math.floor(numeric);
  const fractional = numeric - whole;
  const denominator = 16;
  const numeratorRaw = Math.round(fractional * denominator);

  if (numeratorRaw === 0) {
    return whole ? String(whole) : "0";
  }

  if (numeratorRaw === denominator) {
    return String(whole + 1);
  }

  const divisor = gcd(numeratorRaw, denominator);
  const numerator = numeratorRaw / divisor;
  const reducedDenominator = denominator / divisor;

  if (!whole) {
    return `${numerator}/${reducedDenominator}`;
  }

  return `${whole}-${numerator}/${reducedDenominator}`;
};

const parseInchInput = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const normalized = raw.replace(/\s+/g, "");

  const mixedMatch = normalized.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den) && den > 0 && num > 0) {
      return whole + num / den;
    }
  }

  const fracMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0 && num > 0) {
      return num / den;
    }
  }

  return null;
};

const normalizeInchValue = (value) => {
  const parsed = parseInchInput(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return formatInchFraction(parsed);
};

const getVariantSizeInch = (variant) => {
  const inchFromInch = normalizeInchValue(variant?.size_inch);
  if (inchFromInch) return inchFromInch;

  const inchFromLabel = normalizeInchValue(variant?.size_label);
  if (inchFromLabel) return inchFromLabel;

  const sizeMM = Number(variant?.size_mm);
  if (Number.isFinite(sizeMM) && sizeMM > 0) {
    return formatInchFraction(sizeMM / MM_PER_INCH);
  }

  return null;
};

const getVariantKey = (productId, sizeMM) => `${productId}__${Number(sizeMM).toFixed(2)}`;

// Builds sold-quantity lookup from invoice items, keyed by product + variant size.
const buildSoldMap = (invoices) => {
  const sold = {};
  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      const key = getVariantKey(item.productId, item.sizeMM);
      sold[key] = (sold[key] || 0) + (Number(item.qty) || 0);
    });
  });
  return sold;
};

export default function Products() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variantUpdatingKey, setVariantUpdatingKey] = useState("");
  const [activeVariantEditKey, setActiveVariantEditKey] = useState("");
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState(null);
  const [soldMap, setSoldMap] = useState({});
  const [variantStockDrafts, setVariantStockDrafts] = useState({});
  const [form, setForm] = useState({
    system: "",
    newSystem: "",
    category: "",
    name: "",
    unit: "pcs",
    length_m: "",
    size_mm: "",
    size_inch: "",
    price: "",
    stock_qty: "",
    reorder_level: ""
  });
  const [variants, setVariants] = useState([]);

  // Loads product catalog and invoice-driven sold stats used in inventory view.
  const loadProducts = useCallback(async () => {
    try {
      const [productsRes, invoicesRes] = await Promise.all([
        fetchAllProducts(),
        fetchInvoices()
      ]);
      setSystems(productsRes.data || []);
      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.invoices || [];
      setSoldMap(buildSoldMap(invoices));
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFormChange = (key, value) => {
    setFormError("");
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSizeMMChange = (value) => {
    setFormError("");
    setForm(prev => ({ ...prev, size_mm: value }));
  };

  const handleSizeInchChange = (value) => {
    setFormError("");
    if (value === "") {
      setForm(prev => ({ ...prev, size_inch: "", size_mm: "" }));
      return;
    }

    const numericInch = parseInchInput(value);
    if (!Number.isFinite(numericInch) || numericInch <= 0) {
      setForm(prev => ({ ...prev, size_inch: value, size_mm: "" }));
      return;
    }

    setForm(prev => ({
      ...prev,
      size_inch: normalizeInchValue(value),
      size_mm: String(roundTo(numericInch * MM_PER_INCH, 2))
    }));
  };

  const handleAddVariant = () => {
    const sizeMMInput = Number(form.size_mm);
    const sizeInchInput = parseInchInput(form.size_inch);
    const price = Number(form.price);

    const hasSizeMM = Number.isFinite(sizeMMInput) && sizeMMInput > 0;
    const hasSizeInch = Number.isFinite(sizeInchInput) && sizeInchInput > 0;

    if ((!hasSizeMM && !hasSizeInch) || !Number.isFinite(price)) {
      setFormError("Enter a valid size (mm or inch) and price for the variant");
      return;
    }

    const sizeMM = hasSizeMM ? sizeMMInput : roundTo(sizeInchInput * MM_PER_INCH, 2);
    const sizeInch = hasSizeInch ? normalizeInchValue(form.size_inch) : formatInchFraction(sizeMM / MM_PER_INCH);
    const stockQty = Number(form.stock_qty);
    const reorderLevel = Number(form.reorder_level);

    if ((form.stock_qty !== "" && (!Number.isFinite(stockQty) || stockQty < 0)) || (form.reorder_level !== "" && (!Number.isFinite(reorderLevel) || reorderLevel < 0))) {
      setFormError("Stock quantity and reorder level must be 0 or greater");
      return;
    }

    setVariants(prev => ([
      ...prev,
      {
        size_mm: sizeMM,
        size_inch: sizeInch,
        price,
        stock_qty: Number.isFinite(stockQty) && stockQty >= 0 ? stockQty : 0,
        reorder_level: Number.isFinite(reorderLevel) && reorderLevel >= 0 ? reorderLevel : 0
      }
    ]));

    setForm(prev => ({
      ...prev,
      size_mm: "",
      size_inch: "",
      price: "",
      stock_qty: "",
      reorder_level: ""
    }));
  };

  const handleRemoveVariant = (index) => {
    setVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setForm({
      system: "",
      newSystem: "",
      category: "",
      name: "",
      unit: "pcs",
      length_m: "",
      size_mm: "",
      size_inch: "",
      price: "",
      stock_qty: "",
      reorder_level: ""
    });
    setVariants([]);
    setEditing(null);
  };

  const handleEditProduct = (system, product) => {
    setForm({
      system,
      newSystem: "",
      category: "",
      name: product.name || "",
      unit: product.unit || "pcs",
      length_m: product.length_m ? String(product.length_m) : "",
      size_mm: "",
      size_inch: "",
      price: "",
      stock_qty: "",
      reorder_level: ""
    });
    setVariants((product.variants || []).map((variant) => ({
      ...variant,
      size_inch: getVariantSizeInch(variant)
    })));
    setEditing({ system, productId: product.id });
    setFormError("");
  };

  const handleSaveProduct = async () => {
    const systemValue = form.system === "__new__" ? form.newSystem.trim() : form.system.trim();
    if (!systemValue) {
      setFormError("Select a system or enter a new system name");
      return;
    }

    if (!editing && form.system === "__new__" && !form.category.trim()) {
      setFormError("Category is required for a new system");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Product name is required");
      return;
    }

    if (variants.length === 0) {
      setFormError("Add at least one variant");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        system: systemValue,
        category: form.system === "__new__" ? form.category.trim() : undefined,
        product: {
          name: form.name.trim(),
          unit: form.unit.trim() || "pcs",
          length_m: form.length_m,
          variants
        }
      };

      if (editing) {
        await updateProduct(editing.system, editing.productId, payload);
      } else {
        await createProduct(payload);
      }

      resetForm();
      await loadProducts();
      alert(editing ? "Product updated successfully" : "Product added successfully");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (system, product) => {
    const confirmed = window.confirm(`Delete ${product.name}?`);
    if (!confirmed) return;

    try {
      await deleteProduct(system, product.id);
      await loadProducts();
      if (editing && editing.productId === product.id) {
        resetForm();
      }
      alert("Product deleted");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  const getVariantRowKey = (systemName, productId, sizeMM) => `${systemName}__${productId}__${Number(sizeMM).toFixed(2)}`;

  // Draft values let each row keep temporary stock edits before user clicks Save.
  const getVariantDraftValue = (systemName, productId, sizeMM, stockQty) => {
    const key = getVariantRowKey(systemName, productId, sizeMM);
    if (Object.prototype.hasOwnProperty.call(variantStockDrafts, key)) {
      return variantStockDrafts[key];
    }
    return String(Number(stockQty) || 0);
  };

  const handleVariantDraftChange = (systemName, productId, sizeMM, value) => {
    const key = getVariantRowKey(systemName, productId, sizeMM);
    const sanitized = String(value).replace(/[^0-9]/g, "");
    setVariantStockDrafts(prev => ({ ...prev, [key]: sanitized }));
  };

  const handleUpdateSingleVariantStock = async (systemName, productId, sizeMM, currentStockQty) => {
    const key = getVariantRowKey(systemName, productId, sizeMM);

    // First click enters edit mode for that row.
    if (activeVariantEditKey !== key) {
      setActiveVariantEditKey(key);
      setVariantStockDrafts(prev => ({ ...prev, [key]: String(Number(currentStockQty) || 0) }));
      return;
    }

    const rawValue = Object.prototype.hasOwnProperty.call(variantStockDrafts, key)
      ? variantStockDrafts[key]
      : String(Number(currentStockQty) || 0);
    const stockQty = Number(rawValue);

    if (!Number.isFinite(stockQty) || stockQty < 0) {
      alert("Enter a valid stock quantity (0 or greater)");
      return;
    }

    setVariantUpdatingKey(key);
    try {
      // Second click (Save) persists stock value to backend and refreshes inventory view.
      await updateProductVariantStockQty(systemName, productId, sizeMM, stockQty);
      await loadProducts();
      setVariantStockDrafts(prev => ({ ...prev, [key]: String(stockQty) }));
      setActiveVariantEditKey("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update variant stock quantity");
    } finally {
      setVariantUpdatingKey("");
    }
  };

  if (loading) {
    return <PageWrapper><p>Loading products...</p></PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 style={{ marginBottom: "1rem" }}>Products Catalog</h1>
      <p style={{ marginBottom: "2rem", color: "#666", fontSize: "14px" }}>
        All available plumbing products with different sizes and prices
      </p>

      <div style={{
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "18px" }}>
          {editing ? "Edit Product" : "Manage Products"}
        </h2>

        {formError && (
          <div style={{ padding: "0.75rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px", marginBottom: "1rem" }}>
            {formError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>System</label>
            <select
              value={form.system}
              onChange={(e) => handleFormChange("system", e.target.value)}
              className="form-select"
              style={{ width: "100%" }}
              disabled={Boolean(editing)}
            >
              <option value="">Select system</option>
              {systems.map((system, idx) => (
                <option key={`${system.system}-${idx}`} value={system.system}>
                  {system.system}
                </option>
              ))}
              <option value="__new__">Add new system</option>
            </select>
          </div>

          {!editing && form.system === "__new__" && (
            <>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>New System Name</label>
                <input
                  value={form.newSystem}
                  onChange={(e) => handleFormChange("newSystem", e.target.value)}
                  className="form-input"
                  placeholder="e.g. HDPE"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Category</label>
                <input
                  value={form.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                  className="form-input"
                  placeholder="e.g. HDPE FITTINGS"
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Product Name</label>
            <input
              value={form.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              className="form-input"
              placeholder="Product name"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Unit</label>
            <input
              value={form.unit}
              onChange={(e) => handleFormChange("unit", e.target.value)}
              className="form-input"
              placeholder="pcs"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Length (m)</label>
            <input
              value={form.length_m}
              onChange={(e) => handleFormChange("length_m", e.target.value)}
              className="form-input"
              placeholder="Optional"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "15px" }}>Variants</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Size (mm)</label>
              <input
                value={form.size_mm}
                onChange={(e) => handleSizeMMChange(e.target.value)}
                className="form-input"
                placeholder="e.g. 20"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Size (inch)</label>
              <input
                value={form.size_inch}
                onChange={(e) => handleSizeInchChange(e.target.value)}
                className="form-input"
                placeholder="e.g. 1/2 or 1-1/4"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Price (Rs.)</label>
              <input
                value={form.price}
                onChange={(e) => handleFormChange("price", e.target.value)}
                className="form-input"
                placeholder="e.g. 25"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Stock Qty</label>
              <input
                value={form.stock_qty}
                onChange={(e) => handleFormChange("stock_qty", e.target.value)}
                className="form-input"
                placeholder="e.g. 100"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Reorder Level</label>
              <input
                value={form.reorder_level}
                onChange={(e) => handleFormChange("reorder_level", e.target.value)}
                className="form-input"
                placeholder="e.g. 20"
                style={{ width: "100%" }}
              />
            </div>
            <button onClick={handleAddVariant} style={{ height: "36px" }}>
              Add Variant
            </button>
          </div>

          {variants.length > 0 && (
            <div className="table-responsive" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Size (mm)</th>
                    <th>Size (inch)</th>
                    <th>Price (Rs.)</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, idx) => (
                    <tr key={`${variant.size_mm}-${idx}`}>
                      <td>{variant.size_mm}</td>
                      <td>{getVariantSizeInch(variant) ?? "-"}</td>
                      <td>{variant.price}</td>
                      <td>{variant.stock_qty ?? 0}</td>
                      <td>{variant.reorder_level ?? 0}</td>
                      <td>
                        <button onClick={() => handleRemoveVariant(idx)} style={{ padding: "4px 8px" }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={handleSaveProduct} disabled={saving}>
            {saving ? "Saving..." : (editing ? "Save Changes" : "Save Product")}
          </button>
          {editing && (
            <button
              onClick={resetForm}
              style={{ backgroundColor: "#eee", color: "#333" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {systems.length === 0 ? (
        <div style={{ backgroundColor: "#f5f5f5", padding: "2rem", textAlign: "center", borderRadius: "8px" }}>
          <p style={{ color: "#999" }}>No products available</p>
        </div>
      ) : (
        systems.map((system, idx) => (
          <div key={idx} style={{ marginBottom: "3rem" }}>
            {/* System Header */}
            <div style={{ 
              backgroundColor: "#2563eb", 
              color: "#fff", 
              padding: "1rem", 
              borderRadius: "6px",
              marginBottom: "1rem"
            }}>
              <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "bold" }}>
                {system.system}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "13px", opacity: "0.9" }}>
                {system.category}
              </p>
            </div>

            {/* Products Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {system.products.map((product, pIdx) => (
                <div key={pIdx} style={{ 
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  {/* Product Header */}
                  <div style={{ 
                    backgroundColor: "#f5f5f5", 
                    padding: "1rem",
                    borderBottom: "1px solid #ddd"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "16px", fontWeight: "600" }}>
                          {product.name}
                        </h3>
                        <div style={{ display: "flex", gap: "1rem", fontSize: "13px", color: "#666" }}>
                          <span>📦 Unit: <strong>{product.unit}</strong></span>
                          {product.length_m && <span>📏 Length: <strong>{product.length_m}m</strong></span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "start" }}>
                        <button
                          onClick={() => handleEditProduct(system.system, product)}
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(system.system, product)}
                          style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#fee", color: "#c33" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Variants Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ 
                      width: "100%", 
                      borderCollapse: "collapse",
                      fontSize: "13px"
                    }}>
                      <thead>
                        <tr>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "left", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Size (mm / inch)</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Price (₹)</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Stock</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Sold</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Available</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "center", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Status</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "center", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant, vIdx) => {
                          const variantRowKey = getVariantRowKey(system.system, product.id, variant.size_mm);
                          const isUpdatingThisVariant = variantUpdatingKey === variantRowKey;
                          const isEditingThisVariant = activeVariantEditKey === variantRowKey;
                          const soldQty = soldMap[getVariantKey(product.id, variant.size_mm)] || 0;
                          const stockQty = Number(variant.stock_qty) || 0;
                          const availableQty = stockQty - soldQty;
                          const reorderLevel = Number(variant.reorder_level) || 0;
                          const isLowStock = availableQty <= reorderLevel;

                          return (
                          <tr key={vIdx} style={{ borderBottom: "1px solid #ddd", backgroundColor: isLowStock ? "#fff7e6" : "transparent" }}>
                            <td style={{ padding: "10px" }}>
                              {`${variant.size_mm} mm / ${getVariantSizeInch(variant) || "-"}`}
                            </td>
                            <td style={{ padding: "10px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                              ₹{variant.price.toFixed(2)}
                            </td>
                            <td style={{ padding: "10px", textAlign: "right" }}>{stockQty}</td>
                            <td style={{ padding: "10px", textAlign: "right" }}>{soldQty}</td>
                            <td style={{ padding: "10px", textAlign: "right", fontWeight: "600", color: isLowStock ? "#d97706" : "#111827" }}>
                              {availableQty}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <span style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor: isLowStock ? "#fde68a" : "#dcfce7",
                                color: isLowStock ? "#92400e" : "#166534"
                              }}>
                                {isLowStock ? "Reorder" : "OK"}
                              </span>
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "center" }}>
                              {isEditingThisVariant ? (
                                <div style={{ display: "flex", justifyContent: "center", gap: "4px", alignItems: "center" }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={getVariantDraftValue(system.system, product.id, variant.size_mm, stockQty)}
                                    onChange={(e) => handleVariantDraftChange(system.system, product.id, variant.size_mm, e.target.value)}
                                    disabled={isUpdatingThisVariant}
                                    className="form-input"
                                    style={{ width: "4.5ch", padding: "3px 2px", fontSize: "12px", textAlign: "right" }}
                                  />
                                  <button
                                    onClick={() => handleUpdateSingleVariantStock(system.system, product.id, variant.size_mm, stockQty)}
                                    disabled={isUpdatingThisVariant}
                                    style={{ padding: "4px 8px", fontSize: "12px", lineHeight: 1.2 }}
                                  >
                                    {isUpdatingThisVariant ? "..." : "Save"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleUpdateSingleVariantStock(system.system, product.id, variant.size_mm, stockQty)}
                                  style={{ padding: "4px 8px", fontSize: "12px", lineHeight: 1.2 }}
                                >
                                  Update
                                </button>
                              )}
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{
        marginTop: "3rem",
        padding: "1.5rem",
        backgroundColor: "#f8f9fb",
        borderRadius: "6px",
        border: "1px solid #e4e6eb"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "14px", fontWeight: "600" }}>
          Product notes
        </h3>
        <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>
          New products are saved to the server and available immediately in billing. Sold quantity is calculated from invoices.
        </p>
      </div>
    </PageWrapper>
  );
}

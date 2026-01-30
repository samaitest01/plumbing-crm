import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import { fetchAllProducts, saveInvoice, fetchCustomers, createCustomer } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function CreateInvoice() {
  const navigate = useNavigate();
  const shop = {
    name: "National Traders",
    address: "Behind High School Ground, Pathri - 431506",
    owner: "Mujahid Shaikh",
    mobile: "9595918751"
  };

  const [systems, setSystems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [sizeMM, setSizeMM] = useState("");
  const [qty, setQty] = useState("");
  const [lineDiscount, setLineDiscount] = useState("");
  const [editId, setEditId] = useState(null);

  // 🔑 INVOICE META
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(null);
  
  // 💳 MOCKED PAYMENT FIELDS (For Record Keeping Only)
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [paymentMode, setPaymentMode] = useState("");
  const [amountRecorded, setAmountRecorded] = useState(0);

  useEffect(() => {
    fetchAllProducts().then(r => setSystems(r.data || []));
    fetchCustomers().then(r => setCustomers(r.data || []));
  }, []);

  const handleProductChange = e => {
    const id = e.target.value;
    setProductId(id);

    const all = systems.flatMap(s => s.products || []);
    const p = all.find(x => x.id === id);

    if (p) {
      setProductName(p.name);
      setVariants(p.variants);
      setProductSearch(p.name);
    } else {
      setVariants([]);
    }
  };

  const handleProductInputChange = (value) => {
    setProductSearch(value);

    const all = systems.flatMap(s => s.products || []);
    const p = all.find(x => x.name.toLowerCase() === value.toLowerCase());

    if (p) {
      setProductId(p.id);
      setProductName(p.name);
      setVariants(p.variants);
    } else {
      setProductId("");
      setProductName("");
      setVariants([]);
    }
  };

  const selectedVariant = variants.find(v => (
    v.size_label === sizeMM ||
    String(v.size_mm) === sizeMM
  ));

  const price = selectedVariant?.price || 0;

  const handleAddOrUpdate = () => {
    if (!productId || !sizeMM || !qty) return;

    const discountPct = Number(lineDiscount) || 0;
    const base = qty * price;
    const amount = base - (base * discountPct) / 100;

    const item = {
      id: editId || Date.now(),
      productId,
      productName,
      sizeMM: selectedVariant?.size_mm ?? (Number(sizeMM) || 0),
      sizeLabel: selectedVariant?.size_label || undefined,
      qty: Number(qty),
      price,
      discount: discountPct,
      baseAmount: base,
      amount
    };

    setItems(
      editId
        ? items.map(i => (i.id === editId ? item : i))
        : [...items, item]
    );

    setEditId(null);
    setProductId("");
    setProductName("");
    setProductSearch("");
    setVariants([]);
    setSizeMM("");
    setQty("");
    setLineDiscount("");
  };

  const handleEdit = i => {
    setEditId(i.id);
    setProductId(i.productId);
    setProductName(i.productName);
    setProductSearch(i.productName);
    setSizeMM(i.sizeLabel || String(i.sizeMM));
    setQty(i.qty);
    setLineDiscount(i.discount);

    const all = systems.flatMap(s => s.products || []);
    const p = all.find(x => x.id === i.productId);
    if (p) setVariants(p.variants);
  };


  const handleCustomerSelect = e => {
    const mobile = e.target.value;
    setSelectedCustomer(mobile);
    if (mobile) {
      const customer = customers.find(c => c.mobile === mobile);
      if (customer) {
        setCustomerName(customer.name);
        setCustomerMobile(customer.mobile);
      }
    } else {
      setCustomerName("");
      setCustomerMobile("");
    }
  };
  const handleDelete = id => {
    setItems(items.filter(i => i.id !== id));
  };

  const allProducts = systems.flatMap(s => s.products || []);
  const filteredProducts = productSearch
    ? allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts;

  const totalPrice = items.reduce((s, i) => s + i.baseAmount, 0);
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalDiscount = totalPrice - totalAmount;

  const handleSave = async () => {
    if (customerMobile.length !== 10) {
      alert("Mobile number must be 10 digits");
      return;
    }

    try {
      // Check if customer already exists
      const customerExists = customers.some(c => c.mobile === customerMobile);
      
      // If customer doesn't exist, create them
      if (!customerExists) {
        try {
          await createCustomer({ name: customerName, mobile: customerMobile });
          console.log("✅ Customer created successfully");
          // Refresh customer list
          const updatedCustomers = await fetchCustomers();
          setCustomers(updatedCustomers.data || []);
        } catch (customerErr) {
          console.error("❌ Customer creation error:", customerErr.response?.data || customerErr.message);
          alert("Customer creation failed: " + (customerErr.response?.data?.error || customerErr.message));
          return;
        }
      } else {
        console.log("✅ Customer already exists");
      }

      // Save invoice
      const res = await saveInvoice({
        customerName,
        customerMobile,
        items,
        subTotal: totalPrice,
        total: totalAmount,
        paymentStatus,
        paymentMode,
        amountRecorded: paymentStatus === "Recorded" ? totalAmount : Number(amountRecorded) || 0,
        balanceAmount: paymentStatus === "Recorded" ? 0 : totalAmount - (Number(amountRecorded) || 0)
      });

      setInvoiceId(res.data._id);
      setInvoiceDate(res.data.createdAt);
      alert("Invoice saved successfully");
      console.log("✅ Invoice saved:", res.data);
    } catch (err) {
      console.error("❌ Error saving invoice:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save invoice");
    }
  };
    const handleSaveInvoice = async () => {
    try {
      await axios.post("http://localhost:5000/api/invoices", {
        customerName,
        customerMobile,
        items: addedProducts,
        subTotal,
        total,
      });

      alert("Invoice saved");
      navigate("/invoices");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };


  return (
    <PageWrapper>

      {/* HEADER */}
      <div className="invoice-header">
        <div>
          <b>{shop.name}</b><br />
          {shop.address}
        </div>
        <div style={{ textAlign: "right" }}>
          {shop.owner}<br />{shop.mobile}
        </div>
      </div>

      <hr />

      {/* INVOICE META */}
      <div className="flex-row-between">
        <div>
          <b>Invoice No:</b>{" "}
          {invoiceId ? invoiceId.slice(-6) : "-"}
        </div>
        <div>
          <b>Date:</b>{" "}
          {invoiceDate ? new Date(invoiceDate).toDateString() : "-"}
        </div>
      </div>

      <hr />

      {/* CUSTOMER */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Select Customer</label>
          <select value={selectedCustomer} onChange={handleCustomerSelect} className="form-select" style={{ width: "100%" }}>
            <option value="">-- Select Customer --</option>
            {customers.map(c => (
              <option key={c.mobile} value={c.mobile}>
                {c.name} ({c.mobile})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ textAlign: "center", color: "#666", fontSize: "14px", fontWeight: "500" }}>OR</div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Name</label>
            <input
              placeholder="Name"
              value={customerName}
              onChange={e => {
                setCustomerName(e.target.value.replace(/[^a-zA-Z ]/g, ""));
                setSelectedCustomer("");
              }}
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Mobile</label>
            <input
              placeholder="Mobile"
              maxLength={10}
              value={customerMobile}
              onChange={e => {
                setCustomerMobile(e.target.value.replace(/[^0-9]/g, ""));
                setSelectedCustomer("");
              }}
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      <hr />

      {/* PRODUCT FORM */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem", alignItems: "flex-end" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Product</label>
          <input
            placeholder="Search or select product"
            value={productSearch}
            onChange={e => handleProductInputChange(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
            list="product-options"
          />
          <datalist id="product-options">
            {filteredProducts.map(p => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Size</label>
          <select value={sizeMM} onChange={e => setSizeMM(e.target.value)} className="form-select" style={{ width: "100%" }}>
            <option value="">Size</option>
            {variants.map(v =>
              <option key={`${v.size_mm}-${v.size_label || ""}`} value={v.size_label || String(v.size_mm)}>
                {v.size_label || `${v.size_mm} mm`}
              </option>
            )}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Qty</label>
          <input placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)} className="form-input" style={{ width: "100%" }} />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Disc %</label>
          <input placeholder="Disc %" value={lineDiscount} onChange={e => setLineDiscount(e.target.value)} className="form-input" style={{ width: "100%" }} />
        </div>

        <button onClick={handleAddOrUpdate} style={{ height: "36px" }}>{editId ? "Update" : "Add"}</button>
      </div>

      {/* TABLE */}
      <div className="table-responsive" style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Sl. No", "Product", "Size", "Qty", "Rate", "Disc%", "Amount", "Action"].map(h => (
                <th
                  key={h}
                  style={{
                    border: "2px solid #333",
                    padding: "10px",
                    backgroundColor: "#f5f5f5",
                    fontWeight: "600",
                    textAlign: h === "Product" ? "left" : "center",
                    minWidth: h === "Product" ? "200px" : "60px"
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ border: "1px solid #ccc", padding: "20px", textAlign: "center", color: "#999" }}>
                  No products added yet
                </td>
              </tr>
            ) : (
              items.map((i, index) => (
                <tr key={i.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{i.productName}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>{i.sizeLabel || `${i.sizeMM} mm`}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>{i.qty}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right" }}>₹{i.price.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>{i.discount}%</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600" }}>₹{i.amount.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                    <button onClick={() => handleEdit(i)} style={{ padding: "4px 8px", marginRight: "4px" }}>✏️</button>
                    <button onClick={() => handleDelete(i.id)} style={{ padding: "4px 8px" }}>❌</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        marginBottom: "2rem",
        marginTop: "2rem"
      }}>
        <div style={{ width: "100%", maxWidth: "400px", textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "14px" }}>
            <span>Total Price (Gross):</span>
            <span style={{ fontWeight: "600" }}>₹{totalPrice.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "14px" }}>
            <span>Total Discount:</span>
            <span style={{ fontWeight: "600" }}>₹{totalDiscount.toFixed(2)}</span>
          </div>
          <div style={{ 
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem", 
            fontSize: "16px", 
            fontWeight: "bold",
            paddingTop: "0.5rem",
            borderTop: "2px solid #333"
          }}>
            <span>Final Amount (Taxable):</span>
            <span style={{ color: "#2563eb" }}>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <hr />

      {/* PAYMENT SECTION - MOCKED (For Record Keeping Only) */}
      <h3 style={{ marginBottom: "1rem", fontSize: "16px", fontWeight: "bold" }}>
        Record Keeping Details
        <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginLeft: "10px" }}>
          (Information only - no actual payment processing)
        </span>
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>Payment Status</label>
          <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="form-select" style={{ width: "100%" }}>
            <option value="Pending">Pending</option>
            <option value="Recorded">Recorded</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>Payment Mode</label>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="form-select" style={{ width: "100%" }}>
            <option value="">-- Select Mode --</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {paymentStatus === "Pending" && (
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "14px" }}>Amount Recorded</label>
            <input 
              type="number" 
              value={amountRecorded} 
              onChange={e => setAmountRecorded(e.target.value)}
              placeholder="0"
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>

      <hr />

      <div className="buttons-container">
        <button onClick={handleSave}>Save Invoice</button>
        {invoiceId && (
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/invoices/${invoiceId}/pdf`}
            target="_blank"
            style={{ flex: 1, minWidth: 100 }}
          >
            <button>PDF</button>
          </a>
        )}
        <button onClick={() => window.print()}>Print</button>
      </div>

    </PageWrapper>
  );
}

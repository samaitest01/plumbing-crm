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
  const [sizeMM, setSizeMM] = useState("");
  const [qty, setQty] = useState("");
  const [lineDiscount, setLineDiscount] = useState("");
  const [editId, setEditId] = useState(null);

  // 🔑 INVOICE META
  const [invoiceId, setInvoiceId] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(null);

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
    } else {
      setVariants([]);
    }
  };

  const price =
    variants.find(v => v.size_mm === Number(sizeMM))?.price || 0;

  const handleAddOrUpdate = () => {
    if (!productId || !sizeMM || !qty) return;

    const discountPct = Number(lineDiscount) || 0;
    const base = qty * price;
    const amount = base - (base * discountPct) / 100;

    const item = {
      id: editId || Date.now(),
      productId,
      productName,
      sizeMM,
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
    setVariants([]);
    setSizeMM("");
    setQty("");
    setLineDiscount("");
  };

  const handleEdit = i => {
    setEditId(i.id);
    setProductId(i.productId);
    setProductName(i.productName);
    setSizeMM(i.sizeMM);
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
        total: totalAmount
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
      <div className="form-group">
        <select value={selectedCustomer} onChange={handleCustomerSelect} className="form-select">
          <option value="">-- Select Customer --</option>
          {customers.map(c => (
            <option key={c.mobile} value={c.mobile}>
              {c.name} ({c.mobile})
            </option>
          ))}
        </select>
        <span style={{ fontSize: "14px", color: "#666" }}>or</span>
        <input
          placeholder="Name"
          value={customerName}
          onChange={e => {
            setCustomerName(e.target.value.replace(/[^a-zA-Z ]/g, ""));
            setSelectedCustomer("");
          }}
          className="form-input"
        />
        <input
          placeholder="Mobile"
          maxLength={10}
          value={customerMobile}
          onChange={e => {
            setCustomerMobile(e.target.value.replace(/[^0-9]/g, ""));
            setSelectedCustomer("");
          }}
          className="form-input"
        />
      </div>

      <hr />

      {/* PRODUCT FORM */}
      <div className="form-group">
        <select value={productId} onChange={handleProductChange} className="form-select">
          <option value="">Product</option>
          {systems.flatMap(s => (s.products || [])).map(p =>
            <option key={p.id} value={p.id}>{p.name}</option>
          )}
        </select>

        <select value={sizeMM} onChange={e => setSizeMM(e.target.value)} className="form-select">
          <option value="">Size</option>
          {variants.map(v =>
            <option key={v.size_mm} value={v.size_mm}>{v.size_mm} mm</option>
          )}
        </select>

        <input placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)} className="form-input" />
        <input placeholder="Disc %" value={lineDiscount} onChange={e => setLineDiscount(e.target.value)} className="form-input" />

        <button onClick={handleAddOrUpdate}>{editId ? "Update" : "Add"}</button>
      </div>

      {/* TABLE */}
      <div className="table-responsive" style={{ marginTop: 15 }}>
        <table>
          <thead>
            <tr>
              {["Sl. No", "Product", "Size", "Qty", "Rate", "Disc%", "Amount", "Action"].map(h => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #ccc",
                    textAlign: h === "Product" ? "left" : "right"
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i, index) => (
              <tr key={i.id}>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{index + 1}</td>
                <td style={{ border: "1px solid #ccc" }}>{i.productName}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{i.sizeMM}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{i.qty}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{i.price}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{i.discount}</td>
                <td style={{ border: "1px solid #ccc", textAlign: "right" }}>{i.amount}</td>
                <td style={{ border: "1px solid #ccc" }}>
                  <button onClick={() => handleEdit(i)}>✏️</button>
                  <button onClick={() => handleDelete(i.id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div className="pricing-summary">
        <div>Total Price: ₹{totalPrice}</div>
        <div>Total Discount: ₹{totalDiscount}</div>
        <h3>Final Amount: ₹{totalAmount}</h3>
      </div>

      <div className="buttons-container">
        <button onClick={handleSave}>Save Invoice</button>
        {invoiceId && (
          <a
            href={`http://localhost:5000/api/invoices/${invoiceId}/pdf`}
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

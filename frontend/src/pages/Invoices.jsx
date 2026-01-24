import { useEffect, useState } from "react";
import axios from "axios";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/invoices")
      .then((res) => {
        const data = res.data || [];
        setInvoices(data);
        applyFiltersAndSort(data, searchTerm, filterStatus, sortOrder);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    applyFiltersAndSort(invoices, searchTerm, filterStatus, sortOrder);
  }, [searchTerm, filterStatus, sortOrder, invoices]);

  const applyFiltersAndSort = (data, search, status, sort) => {
    let result = data;

    // Search filter
    if (search) {
      result = result.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (status) {
      result = result.filter(inv => inv.paymentStatus === status);
    }

    // Sort
    if (sort === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    setFilteredInvoices(result);
  };

  const getWhatsAppLink = (inv) => {
    const message = `Hi ${inv.customerName}, your invoice #${inv.invoiceNumber} for ₹${inv.total} is ready. Click here to download: http://localhost:5000/api/invoices/${inv._id}/pdf`;
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${inv.customerMobile}?text=${encoded}`;
  };

  return (
    <div className="page-wrapper">
      <h2>Invoices</h2>

      {/* Search and Filter */}
      <div className="form-group" style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search by invoice number or customer name"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input-full"
          style={{ marginBottom: "0.5rem" }}
        />
        
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Balance">Balance</option>
          </select>

          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="form-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <p>No invoices found</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>{inv.customerName}</td>
                  <td>₹{inv.total}</td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: inv.paymentStatus === "Paid" ? "#d4edda" : "#fff3cd",
                      color: inv.paymentStatus === "Paid" ? "#155724" : "#856404",
                      fontWeight: "500"
                    }}>
                      {inv.paymentStatus || "Balance"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={`http://localhost:5000/api/invoices/${inv._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <button style={{ padding: "4px 8px", fontSize: "12px" }}>📄 PDF</button>
                    </a>
                    <a
                      href={getWhatsAppLink(inv)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <button style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#25d366" }}>💬 WhatsApp</button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

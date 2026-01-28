import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/api";
import PageWrapper from "../components/PageWrapper";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetchInvoices();
      // Handle both old format (array) and new format (object with invoices array)
      const data = Array.isArray(res.data) ? res.data : res.data.invoices || [];
      setInvoices(data);
      applyFiltersAndSort(data, searchTerm, filterStatus, sortOrder);
      setError("");
    } catch (err) {
      console.error("Fetch invoices error:", err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFiltersAndSort(invoices, searchTerm, filterStatus, sortOrder);
  }, [searchTerm, filterStatus, sortOrder, invoices]);

  const applyFiltersAndSort = (data, search, status, sort) => {
    let result = [...data];

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
    const message = `Hi ${inv.customerName}, your invoice #${inv.invoiceNumber} for ₹${inv.total} is ready. Click here to download: ${API_BASE_URL}/api/invoices/${inv._id}/pdf`;
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${inv.customerMobile}?text=${encoded}`;
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading invoices...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h2>Invoices</h2>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

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
            <option value="Recorded">Recorded</option>
            <option value="Pending">Pending</option>
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
                  <td>₹{inv.total?.toFixed(2)}</td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: inv.paymentStatus === "Recorded" ? "#d4edda" : "#fff3cd",
                      color: inv.paymentStatus === "Recorded" ? "#155724" : "#856404",
                      fontWeight: "500"
                    }}>
                      {inv.paymentStatus || "Pending"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={`${API_BASE_URL}/api/invoices/${inv._id}/pdf`}
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
                      <button style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#25d366", color: "white" }}>💬 WhatsApp</button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}

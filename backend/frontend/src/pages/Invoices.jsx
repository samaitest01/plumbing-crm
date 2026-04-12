import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInvoices, updateInvoicePayment } from "../services/api";
import PageWrapper from "../components/PageWrapper";
import { useSearchParams } from "react-router-dom";

const roundAmount = (value) => Math.round(Number(value) || 0);

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null);
  const invoiceDetailsRef = useRef(null);
  const invoiceDetailsPrimaryActionRef = useRef(null);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "Recorded",
    paymentMode: "Cash",
    additionalAmount: 0,
    balanceAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const getPaymentStatusLabel = (status) => (status === "Recorded" ? "Paid" : "Partial");

  const applyFiltersAndSort = useCallback((data, search, status, sort) => {
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
  }, []);

  const loadInvoices = useCallback(async () => {
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
  }, [applyFiltersAndSort, filterStatus, searchTerm, sortOrder]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    applyFiltersAndSort(invoices, searchTerm, filterStatus, sortOrder);
  }, [searchTerm, filterStatus, sortOrder, invoices, applyFiltersAndSort]);

  useEffect(() => {
    if (!invoices.length) return;

    const invoiceIdFromUrl = searchParams.get("invoiceId");
    if (!invoiceIdFromUrl) {
      setSelectedInvoiceDetails(null);
      return;
    }

    const matched = invoices.find(inv => inv._id === invoiceIdFromUrl);
    if (matched) {
      setSelectedInvoiceDetails(matched);
    }
  }, [invoices, searchParams]);

  useEffect(() => {
    if (selectedInvoiceDetails && invoiceDetailsRef.current) {
      invoiceDetailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      requestAnimationFrame(() => {
        invoiceDetailsPrimaryActionRef.current?.focus();
      });
    }
  }, [selectedInvoiceDetails]);

  const getWhatsAppLink = (inv) => {
    const date = new Date(inv.createdAt).toLocaleDateString('en-IN');
    const paidAmount = roundAmount(inv.amountRecorded || 0);
    const balance = roundAmount(inv.balanceAmount || 0);
    
    let message = `*INVOICE FROM NATIONAL TRADERS*\n\n`;
    message += `📋 *Invoice No:* ${inv.invoiceNumber}\n`;
    message += `📅 *Date:* ${date}\n`;
    message += `👤 *Customer:* ${inv.customerName}\n\n`;
    message += `💰 *Total Amount:* ₹${roundAmount(inv.total)}\n`;
    message += `✅ *Paid:* ₹${paidAmount}\n`;
    message += `⏳ *Balance:* ₹${balance}\n\n`;
    message += `*Payment Status:* ${getPaymentStatusLabel(inv.paymentStatus)}\n\n`;
    message += `_Note: For the PDF invoice, please visit our office or contact us at 9595918751_\n\n`;
    message += `Thank you for your business! 🙏`;
    
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${inv.customerMobile}?text=${encoded}`;
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const currentBalance = roundAmount(invoice.balanceAmount || invoice.total);
    setPaymentData({
      paymentStatus: "Recorded",
      paymentMode: invoice.paymentMode || "Cash",
      additionalAmount: 0,
      balanceAmount: currentBalance,
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  const handleOpenInvoiceDetails = (invoice) => {
    setSelectedInvoiceDetails(invoice);
    setSearchParams({ invoiceId: invoice._id });
  };

  const handleCloseInvoiceDetails = () => {
    setSelectedInvoiceDetails(null);
    setSearchParams({});
  };

  const handleUpdatePayment = async () => {
    try {
      const totalAmount = roundAmount(selectedInvoice.total);
      const existingRecordedAmount = roundAmount(selectedInvoice.amountRecorded);
      const additionalAmount = Math.max(roundAmount(paymentData.additionalAmount), 0);
      const recordedAmount = Math.min(existingRecordedAmount + additionalAmount, totalAmount);
      const balanceAmount = Math.max(totalAmount - recordedAmount, 0);
      const calculatedPaymentStatus = balanceAmount === 0 ? "Recorded" : "Pending";

      await updateInvoicePayment(selectedInvoice._id, {
        ...paymentData,
        paymentStatus: calculatedPaymentStatus,
        amountRecorded: recordedAmount,
        balanceAmount
      });
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      loadInvoices(); // Reload invoices
      alert("Payment status updated successfully!");
    } catch (err) {
      console.error("Update payment error:", err);
      alert("Failed to update payment status");
    }
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

      {selectedInvoiceDetails && (
        <div ref={invoiceDetailsRef} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", backgroundColor: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "1rem", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Invoice Details</h3>
            <button onClick={handleCloseInvoiceDetails} style={{ padding: "6px 10px", fontSize: "12px" }}>Close</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><strong>Invoice No:</strong> {selectedInvoiceDetails.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(selectedInvoiceDetails.createdAt).toLocaleDateString()}</div>
            <div><strong>Customer:</strong> {selectedInvoiceDetails.customerName}</div>
            <div><strong>Mobile:</strong> {selectedInvoiceDetails.customerMobile}</div>
            <div><strong>Total:</strong> ₹{roundAmount(selectedInvoiceDetails.total || 0)}</div>
            <div><strong>Paid:</strong> ₹{roundAmount(selectedInvoiceDetails.amountRecorded || 0)}</div>
            <div><strong>Balance:</strong> ₹{roundAmount(selectedInvoiceDetails.balanceAmount || 0)}</div>
            <div><strong>Status:</strong> {getPaymentStatusLabel(selectedInvoiceDetails.paymentStatus)}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={`${API_BASE_URL}/api/invoices/${selectedInvoiceDetails._id}/pdf`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button ref={invoiceDetailsPrimaryActionRef} style={{ padding: "6px 10px", fontSize: "12px" }}>📄 Open PDF</button>
            </a>
            {selectedInvoiceDetails.paymentStatus !== "Recorded" && (
              <button
                onClick={() => handleOpenPaymentModal(selectedInvoiceDetails)}
                style={{ padding: "6px 10px", fontSize: "12px", backgroundColor: "#28a745", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
              >
                💰 Update Payment
              </button>
            )}
          </div>
        </div>
      )}

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
            <option value="Recorded">Paid</option>
            <option value="Pending">Partial</option>
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
                  <td>
                    <button
                      onClick={() => handleOpenInvoiceDetails(inv)}
                      style={{ background: "none", border: "none", padding: 0, margin: 0, color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                      title="Open invoice details"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>{inv.customerName}</td>
                  <td>₹{roundAmount(inv.total)}</td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor: inv.paymentStatus === "Recorded" ? "#d4edda" : "#fff3cd",
                      color: inv.paymentStatus === "Recorded" ? "#155724" : "#856404",
                      fontWeight: "500"
                    }}>
                      {getPaymentStatusLabel(inv.paymentStatus)}
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
                    {inv.paymentStatus !== "Recorded" && (
                      <button 
                        onClick={() => handleOpenPaymentModal(inv)}
                        style={{ 
                          padding: "4px 8px", 
                          fontSize: "12px", 
                          backgroundColor: "#28a745", 
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "4px"
                        }}
                      >
                        💰 Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h3>Mark Invoice as Paid</h3>
            <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
            <p><strong>Customer:</strong> {selectedInvoice.customerName}</p>
            <p><strong>Total Amount:</strong> ₹{roundAmount(selectedInvoice.total)}</p>
            <p><strong>Already Recorded:</strong> ₹{roundAmount(selectedInvoice.amountRecorded || 0)}</p>
            <p><strong>Current Balance:</strong> ₹{roundAmount(selectedInvoice.balanceAmount || selectedInvoice.total)}</p>

            <div className="form-group">
              <label>Payment Mode</label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) => setPaymentData({...paymentData, paymentMode: e.target.value})}
                className="form-select"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Add New Recorded Amount</label>
              <input
                type="number"
                value={paymentData.additionalAmount}
                onChange={(e) => {
                  const totalAmount = roundAmount(selectedInvoice.total);
                  const existingRecordedAmount = roundAmount(selectedInvoice.amountRecorded);
                  const currentBalance = Math.max(totalAmount - existingRecordedAmount, 0);
                  const additional = Math.min(Math.max(roundAmount(e.target.value), 0), currentBalance);
                  const newTotalRecorded = Math.min(existingRecordedAmount + additional, totalAmount);
                  setPaymentData({
                    ...paymentData, 
                    additionalAmount: additional,
                    balanceAmount: Math.max(totalAmount - newTotalRecorded, 0)
                  });
                }}
                className="form-input-full"
              />
            </div>

            <div className="form-group">
              <label>New Total Recorded</label>
              <input
                type="number"
                value={Math.min(roundAmount(selectedInvoice.amountRecorded) + roundAmount(paymentData.additionalAmount), roundAmount(selectedInvoice.total))}
                readOnly
                className="form-input-full"
                style={{ backgroundColor: "#f5f5f5" }}
              />
            </div>

            <div className="form-group">
              <label>Balance Amount</label>
              <input
                type="number"
                value={paymentData.balanceAmount}
                readOnly
                className="form-input-full"
                style={{ backgroundColor: "#f5f5f5" }}
              />
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                className="form-input-full"
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button 
                onClick={handleUpdatePayment}
                style={{ flex: 1, padding: "0.75rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Update Payment
              </button>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                style={{ flex: 1, padding: "0.75rem", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

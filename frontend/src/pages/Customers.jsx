import { useEffect, useState } from "react";
import { fetchCustomers, createCustomer, fetchCustomerDetails, updateInvoicePayment } from "../services/api";
import PageWrapper from "../components/PageWrapper";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "Recorded",
    paymentMode: "Cash",
    amountRecorded: 0,
    balanceAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchCustomers();
      setCustomers(res.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch customers", err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!name || !mobile) {
      alert("Please enter name and mobile number");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Mobile must be a 10-digit number");
      return;
    }

    try {
      await createCustomer({ name, mobile });
      setName("");
      setMobile("");
      loadCustomers();
      alert("Customer added successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add customer");
    }
  };

  const loadCustomerDetails = async (customerMobile) => {
    setLoadingDetails(true);
    try {
      const res = await fetchCustomerDetails(customerMobile);
      setCustomerDetails(res.data);
      setSelectedCustomer(customerMobile);
    } catch (err) {
      alert("Failed to fetch customer details");
      console.error(err);
    }
    setLoadingDetails(false);
  };

  const handleViewDetails = async (customerMobile) => {
    await loadCustomerDetails(customerMobile);
  };

  const handleOpenPaymentModal = (invoice) => {
    const total = invoice.total || 0;
    const currentBalance = typeof invoice.balanceAmount === "number"
      ? invoice.balanceAmount
      : Math.max(total - (invoice.amountRecorded || 0), 0);

    setSelectedInvoice(invoice);
    setPaymentData({
      paymentStatus: currentBalance === 0 ? "Recorded" : "Pending",
      paymentMode: invoice.paymentMode || "Cash",
      amountRecorded: currentBalance,
      balanceAmount: Math.max(total - currentBalance, 0),
      paymentDate: new Date().toISOString().split("T")[0]
    });
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedInvoice) return;
    const total = selectedInvoice.total || 0;
    const recorded = Math.min(Number(paymentData.amountRecorded) || 0, total);
    const balanceAmount = Math.max(total - recorded, 0);
    const nextStatus = balanceAmount === 0 ? "Recorded" : paymentData.paymentStatus;

    try {
      await updateInvoicePayment(selectedInvoice._id, {
        paymentStatus: nextStatus,
        paymentMode: paymentData.paymentMode,
        amountRecorded: recorded,
        balanceAmount,
        paymentDate: paymentData.paymentDate
      });
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      await loadCustomerDetails(selectedCustomer);
      alert("Payment updated successfully");
    } catch (err) {
      console.error("Update payment error:", err);
      alert("Failed to update payment");
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading customers...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h2>Customers</h2>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "2rem" }} className="flex-col">
        <input
          placeholder="Customer Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="form-input-full"
        />
        <input
          placeholder="Mobile Number"
          maxLength="10"
          value={mobile}
          onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
          className="form-input-full"
        />
        <button onClick={handleAddCustomer}>Add Customer</button>
      </div>

      {!selectedCustomer ? (
        <>
          <h3>Existing Customers</h3>
          {customers.length === 0 ? (
            <p>No customers found</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.mobile}>
                      <td>{c.name}</td>
                      <td>{c.mobile}</td>
                      <td>
                        <button
                          onClick={() => handleViewDetails(c.mobile)}
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedCustomer(null)}
            style={{ marginBottom: "1rem" }}
          >
            ← Back to Customers
          </button>

          {loadingDetails ? (
            <p>Loading customer details...</p>
          ) : customerDetails ? (
            <>
              {/* Customer Info */}
              <div style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h3>{customerDetails.customer.name}</h3>
                <p><strong>Mobile:</strong> {customerDetails.customer.mobile}</p>
              </div>

              {/* Stats Cards */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <div style={{
                  flex: 1,
                  minWidth: "150px",
                  backgroundColor: "#e3f2fd",
                  padding: "1rem",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1976d2" }}>
                    {customerDetails.stats.totalInvoices}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Invoices</div>
                </div>

                <div style={{
                  flex: 1,
                  minWidth: "150px",
                  backgroundColor: "#f3e5f5",
                  padding: "1rem",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#7b1fa2" }}>
                    ₹{customerDetails.stats.totalBilled}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Billed</div>
                </div>

                <div style={{
                  flex: 1,
                  minWidth: "150px",
                  backgroundColor: "#d4edda",
                  padding: "1rem",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#155724" }}>
                    ₹{customerDetails.stats.totalPaid}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Paid</div>
                </div>

                <div style={{
                  flex: 1,
                  minWidth: "150px",
                  backgroundColor: "#fff3cd",
                  padding: "1rem",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#856404" }}>
                    ₹{customerDetails.stats.totalBalance}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Balance Due</div>
                </div>
              </div>

              {/* Invoice History */}
              <h3>Invoice History</h3>
              {customerDetails.invoices.length === 0 ? (
                <p>No invoices for this customer</p>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Recorded</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.invoices.map(inv => (
                        <tr key={inv._id}>
                          <td>{inv.invoiceNumber}</td>
                          <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td>₹{inv.total?.toFixed(2)}</td>
                          <td>₹{(inv.amountRecorded || 0).toFixed(2)}</td>
                          <td>₹{(inv.balanceAmount || (inv.total - (inv.amountRecorded || 0))).toFixed(2)}</td>
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
                          <td>
                            {(inv.balanceAmount || (inv.total - (inv.amountRecorded || 0))) > 0 ? (
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span style={{ color: "#666", fontSize: "12px" }}>Paid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {showPaymentModal && selectedInvoice && (
                <div style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}>
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "420px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                  }}>
                    <h3 style={{ marginTop: 0 }}>Update Payment</h3>
                    <div style={{ marginBottom: "1rem", fontSize: "14px", color: "#555" }}>
                      Invoice: {selectedInvoice.invoiceNumber}
                    </div>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "500" }}>Payment Mode</label>
                        <select
                          value={paymentData.paymentMode}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMode: e.target.value }))}
                          className="form-select"
                          style={{ width: "100%" }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "500" }}>Amount Paid</label>
                        <input
                          type="number"
                          min="0"
                          max={selectedInvoice.total || 0}
                          value={paymentData.amountRecorded}
                          onChange={(e) => {
                            const total = selectedInvoice.total || 0;
                            const amount = Math.min(Number(e.target.value) || 0, total);
                            setPaymentData(prev => ({
                              ...prev,
                              amountRecorded: amount,
                              balanceAmount: Math.max(total - amount, 0)
                            }));
                          }}
                          className="form-input"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "500" }}>Balance Amount</label>
                        <input
                          type="number"
                          value={(paymentData.balanceAmount || 0).toFixed(2)}
                          disabled
                          className="form-input"
                          style={{ width: "100%", backgroundColor: "#f5f5f5" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: "500" }}>Payment Date</label>
                        <input
                          type="date"
                          value={paymentData.paymentDate}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                          className="form-input"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                      <button onClick={handleUpdatePayment} style={{ flex: 1 }}>
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowPaymentModal(false);
                          setSelectedInvoice(null);
                        }}
                        style={{ flex: 1, backgroundColor: "#eee", color: "#333" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Unable to load customer details</p>
          )}
        </>
      )}
    </PageWrapper>
  );
}

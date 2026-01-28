import { useEffect, useState } from "react";
import { fetchCustomers, createCustomer, fetchCustomerDetails } from "../services/api";
import PageWrapper from "../components/PageWrapper";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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

  const handleViewDetails = async (customerMobile) => {
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

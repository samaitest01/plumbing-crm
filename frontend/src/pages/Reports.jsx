import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  fetchSalesTrends,
  fetchRevenueByCustomer,
  fetchRevenueByProduct,
  fetchPaymentStatus,
  fetchCustomerMetrics
} from "../services/api";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [salesTrends, setSalesTrends] = useState([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState([]);
  const [revenueByProduct, setRevenueByProduct] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [customerMetrics, setCustomerMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    fetchAllReports();
  }, [period]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [trends, byCustomer, byProduct, payment, metrics] = await Promise.all([
        fetchSalesTrends(period),
        fetchRevenueByCustomer(),
        fetchRevenueByProduct(),
        fetchPaymentStatus(),
        fetchCustomerMetrics()
      ]);

      setSalesTrends(trends.data || []);
      setRevenueByCustomer(byCustomer.data || []);
      setRevenueByProduct(byProduct.data || []);
      setPaymentStatus(payment.data || {});
      setCustomerMetrics(metrics.data || {});
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
    setLoading(false);
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "10px 20px",
        backgroundColor: activeTab === id ? "#2563eb" : "#f5f5f5",
        color: activeTab === id ? "#fff" : "#333",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.3s"
      }}
    >
      {label}
    </button>
  );

  const StatBox = ({ label, value, subText, color = "#2563eb" }) => (
    <div style={{
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      border: "1px solid #ddd",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "0.5rem", fontWeight: "500" }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color, marginBottom: "0.25rem" }}>
        {value}
      </div>
      {subText && <div style={{ fontSize: "12px", color: "#999" }}>{subText}</div>}
    </div>
  );

  if (loading) {
    return <PageWrapper><p>Loading reports...</p></PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 style={{ marginBottom: "0.5rem" }}>Reports & Analytics</h1>
      <p style={{ color: "#666", marginBottom: "2rem", fontSize: "14px" }}>
        Business insights and performance metrics
      </p>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <TabButton id="overview" label="📊 Overview" />
        <TabButton id="sales" label="💹 Sales Trends" />
        <TabButton id="customers" label="👥 Top Customers" />
        <TabButton id="products" label="📦 Top Products" />
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div>
          {/* Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <StatBox label="Total Revenue" value={`₹${customerMetrics?.totalRevenue || 0}`} />
            <StatBox label="Total Invoices" value={customerMetrics?.totalInvoices || 0} />
            <StatBox label="Average Order Value" value={`₹${customerMetrics?.averageOrderValue || 0}`} />
            <StatBox label="Total Customers" value={customerMetrics?.totalCustomers || 0} color="#10b981" />
          </div>

          <hr style={{ margin: "2rem 0" }} />

          {/* Payment Status */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "18px", fontWeight: "600" }}>Payment Status</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ backgroundColor: "#d4edda", padding: "1.5rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#155724", marginBottom: "0.5rem", fontWeight: "500" }}>Paid Invoices</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#155724", marginBottom: "0.5rem" }}>
                  {paymentStatus?.paidCount || 0}
                </div>
                <div style={{ fontSize: "13px", color: "#155724" }}>₹{paymentStatus?.paidAmount || 0}</div>
              </div>

              <div style={{ backgroundColor: "#fff3cd", padding: "1.5rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#856404", marginBottom: "0.5rem", fontWeight: "500" }}>Pending Invoices</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#856404", marginBottom: "0.5rem" }}>
                  {paymentStatus?.balanceCount || 0}
                </div>
                <div style={{ fontSize: "13px", color: "#856404" }}>₹{paymentStatus?.pendingAmount || 0}</div>
              </div>

              <div style={{ backgroundColor: "#f8d7da", padding: "1.5rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "13px", color: "#721c24", marginBottom: "0.5rem", fontWeight: "500" }}>Collection Rate</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#721c24", marginBottom: "0.5rem" }}>
                  {paymentStatus?.totalInvoices > 0 
                    ? ((paymentStatus.paidCount / paymentStatus.totalInvoices) * 100).toFixed(1) 
                    : 0}%
                </div>
              </div>
            </div>
          </div>

          <hr style={{ margin: "2rem 0" }} />

          {/* Top Customers */}
          <div>
            <h2 style={{ marginBottom: "1rem", fontSize: "18px", fontWeight: "600" }}>Top Customers by Revenue</h2>
            <div className="table-responsive">
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Customer</th>
                    <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "center", fontWeight: "600" }}>Invoices</th>
                    <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "right", fontWeight: "600" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {customerMetrics?.topCustomers?.map((customer, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #ccc", padding: "10px" }}>{customer.name}</td>
                      <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>{customer.invoices}</td>
                      <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600" }}>₹{customer.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALES TRENDS TAB */}
      {activeTab === "sales" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ marginRight: "1rem", fontWeight: "500" }}>Period:</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="form-select" style={{ width: "150px" }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="table-responsive">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "right", fontWeight: "600" }}>Sales Amount</th>
                </tr>
              </thead>
              <tbody>
                {salesTrends.map((trend, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{trend.date}</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                      ₹{trend.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div>
          <div className="table-responsive">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Customer Name</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "center", fontWeight: "600" }}>Invoices</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "right", fontWeight: "600" }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueByCustomer.map((customer, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{customer.name}</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>-</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                      ₹{customer.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP PRODUCTS TAB */}
      {activeTab === "products" && (
        <div>
          <div className="table-responsive">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Product</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "right", fontWeight: "600" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueByProduct.map((product, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{product.name}</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                      ₹{product.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

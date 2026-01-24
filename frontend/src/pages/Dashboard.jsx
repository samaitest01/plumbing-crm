import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayInvoices: 0,
    totalCustomers: 0,
    pendingBalance: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/invoices"),
        axios.get("http://localhost:5000/api/customers")
      ]);

      const invoices = invoicesRes.data || [];
      const customers = customersRes.data || [];

      // Calculate today's sales and invoices
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === today.getTime();
      });

      const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calculate pending balance
      const pendingBalance = invoices
        .filter(inv => inv.paymentStatus === "Balance")
        .reduce((sum, inv) => sum + (inv.total - (inv.amountPaid || 0)), 0);

      // Get recent invoices (last 5)
      const recent = invoices.slice(0, 5);

      setStats({
        todaySales: todaySales.toFixed(2),
        todayInvoices: todayInvoices.length,
        totalCustomers: customers.length,
        pendingBalance: pendingBalance.toFixed(2)
      });

      setRecentInvoices(recent);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon }) => (
    <div style={{
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      textAlign: "center",
      transition: "transform 0.2s, box-shadow 0.2s",
      border: "1px solid #f0f0f0"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{icon}</div>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "0.75rem", fontWeight: "500" }}>{title}</div>
      <div style={{ fontSize: "26px", fontWeight: "bold", color: "#2563eb" }}>{value}</div>
    </div>
  );

  if (loading) {
    return <div className="page-wrapper"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "28px" }}>CRM Dashboard</h1>
        <p style={{ color: "#666", fontSize: "14px" }}>Welcome to National Traders</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <StatCard title="Today's Sales" value={`₹${stats.todaySales}`} icon="💰" />
        <StatCard title="Today's Invoices" value={stats.todayInvoices} icon="📄" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon="👥" />
        <StatCard title="Pending Balance" value={`₹${stats.pendingBalance}`} icon="⏳" />
      </div>

      <hr style={{ margin: "2rem 0" }} />

      {/* Quick Navigation */}
      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "18px", fontWeight: "600" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <button onClick={() => navigate("/billing")} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "500" }}>
            ➕ Create Invoice
          </button>
          <button onClick={() => navigate("/invoices")} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "500" }}>
            📋 View Invoices
          </button>
          <button onClick={() => navigate("/customers")} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "500" }}>
            👥 Customers
          </button>
          <button onClick={() => navigate("/products")} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "500" }}>
            📦 Products
          </button>
        </div>
      </div>

      <hr style={{ margin: "2rem 0" }} />

      {/* Recent Invoices */}
      <div>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "18px", fontWeight: "600" }}>Recent Invoices</h2>
        {recentInvoices.length === 0 ? (
          <div style={{ 
            backgroundColor: "#f5f5f5", 
            padding: "2rem", 
            textAlign: "center", 
            borderRadius: "8px",
            color: "#999"
          }}>
            <p style={{ fontSize: "14px" }}>No invoices yet. <a href="/billing" style={{ color: "#2563eb", cursor: "pointer" }}>Create one now</a></p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Invoice No</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "left", fontWeight: "600" }}>Customer</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "center", fontWeight: "600" }}>Date</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "right", fontWeight: "600" }}>Amount</th>
                  <th style={{ border: "2px solid #333", padding: "10px", backgroundColor: "#f5f5f5", textAlign: "center", fontWeight: "600" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                      <span style={{ fontWeight: "600", color: "#2563eb" }}>{inv.invoiceNumber}</span>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{inv.customerName}</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center", fontSize: "13px" }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600" }}>
                      ₹{parseFloat(inv.total).toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: inv.paymentStatus === "Paid" ? "#d4edda" : "#fff3cd",
                        color: inv.paymentStatus === "Paid" ? "#155724" : "#856404",
                        display: "inline-block"
                      }}>
                        {inv.paymentStatus || "Balance"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

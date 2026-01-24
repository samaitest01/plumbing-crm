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
      flex: 1,
      minWidth: "200px",
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2563eb" }}>{value}</div>
    </div>
  );

  if (loading) {
    return <div className="page-wrapper"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="page-wrapper">
      <h1>CRM Dashboard</h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>Welcome to National Traders</p>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
        <StatCard title="Today's Sales" value={`₹${stats.todaySales}`} icon="💰" />
        <StatCard title="Today's Invoices" value={stats.todayInvoices} icon="📄" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon="👥" />
        <StatCard title="Pending Balance" value={`₹${stats.pendingBalance}`} icon="⏳" />
      </div>

      {/* Quick Navigation */}
      <div style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/billing")} style={{ flex: 1, minWidth: "150px" }}>
            ➕ Create Invoice
          </button>
          <button onClick={() => navigate("/invoices")} style={{ flex: 1, minWidth: "150px" }}>
            📋 View Invoices
          </button>
          <button onClick={() => navigate("/customers")} style={{ flex: 1, minWidth: "150px" }}>
            👥 Customers
          </button>
          <button onClick={() => navigate("/products")} style={{ flex: 1, minWidth: "150px" }}>
            📦 Products
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <h2 style={{ marginBottom: "1rem" }}>Recent Invoices</h2>
        {recentInvoices.length === 0 ? (
          <p style={{ color: "#666" }}>No invoices yet</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.customerName}</td>
                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td>₹{inv.total}</td>
                    <td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        backgroundColor: inv.paymentStatus === "Paid" ? "#d4edda" : "#fff3cd",
                        color: inv.paymentStatus === "Paid" ? "#155724" : "#856404"
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

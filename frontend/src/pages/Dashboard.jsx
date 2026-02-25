import { useEffect, useState } from "react";
import { fetchInvoices, fetchCustomers, fetchAllProducts } from "../services/api";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

const getVariantKey = (productId, sizeMM) => `${productId}__${Number(sizeMM).toFixed(2)}`;
const roundAmount = (value) => Math.round(Number(value) || 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayInvoices: 0,
    totalCustomers: 0,
    pendingBalance: 0,
    lowStockItems: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        fetchInvoices(),
        fetchCustomers(),
        fetchAllProducts()
      ]);

      // Handle both old format (array) and new format (object with invoices array)
      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.invoices || [];
      const customers = customersRes.data || [];
      const allProducts = productsRes.data || [];

      // Calculate today's sales and invoices
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === today.getTime();
      });

      const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Calculate pending balance (mock field)
      const pendingBalance = invoices
        .filter(inv => inv.paymentStatus === "Pending")
        .reduce((sum, inv) => sum + (inv.total - (inv.amountRecorded || 0)), 0);

      const soldMap = {};
      invoices.forEach((invoice) => {
        (invoice.items || []).forEach((item) => {
          const key = getVariantKey(item.productId, item.sizeMM);
          soldMap[key] = (soldMap[key] || 0) + (Number(item.qty) || 0);
        });
      });

      const lowStock = [];

      allProducts.forEach((system) => {
        (system.products || []).forEach((product) => {
          (product.variants || []).forEach((variant) => {
            const soldQty = soldMap[getVariantKey(product.id, variant.size_mm)] || 0;
            const stockQty = Number(variant.stock_qty) || 0;
            const reorderLevel = Number(variant.reorder_level) || 0;
            const availableQty = stockQty - soldQty;
            if (availableQty <= reorderLevel) {
              lowStock.push({
                key: `${product.id}-${variant.size_mm}`,
                productName: product.name,
                sizeLabel: `${variant.size_mm} mm / ${variant.size_inch || variant.size_label || "-"}`,
                stockQty,
                soldQty,
                availableQty,
                reorderLevel
              });
            }
          });
        });
      });

      // Get recent invoices (last 5)
      const recent = invoices.slice(0, 5);

      setStats({
        todaySales: roundAmount(todaySales),
        todayInvoices: todayInvoices.length,
        totalCustomers: customers.length,
        pendingBalance: roundAmount(pendingBalance),
        lowStockItems: lowStock.length
      });

      setRecentInvoices(recent);
      setLowStockList(lowStock.slice(0, 8));
      setError("");
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError("Failed to load dashboard data");
    } finally {
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
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading dashboard...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "28px" }}>CRM Dashboard</h1>
        <p style={{ color: "#666", fontSize: "14px" }}>Welcome to National Traders</p>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#fee", color: "#c33", borderRadius: "4px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <StatCard title="Today's Sales" value={`₹${stats.todaySales}`} icon="💰" />
        <StatCard title="Today's Invoices" value={stats.todayInvoices} icon="📄" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon="👥" />
        <StatCard title="Pending Records" value={`₹${stats.pendingBalance}`} icon="⏳" />
        <StatCard title="Low Stock Alerts" value={stats.lowStockItems} icon="📦" />
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

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", fontSize: "18px", fontWeight: "600" }}>Inventory Alerts</h2>
        {lowStockList.length === 0 ? (
          <div style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "8px", color: "#666" }}>
            All tracked variants are above reorder level.
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "left" }}>Product</th>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}>Size</th>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "right" }}>Stock</th>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "right" }}>Sold</th>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "right" }}>Available</th>
                  <th style={{ border: "1px solid #333", padding: "8px", textAlign: "right" }}>Reorder At</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((item) => (
                  <tr key={item.key} style={{ backgroundColor: "#fff7e6" }}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.productName}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>{item.sizeLabel}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>{item.stockQty}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>{item.soldQty}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: "700", color: "#b45309" }}>{item.availableQty}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>{item.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                      <button
                        onClick={() => navigate(`/invoices?invoiceId=${inv._id}`)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          fontWeight: "600",
                          color: "#2563eb",
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                        title="Open invoice details"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{inv.customerName}</td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center", fontSize: "13px" }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "right", fontWeight: "600" }}>
                      ₹{roundAmount(inv.total || 0)}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: inv.paymentStatus === "Recorded" ? "#d4edda" : "#fff3cd",
                        color: inv.paymentStatus === "Recorded" ? "#155724" : "#856404",
                        display: "inline-block"
                      }}>
                        {inv.paymentStatus === "Recorded" ? "Paid" : "Partial"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

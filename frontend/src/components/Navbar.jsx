import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={{ 
      padding: "10px 15px", 
      background: "#1f2937", 
      display: "flex", 
      gap: "2rem", 
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      {/* Left Navigation */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <Link style={{ color: "#fff", fontSize: "16px", fontWeight: "600", textDecoration: "none", transition: "color 0.3s" }} to="/">
          🏠 Dashboard
        </Link>
        <Link style={{ color: "#fff", fontSize: "14px", textDecoration: "none", transition: "color 0.3s" }} to="/billing">
          📝 Billing
        </Link>
        <Link style={{ color: "#fff", fontSize: "14px", textDecoration: "none", transition: "color 0.3s" }} to="/invoices">
          📋 Invoices
        </Link>
        <Link style={{ color: "#fff", fontSize: "14px", textDecoration: "none", transition: "color 0.3s" }} to="/customers">
          👥 Customers
        </Link>
        <Link style={{ color: "#fff", fontSize: "14px", textDecoration: "none", transition: "color 0.3s" }} to="/products">
          📦 Products
        </Link>
        <Link style={{ color: "#fff", fontSize: "14px", textDecoration: "none", transition: "color 0.3s" }} to="/reports">
          📊 Reports
        </Link>
      </div>

      {/* Right User Info */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {user && (
          <>
            <div style={{ color: "#fff", fontSize: "13px" }}>
              <span>{user.name}</span>
              <span style={{ marginLeft: "0.5rem", backgroundColor: "#374151", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                padding: "6px 12px",
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

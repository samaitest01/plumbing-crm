import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: 10, background: "#1f2937", display: "flex", gap: 20 }}>
      <Link style={{ color: "#fff" }} to="/billing">Billing</Link>
      <Link style={{ color: "#fff" }} to="/invoices">Invoices</Link>
      <Link style={{ color: "#fff" }} to="/customers">Customers</Link>
    </nav>
  );
}

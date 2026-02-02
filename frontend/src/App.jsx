import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

// COMMENTED OUT: Authentication disabled for development
// function ProtectedRoute({ children }) {
//   const { user, loading } = useContext(AuthContext);
//   
//   if (loading) {
//     return <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>;
//   }
//   
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
//   
//   return children;
// }

export default function App() {
  // const { user } = useContext(AuthContext); // COMMENTED OUT: Auth disabled

  return (
    <>
      <Navbar />

      <Routes>
        {/* COMMENTED OUT: Login disabled for development */}
        {/* <Route path="/login" element={<Login />} /> */}
        
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/billing" element={<CreateInvoice />} />
        
        <Route path="/invoices" element={<Invoices />} />
        
        <Route path="/customers" element={<Customers />} />
        
        <Route path="/products" element={<Products />} />
        
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </>
  );
}

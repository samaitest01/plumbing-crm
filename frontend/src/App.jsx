import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import Customers from "./pages/Customers";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/billing" />} />
        <Route path="/billing" element={<CreateInvoice />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/customers" element={<Customers />} />
      </Routes>
    </>
  );
}

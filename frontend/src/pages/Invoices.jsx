import { useEffect, useState } from "react";
import axios from "axios";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/invoices")
      .then((res) => setInvoices(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page-wrapper">
      <h2>Invoices</h2>

      {invoices.length === 0 ? (
        <p>No invoices found</p>
      ) : (
        <div className="table-responsive">
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td>{inv.customerName}</td>
                  <td>₹{inv.total}</td>
                  <td>
                    <a
                      href={`http://localhost:5000/api/invoices/${inv._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button>PDF</button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

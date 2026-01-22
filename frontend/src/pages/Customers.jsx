import { useEffect, useState } from "react";
import axios from "axios";

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/customers")
      .then(r => setCustomers(r.data || []));
  }, []);

  return (
    <div>
      <h2>Customers</h2>
      {customers.map(c => (
        <div key={c.mobile}>
          {c.name} – {c.mobile}
        </div>
      ))}
    </div>
  );
}

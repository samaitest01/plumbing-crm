import { useEffect, useState } from "react";
import { fetchCustomers, createCustomer } from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const loadCustomers = async () => {
    try {
      const res = await fetchCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!name || !mobile || mobile.length !== 10) {
      alert("Please enter valid name and 10-digit mobile number");
      return;
    }

    try {
      await createCustomer({ name, mobile });
      setName("");
      setMobile("");
      loadCustomers();
      alert("Customer added successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add customer");
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>Customers</h2>

      <div style={{ marginBottom: "20px" }} className="flex-col">
        <input
          placeholder="Customer Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="form-input-full"
        />
        <input
          placeholder="Mobile Number"
          maxLength="10"
          value={mobile}
          onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
          className="form-input-full"
        />
        <button onClick={handleAddCustomer}>Add Customer</button>
      </div>

      <h3>Existing Customers</h3>
      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.mobile}>
                  <td>{c.name}</td>
                  <td>{c.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

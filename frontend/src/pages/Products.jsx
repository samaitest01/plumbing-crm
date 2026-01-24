export default function Products() {
  return (
    <div className="page-wrapper">
      <h2>Products</h2>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <input placeholder="Product Name" className="form-input" />
        <input placeholder="Price" type="number" className="form-input" />
        <button>Add</button>
      </div>

      <ul>
        <li>PVC Pipe – ₹120</li>
        <li>Tap – ₹350</li>
      </ul>
    </div>
  );
}

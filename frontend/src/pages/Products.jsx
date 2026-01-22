export default function Products() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Products</h2>

      <form style={{ marginBottom: 20 }}>
        <input placeholder="Product Name" />
        <input placeholder="Price" type="number" style={{ marginLeft: 10 }} />
        <button style={{ marginLeft: 10 }}>Add</button>
      </form>

      <ul>
        <li>PVC Pipe – ₹120</li>
        <li>Tap – ₹350</li>
      </ul>
    </div>
  );
}

import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import { fetchAllProducts } from "../services/api";

export default function Products() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllProducts()
      .then(res => {
        setSystems(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <PageWrapper><p>Loading products...</p></PageWrapper>;
  }

  return (
    <PageWrapper>
      <h1 style={{ marginBottom: "1rem" }}>Products Catalog</h1>
      <p style={{ marginBottom: "2rem", color: "#666", fontSize: "14px" }}>
        All available plumbing products with different sizes and prices
      </p>

      {systems.length === 0 ? (
        <div style={{ backgroundColor: "#f5f5f5", padding: "2rem", textAlign: "center", borderRadius: "8px" }}>
          <p style={{ color: "#999" }}>No products available</p>
        </div>
      ) : (
        systems.map((system, idx) => (
          <div key={idx} style={{ marginBottom: "3rem" }}>
            {/* System Header */}
            <div style={{ 
              backgroundColor: "#2563eb", 
              color: "#fff", 
              padding: "1rem", 
              borderRadius: "6px",
              marginBottom: "1rem"
            }}>
              <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "bold" }}>
                {system.system}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "13px", opacity: "0.9" }}>
                {system.category}
              </p>
            </div>

            {/* Products Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {system.products.map((product, pIdx) => (
                <div key={pIdx} style={{ 
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  {/* Product Header */}
                  <div style={{ 
                    backgroundColor: "#f5f5f5", 
                    padding: "1rem",
                    borderBottom: "1px solid #ddd"
                  }}>
                    <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "16px", fontWeight: "600" }}>
                      {product.name}
                    </h3>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "13px", color: "#666" }}>
                      <span>📦 Unit: <strong>{product.unit}</strong></span>
                      {product.length_m && <span>📏 Length: <strong>{product.length_m}m</strong></span>}
                    </div>
                  </div>

                  {/* Variants Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ 
                      width: "100%", 
                      borderCollapse: "collapse",
                      fontSize: "13px"
                    }}>
                      <thead>
                        <tr>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "left", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Size (mm)</th>
                          <th style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            borderBottom: "2px solid #333",
                            backgroundColor: "#f0f0f0",
                            fontWeight: "600"
                          }}>Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant, vIdx) => (
                          <tr key={vIdx} style={{ borderBottom: "1px solid #ddd" }}>
                            <td style={{ padding: "10px" }}>{variant.size_mm}</td>
                            <td style={{ padding: "10px", textAlign: "right", fontWeight: "600", color: "#2563eb" }}>
                              ₹{variant.price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: "3rem", 
        padding: "1.5rem", 
        backgroundColor: "#fffbea",
        borderLeft: "4px solid #f59e0b",
        borderRadius: "4px"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "14px", fontWeight: "600", color: "#d97706" }}>
          📝 How to Manage Products
        </h3>
        <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>
          Products are stored in <code style={{ backgroundColor: "#fff", padding: "2px 6px", borderRadius: "3px" }}>backend/data/products.json</code>. 
          Edit this file to add, remove, or update products and their variants. The app will automatically load the updated products.
        </p>
      </div>
    </PageWrapper>
  );
}

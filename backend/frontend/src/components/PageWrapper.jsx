export default function PageWrapper({ children }) {
  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "30px auto",
        backgroundColor: "#ffffff",
        padding: "25px",
        borderRadius: "6px"
      }}
    >
      {children}
    </div>
  );
}

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/customers", require("./routes/customers.routes"));
app.get("/", (req, res) => {
  res.send("Plumbing CRM Backend Running");
});

app.use("/api/products", require("./routes/products.routes"));
app.use("/api/invoices", require("./routes/invoices.routes"));
app.use("/api/reports", require("./routes/reports.routes"));

module.exports = app;

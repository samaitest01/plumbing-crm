const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  customerName: String,
  customerMobile: String,

  items: [
    {
      productName: String,
      sizeMM: Number,
      qty: Number,
      price: Number,
      discount: Number,
      baseAmount: Number,
      amount: Number
    }
  ],

  subTotal: Number,
  total: Number,

  createdAt: { type: Date, default: Date.now }
});

// 🔴 IMPORTANT: no custom `id` field
module.exports = mongoose.model("Invoice", InvoiceSchema);

const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, sparse: true },
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
  
  // Payment fields
  paymentStatus: { 
    type: String, 
    enum: ["Paid", "Balance"], 
    default: "Balance" 
  },
  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Other", ""],
    default: ""
  },
  paymentDate: { type: Date },
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to generate unique short invoice number
InvoiceSchema.pre('save', async function() {
  if (!this.invoiceNumber) {
    let isUnique = false;
    let invoiceNumber;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      attempts++;
      const letters = Math.random().toString(36).substring(2, 4).toUpperCase();
      const numbers = Math.floor(Math.random() * 999999)
        .toString()
        .padStart(5, '0');
      invoiceNumber = `${letters}${numbers}`;
      
      // Check if invoice number already exists
      const existing = await this.constructor.findOne({ invoiceNumber });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.invoiceNumber = invoiceNumber;
  }
});

// 🔴 IMPORTANT: no custom `id` field
module.exports = mongoose.model("Invoice", InvoiceSchema);

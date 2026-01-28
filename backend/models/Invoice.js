const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, sparse: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },

  items: [
    {
      productName: { type: String, required: true },
      sizeMM: { type: Number, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      baseAmount: { type: Number, required: true },
      amount: { type: Number, required: true }
    }
  ],

  subTotal: { type: Number, required: true },
  total: { type: Number, required: true },
  
  // MOCKED Payment fields - For record keeping only, no actual payment processing
  paymentStatus: { 
    type: String, 
    enum: ["Recorded", "Pending"], 
    default: "Pending",
    description: "Mock field for tracking payment records only"
  },
  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Other", ""],
    default: "",
    description: "Mock field - no actual payment processing"
  },
  paymentDate: { type: Date },
  amountRecorded: { type: Number, default: 0, description: "Mock field - amount recorded in books" },
  balanceAmount: { type: Number, default: 0, description: "Mock field - balance for record keeping" },

  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add indexes for better query performance
InvoiceSchema.index({ customerMobile: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ createdAt: -1 });

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

module.exports = mongoose.model("Invoice", InvoiceSchema);

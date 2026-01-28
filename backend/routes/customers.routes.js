const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    console.error("Fetch customers error:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/:mobile", async (req, res) => {
  try {
    const { mobile } = req.params;
    const customer = await Customer.findOne({ mobile });
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get customer invoices
    const invoices = await Invoice.find({ customerMobile: mobile }).sort({ createdAt: -1 });
    
    // Calculate totals
    const totalInvoices = invoices.length;
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalRecorded = invoices
      .filter(inv => inv.paymentStatus === "Recorded")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPending = invoices
      .filter(inv => inv.paymentStatus === "Pending")
      .reduce((sum, inv) => sum + (inv.total - (inv.amountRecorded || 0)), 0);

    res.json({
      customer,
      invoices,
      stats: {
        totalInvoices,
        totalBilled: totalBilled.toFixed(2),
        totalRecorded: totalRecorded.toFixed(2),
        totalPending: totalPending.toFixed(2)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, mobile } = req.body;
    
    // Validation
    if (!name || !mobile) {
      return res.status(400).json({ error: "Name and mobile are required" });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Mobile must be a 10-digit number" });
    }

    const customer = await Customer.create({ name, mobile });
    res.status(201).json(customer);
  } catch (err) {
    console.error("Create customer error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Customer with this mobile number already exists" });
    }
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: "Failed to create customer" });
  }
});

module.exports = router;

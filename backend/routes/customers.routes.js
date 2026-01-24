const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

router.get("/", async (req, res) => {
  res.json(await Customer.find());
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
    const totalPaid = invoices
      .filter(inv => inv.paymentStatus === "Paid")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalBalance = invoices
      .filter(inv => inv.paymentStatus === "Balance")
      .reduce((sum, inv) => sum + (inv.total - (inv.amountPaid || 0)), 0);

    res.json({
      customer,
      invoices,
      stats: {
        totalInvoices,
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalBalance: totalBalance.toFixed(2)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const customer = await Customer.create({ name, mobile });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

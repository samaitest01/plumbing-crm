const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const PDFDocument = require("pdfkit");

// SAVE INVOICE
router.post("/", async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    console.error("SAVE INVOICE ERROR:", err);
    res.status(500).json({ message: "Invoice save failed" });
  }
});

// GET ALL INVOICES
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

// PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).send("Invoice not found");

    const safe = (n) => (typeof n === "number" ? n : 0);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // HEADER
    doc.fontSize(20).text(
      "National Traders",
      { align: "center" }
    );
    doc.fontSize(10).text(
      "Behind High School Ground, Pathri - 431506\nMujahid Shaikh | 9595918751",
      { align: "center" }
    );

    doc.moveDown();
    doc.fontSize(14).text("INVOICE", { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Invoice ID: ${invoice._id}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Customer: ${invoice.customerName}`);
    doc.text(`Mobile: ${invoice.customerMobile}`);

    doc.moveDown();

    // TABLE HEADER
    doc.fontSize(10).text(
      "Product        Size   Qty   Price   Disc%   Amount"
    );
    doc.text(
      "------------------------------------------------------------"
    );

    invoice.items.forEach((item) => {
      const amount = safe(item.amount);
      doc.text(
        `${item.productName}   ${item.sizeMM}   ${item.qty}   ${safe(
          item.price
        )}   ${safe(item.discount)}   ${amount.toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.text(`Subtotal: ${safe(invoice.subTotal).toFixed(2)}`);
    doc.text(`Total: ${safe(invoice.total).toFixed(2)}`);

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("PDF error");
  }
});

module.exports = router;

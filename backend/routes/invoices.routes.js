const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const PDFDocument = require("pdfkit");

// SAVE INVOICE
router.post("/", async (req, res) => {
  try {
    const { customerName, customerMobile, items, subTotal, total } = req.body;

    // Validation
    if (!customerName || !customerMobile) {
      return res.status(400).json({ message: "Customer name and mobile are required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    if (!subTotal || !total) {
      return res.status(400).json({ message: "Subtotal and total are required" });
    }

    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    console.error("SAVE INVOICE ERROR:", err.message);
    let errorMsg = "Invoice save failed";
    if (err.code === 11000) {
      errorMsg = "Invoice number already exists, please try again";
    } else if (err.name === "ValidationError") {
      errorMsg = Object.values(err.errors).map(e => e.message).join(", ");
    }
    res.status(500).json({ message: errorMsg, error: err.message });
  }
});

// GET ALL INVOICES
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Invoice.countDocuments();

    res.json({
      invoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalInvoices: total,
        hasMore: skip + invoices.length < total
      }
    });
  } catch (err) {
    console.error("Fetch invoices error:", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// UPDATE PAYMENT STATUS
router.patch("/:id/payment", async (req, res) => {
  try {
    const { paymentStatus, paymentMode, amountRecorded, balanceAmount, paymentDate } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update payment fields
    if (paymentStatus !== undefined) invoice.paymentStatus = paymentStatus;
    if (paymentMode !== undefined) invoice.paymentMode = paymentMode;
    if (amountRecorded !== undefined) invoice.amountRecorded = amountRecorded;
    if (balanceAmount !== undefined) invoice.balanceAmount = balanceAmount;
    if (paymentDate !== undefined) invoice.paymentDate = paymentDate;

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).send("Invoice not found");

    const safe = (n) => (typeof n === "number" ? n : 0);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const pageWidth = 535; // A4 width - margins
    const leftMargin = 30;
    let currentY = 30;

    // HEADER
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#000").text("National Traders", { align: "center" });
    doc.fontSize(9).font("Helvetica").fillColor("#000").text("Behind High School Ground, Pathri - 431506 | Mujahid Shaikh | 9595918751", { align: "center" });
    
    currentY = doc.y + 10;

    // INVOICE TITLE
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#000");
    doc.text("INVOICE", leftMargin, currentY);
    
    currentY = doc.y + 8;
    
    // Draw info box with black border
    const infoBoxHeight = 50;
    doc.lineWidth(1.5).strokeColor("#000").fillColor("#fff");
    doc.rect(leftMargin, currentY, pageWidth, infoBoxHeight).fillAndStroke();
    
    doc.fontSize(8).font("Helvetica").fillColor("#000");
    const col1 = leftMargin + 10;
    const col2 = leftMargin + 200;
    const col3 = leftMargin + 350;
    
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, col1, currentY + 5);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, col2, currentY + 5);
    doc.text(`Customer: ${invoice.customerName}`, col1, currentY + 20);
    doc.text(`Mobile: ${invoice.customerMobile}`, col2, currentY + 20);
    doc.text(`Status: ${invoice.paymentStatus || 'Pending'}`, col3, currentY + 5);
    doc.text(`Mode: ${invoice.paymentMode || 'N/A'}`, col3, currentY + 20);
    
    currentY += infoBoxHeight + 12;

    // ITEMS TABLE
    const tableTop = currentY;
    const headerHeight = 18;
    const rowHeight = 16;
    
    // Column widths
    const colSr = 30;
    const colParticulars = 230;
    const colQty = 40;
    const colRate = 55;
    const colGross = 55;
    const colDisc = 45;
    const colTaxable = 60;
    
    let colX = leftMargin;
    const columns = [
      { width: colSr, label: "Sr", align: "center" },
      { width: colParticulars, label: "Particulars", align: "left" },
      { width: colQty, label: "Qty", align: "center" },
      { width: colRate, label: "Rate", align: "right" },
      { width: colGross, label: "Gross", align: "right" },
      { width: colDisc, label: "Disc%", align: "center" },
      { width: colTaxable, label: "Taxable", align: "right" }
    ];

    // Header row with black background
    doc.lineWidth(1).strokeColor("#000").fillColor("#000");
    doc.rect(leftMargin, tableTop, pageWidth, headerHeight).fillAndStroke();
    
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#fff");
    colX = leftMargin;
    columns.forEach(col => {
      doc.text(col.label, colX + 3, tableTop + 3, { width: col.width - 6, align: col.align });
      colX += col.width;
    });

    // Data rows
    currentY = tableTop + headerHeight;
    doc.fontSize(7).font("Helvetica").fillColor("#000");
    
    invoice.items.forEach((item, idx) => {
      const baseAmount = safe(item.baseAmount);
      const finalAmount = safe(item.amount);
      const sizeLabel = item.sizeLabel || `${item.sizeMM}mm`;
      
      doc.lineWidth(0.5).strokeColor("#000").fillColor("#fff");
      doc.rect(leftMargin, currentY, pageWidth, rowHeight).fillAndStroke();
      
      // Draw cells
      colX = leftMargin;
      
      // Sr
      doc.text((idx + 1).toString(), colX + 3, currentY + 2, { width: colSr - 6, align: "center" });
      colX += colSr;
      
      // Particulars
      doc.text(`${item.productName} (${sizeLabel})`, colX + 3, currentY + 2, { width: colParticulars - 6, ellipsis: true });
      colX += colParticulars;
      
      // Qty
      doc.text(item.qty.toString(), colX + 3, currentY + 2, { width: colQty - 6, align: "center" });
      colX += colQty;
      
      // Rate
      doc.text(safe(item.price).toFixed(2), colX + 3, currentY + 2, { width: colRate - 6, align: "right" });
      colX += colRate;
      
      // Gross
      doc.text(baseAmount.toFixed(2), colX + 3, currentY + 2, { width: colGross - 6, align: "right" });
      colX += colGross;
      
      // Disc%
      doc.text(safe(item.discount).toString(), colX + 3, currentY + 2, { width: colDisc - 6, align: "center" });
      colX += colDisc;
      
      // Taxable
      doc.text(finalAmount.toFixed(2), colX + 3, currentY + 2, { width: colTaxable - 6, align: "right" });
      
      currentY += rowHeight;
    });

    // TOTALS SECTION
    currentY += 2;
    const summaryRowHeight = 16;
    const summaryBoxWidth = pageWidth;
    
    // Subtotal row
    doc.lineWidth(0.5).strokeColor("#000").fillColor("#fff");
    doc.rect(leftMargin, currentY, summaryBoxWidth, summaryRowHeight).fillAndStroke();
    doc.fontSize(8).font("Helvetica").fillColor("#000");
    doc.text("Subtotal (Gross):", leftMargin + 5, currentY + 2);
    doc.text(`Rs. ${safe(invoice.subTotal).toFixed(2)}`, leftMargin + 5, currentY + 2, { width: summaryBoxWidth - 10, align: "right" });
    
    currentY += summaryRowHeight;
    
    // Discount row
    doc.lineWidth(0.5).strokeColor("#000").fillColor("#fff");
    doc.rect(leftMargin, currentY, summaryBoxWidth, summaryRowHeight).fillAndStroke();
    doc.fontSize(8).font("Helvetica").fillColor("#000");
    doc.text("Total Discount:", leftMargin + 5, currentY + 2);
    doc.text(`Rs. ${(safe(invoice.subTotal) - safe(invoice.total)).toFixed(2)}`, leftMargin + 5, currentY + 2, { width: summaryBoxWidth - 10, align: "right" });
    
    currentY += summaryRowHeight;
    
    // Total Amount row - Bold with black border
    doc.lineWidth(1).strokeColor("#000").fillColor("#fff");
    doc.rect(leftMargin, currentY, summaryBoxWidth, summaryRowHeight + 2).fillAndStroke();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text("TOTAL AMOUNT:", leftMargin + 5, currentY + 2);
    doc.text(`Rs. ${safe(invoice.total).toFixed(2)}`, leftMargin + 5, currentY + 2, { width: summaryBoxWidth - 10, align: "right" });
    
    currentY += summaryRowHeight + 2;
    
    // PAYMENT DETAILS SECTION
    currentY += 8;
    const paymentBoxHeight = 55;
    
    doc.lineWidth(1).strokeColor("#000").fillColor("#fff");
    doc.rect(leftMargin, currentY, summaryBoxWidth, paymentBoxHeight).fillAndStroke();
    
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text("PAYMENT DETAILS", leftMargin + 5, currentY + 3);
    
    // Internal divider line
    doc.lineWidth(0.5).strokeColor("#000");
    doc.moveTo(leftMargin, currentY + 15).lineTo(leftMargin + summaryBoxWidth, currentY + 15).stroke();
    
    currentY += 18;
    doc.fontSize(8).font("Helvetica").fillColor("#000");
    
    const paymentCol1 = leftMargin + 5;
    const paymentCol2 = leftMargin + summaryBoxWidth / 2;
    
    doc.text(`Status: ${invoice.paymentStatus || "N/A"}`, paymentCol1, currentY);
    doc.text(`Amount Paid: Rs. ${safe(invoice.amountRecorded).toFixed(2)}`, paymentCol2, currentY);
    
    currentY += 15;
    doc.text(`Payment Mode: ${invoice.paymentMode || "N/A"}`, paymentCol1, currentY);
    doc.text(`Balance Due: Rs. ${safe(invoice.balanceAmount).toFixed(2)}`, paymentCol2, currentY);

    // Footer
    currentY += 30;
    doc.fontSize(7).font("Helvetica").fillColor("#666");
    doc.text("This is a computer-generated invoice. Payment information is for record keeping only.", leftMargin, currentY, { align: "center", width: pageWidth });
    
    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("PDF error");
  }
});

module.exports = router;

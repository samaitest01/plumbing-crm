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
    console.error("SAVE INVOICE ERROR:", err.message);
    let errorMsg = "Invoice save failed";
    if (err.code === 11000) {
      errorMsg = "Invoice number already exists, please try again";
    }
    res.status(500).json({ message: errorMsg, error: err.message });
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
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Customer: ${invoice.customerName}`);
    doc.text(`Mobile: ${invoice.customerMobile}`);

    doc.moveDown();

    // TABLE WITH DETAILED FORMAT (Sr No, Particulars, Qty, Rate, Gross, Disc%, Taxable)
    const tableTop = doc.y;
    const pageWidth = 595; // A4 width in points
    const leftMargin = 40;
    const rightMargin = 40;
    
    // Column positions and widths
    const col1Start = leftMargin;      // Sr No
    const col2Start = col1Start + 25;  // Particulars
    const col3Start = col2Start + 280; // Qty
    const col4Start = col3Start + 40;  // Rate
    const col5Start = col4Start + 50;  // Gross
    const col6Start = col5Start + 55;  // Disc%
    const col7Start = col6Start + 50;  // Taxable
    
    const col1Width = 25;
    const col2Width = 280;
    const col3Width = 40;
    const col4Width = 50;
    const col5Width = 55;
    const col6Width = 50;
    const col7Width = 50;
    
    const rowHeight = 20;

    // Table Header with borders
    doc.lineWidth(1).strokeColor("#000");
    doc.fillColor("#fff");
    
    // Draw header row cells
    doc.rect(col1Start, tableTop, col1Width, rowHeight).fillAndStroke();
    doc.rect(col2Start, tableTop, col2Width, rowHeight).fillAndStroke();
    doc.rect(col3Start, tableTop, col3Width, rowHeight).fillAndStroke();
    doc.rect(col4Start, tableTop, col4Width, rowHeight).fillAndStroke();
    doc.rect(col5Start, tableTop, col5Width, rowHeight).fillAndStroke();
    doc.rect(col6Start, tableTop, col6Width, rowHeight).fillAndStroke();
    doc.rect(col7Start, tableTop, col7Width, rowHeight).fillAndStroke();

    doc.fillColor("#000");
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Sr", col1Start + 2, tableTop + 4, { width: col1Width - 4, align: "center" });
    doc.text("Particulars", col2Start + 5, tableTop + 4, { width: col2Width - 10 });
    doc.text("Qty", col3Start + 2, tableTop + 4, { width: col3Width - 4, align: "center" });
    doc.text("Rate", col4Start + 2, tableTop + 4, { width: col4Width - 4, align: "center" });
    doc.text("Gross", col5Start + 2, tableTop + 4, { width: col5Width - 4, align: "center" });
    doc.text("Disc%", col6Start + 2, tableTop + 4, { width: col6Width - 4, align: "center" });
    doc.text("Taxable", col7Start + 2, tableTop + 4, { width: col7Width - 4, align: "center" });

    doc.font("Helvetica");
    let currentY = tableTop + rowHeight;

    // Table Rows with borders
    invoice.items.forEach((item, idx) => {
      const baseAmount = safe(item.baseAmount);
      const finalAmount = safe(item.amount);
      
      // Draw row cells with borders
      doc.lineWidth(1).strokeColor("#000").fillColor("#fff");
      doc.rect(col1Start, currentY, col1Width, rowHeight).fillAndStroke();
      doc.rect(col2Start, currentY, col2Width, rowHeight).fillAndStroke();
      doc.rect(col3Start, currentY, col3Width, rowHeight).fillAndStroke();
      doc.rect(col4Start, currentY, col4Width, rowHeight).fillAndStroke();
      doc.rect(col5Start, currentY, col5Width, rowHeight).fillAndStroke();
      doc.rect(col6Start, currentY, col6Width, rowHeight).fillAndStroke();
      doc.rect(col7Start, currentY, col7Width, rowHeight).fillAndStroke();

      // Draw text
      doc.fillColor("#000").fontSize(8);
      doc.text((idx + 1).toString(), col1Start + 2, currentY + 3, { width: col1Width - 4, align: "center" });
      doc.text(`${item.productName} (${item.sizeMM}mm)`, col2Start + 5, currentY + 3, { width: col2Width - 10, ellipsis: true });
      doc.text(item.qty.toString(), col3Start + 2, currentY + 3, { width: col3Width - 4, align: "center" });
      doc.text(safe(item.price).toFixed(2), col4Start + 2, currentY + 3, { width: col4Width - 4, align: "right" });
      doc.text(baseAmount.toFixed(2), col5Start + 2, currentY + 3, { width: col5Width - 4, align: "right" });
      doc.text(safe(item.discount).toString(), col6Start + 2, currentY + 3, { width: col6Width - 4, align: "center" });
      doc.text(finalAmount.toFixed(2), col7Start + 2, currentY + 3, { width: col7Width - 4, align: "right" });
      
      currentY += rowHeight;
    });

    // Totals section with proper spacing
    currentY += 10;
    doc.fontSize(10).font("Helvetica");
    
    doc.text("Subtotal (Gross):", leftMargin, currentY);
    doc.text(`₹${safe(invoice.subTotal).toFixed(2)}`, leftMargin + 350, currentY, { width: 150, align: "right" });
    
    currentY += 18;
    doc.text("Total Discount:", leftMargin, currentY);
    doc.text(`₹${(safe(invoice.subTotal) - safe(invoice.total)).toFixed(2)}`, leftMargin + 350, currentY, { width: 150, align: "right" });
    
    currentY += 18;
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Total (Taxable):", leftMargin, currentY);
    doc.text(`₹${safe(invoice.total).toFixed(2)}`, leftMargin + 350, currentY, { width: 150, align: "right" });

    // PAYMENT DETAILS SECTION
    currentY += 25;
    doc.fontSize(12).font("Helvetica-Bold").text("PAYMENT DETAILS", leftMargin, currentY);
    
    currentY += 18;
    doc.fontSize(10).font("Helvetica");
    doc.text(`Payment Status: ${invoice.paymentStatus || "N/A"}`, leftMargin, currentY);
    
    currentY += 15;
    doc.text(`Payment Mode: ${invoice.paymentMode || "N/A"}`, leftMargin, currentY);
    
    currentY += 15;
    doc.text(`Amount Paid: ₹${safe(invoice.amountPaid).toFixed(2)}`, leftMargin, currentY);
    
    currentY += 15;
    doc.text(`Balance Due: ₹${safe(invoice.balanceDue).toFixed(2)}`, leftMargin, currentY);

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).send("PDF error");
  }
});

module.exports = router;

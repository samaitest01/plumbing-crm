const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const { protect, allowRoles } = require("./auth.middleware");

// GET SALES TRENDS (Daily/Monthly)
router.get("/sales-trends", protect, allowRoles("ADMIN"), async (req, res) => {
  try {
    const { period } = req.query; // daily, weekly, monthly
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    let trends = {};

    invoices.forEach(inv => {
      let key;
      const date = new Date(inv.createdAt);

      if (period === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (period === "monthly") {
        key = date.toISOString().slice(0, 7); // YYYY-MM
      } else {
        key = date.toISOString().split("T")[0]; // YYYY-MM-DD
      }

      trends[key] = (trends[key] || 0) + (inv.total || 0);
    });

    const data = Object.entries(trends).map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2))
    }));

    res.json(data);
  } catch (err) {
    console.error("Sales trends error:", err);
    res.status(500).json({ message: "Failed to fetch sales trends" });
  }
});

// GET REVENUE BY CUSTOMER
router.get("/revenue-by-customer", protect, allowRoles("ADMIN"), async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const revenueMap = {};

    invoices.forEach(inv => {
      const customer = inv.customerName;
      revenueMap[customer] = (revenueMap[customer] || 0) + (inv.total || 0);
    });

    const data = Object.entries(revenueMap)
      .map(([name, revenue]) => ({
        name,
        revenue: parseFloat(revenue.toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 customers

    res.json(data);
  } catch (err) {
    console.error("Revenue by customer error:", err);
    res.status(500).json({ message: "Failed to fetch revenue data" });
  }
});

// GET REVENUE BY PRODUCT
router.get("/revenue-by-product", protect, allowRoles("ADMIN"), async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const productMap = {};

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = `${item.productName} (${item.sizeMM}mm)`;
        productMap[key] = (productMap[key] || 0) + (item.amount || 0);
      });
    });

    const data = Object.entries(productMap)
      .map(([name, revenue]) => ({
        name,
        revenue: parseFloat(revenue.toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json(data);
  } catch (err) {
    console.error("Revenue by product error:", err);
    res.status(500).json({ message: "Failed to fetch product revenue" });
  }
});

// GET PAYMENT STATUS SUMMARY
router.get("/payment-status", protect, allowRoles("ADMIN"), async (req, res) => {
  try {
    const invoices = await Invoice.find();

    const summary = {
      totalInvoices: invoices.length,
      paidCount: 0,
      balanceCount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    invoices.forEach(inv => {
      if (inv.paymentStatus === "Paid") {
        summary.paidCount++;
        summary.paidAmount += inv.total || 0;
      } else {
        summary.balanceCount++;
        summary.pendingAmount += (inv.total - (inv.amountPaid || 0)) || 0;
      }
    });

    res.json({
      ...summary,
      paidAmount: parseFloat(summary.paidAmount.toFixed(2)),
      pendingAmount: parseFloat(summary.pendingAmount.toFixed(2))
    });
  } catch (err) {
    console.error("Payment status error:", err);
    res.status(500).json({ message: "Failed to fetch payment status" });
  }
});

// GET CUSTOMER METRICS
router.get("/customer-metrics", protect, allowRoles("ADMIN"), async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const customers = await Customer.find();

    const metrics = {
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
      totalRevenue: 0,
      averageOrderValue: 0,
      topCustomers: []
    };

    const customerMap = {};

    invoices.forEach(inv => {
      metrics.totalRevenue += inv.total || 0;
      const mobile = inv.customerMobile;
      if (!customerMap[mobile]) {
        customerMap[mobile] = {
          name: inv.customerName,
          invoices: 0,
          revenue: 0
        };
      }
      customerMap[mobile].invoices++;
      customerMap[mobile].revenue += inv.total || 0;
    });

    metrics.averageOrderValue = metrics.totalInvoices > 0 
      ? metrics.totalRevenue / metrics.totalInvoices 
      : 0;

    metrics.topCustomers = Object.values(customerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(c => ({
        ...c,
        revenue: parseFloat(c.revenue.toFixed(2))
      }));

    metrics.totalRevenue = parseFloat(metrics.totalRevenue.toFixed(2));
    metrics.averageOrderValue = parseFloat(metrics.averageOrderValue.toFixed(2));

    res.json(metrics);
  } catch (err) {
    console.error("Customer metrics error:", err);
    res.status(500).json({ message: "Failed to fetch customer metrics" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

router.get("/", async (req, res) => {
  res.json(await Customer.find());
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

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const loadProducts = () => {
  const filePath = path.join(__dirname, "..", "data", "products.json");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
};

// GET all products
router.get("/", (req, res) => {
  try {
    const products = loadProducts();
    res.json(products);
  } catch (err) {
    console.error("Failed to load products.json", err);
    res.status(500).json({ message: "Failed to load products" });
  }
});

// GET products by system (CPVC / UPVC / SWR)
router.get("/:system", (req, res) => {
  const system = req.params.system.toUpperCase();
  let products = [];

  try {
    products = loadProducts();
  } catch (err) {
    console.error("Failed to load products.json", err);
    return res.status(500).json({ message: "Failed to load products" });
  }

  const result = products.find(p => p.system === system);

  if (!result) {
    return res.status(404).json({ message: "System not found" });
  }

  res.json(result);
});

module.exports = router;

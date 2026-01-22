const express = require("express");
const router = express.Router();
const products = require("../data/products");

// GET all products
router.get("/", (req, res) => {
  res.json(products);
});

// GET products by system (CPVC / UPVC / SWR)
router.get("/:system", (req, res) => {
  const system = req.params.system.toUpperCase();
  const result = products.find(p => p.system === system);

  if (!result) {
    return res.status(404).json({ message: "System not found" });
  }

  res.json(result);
});

module.exports = router;

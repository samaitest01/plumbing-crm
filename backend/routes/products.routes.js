const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const productsFilePath = path.join(__dirname, "..", "data", "products.json");
const MM_PER_INCH = 25.4;

const roundTo = (value, decimals) => Number(value.toFixed(decimals));

const normalizeVariant = (variant) => {
  const sizeMMInput = Number(variant.size_mm);
  const sizeInchInput = Number(variant.size_inch);
  const price = Number(variant.price);
  const stockQtyInput = Number(variant.stock_qty);
  const reorderLevelInput = Number(variant.reorder_level);

  const hasSizeMM = Number.isFinite(sizeMMInput) && sizeMMInput > 0;
  const hasSizeInch = Number.isFinite(sizeInchInput) && sizeInchInput > 0;

  if ((!hasSizeMM && !hasSizeInch) || !Number.isFinite(price)) {
    throw new Error("Invalid variant size or price");
  }

  const sizeMM = hasSizeMM ? sizeMMInput : roundTo(sizeInchInput * MM_PER_INCH, 2);
  const sizeInch = hasSizeInch ? sizeInchInput : roundTo(sizeMM / MM_PER_INCH, 3);

  const entry = {
    size_mm: sizeMM,
    size_inch: sizeInch,
    price,
    stock_qty: Number.isFinite(stockQtyInput) && stockQtyInput >= 0 ? stockQtyInput : 0,
    reorder_level: Number.isFinite(reorderLevelInput) && reorderLevelInput >= 0 ? reorderLevelInput : 0
  };

  if (variant.size_label) {
    entry.size_label = String(variant.size_label);
  }

  return entry;
};

const loadProducts = () => {
  const raw = fs.readFileSync(productsFilePath, "utf8");
  return JSON.parse(raw);
};

const writeProducts = (products) => {
  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), "utf8");
};

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "");

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

// CREATE product
router.post("/", (req, res) => {
  try {
    const { system, category, product } = req.body || {};

    if (!system || !product || !product.name) {
      return res.status(400).json({ message: "System and product name are required" });
    }

    const systemKey = system.toString().trim().toUpperCase();
    const productName = product.name.toString().trim();
    if (!productName) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length === 0) {
      return res.status(400).json({ message: "At least one variant is required" });
    }

    const normalizedVariants = variants.map(normalizeVariant);

    const products = loadProducts();
    let targetSystem = products.find((entry) => entry.system === systemKey);
    if (!targetSystem) {
      if (!category) {
        return res.status(400).json({ message: "Category is required for new systems" });
      }
      targetSystem = {
        system: systemKey,
        category: String(category).trim(),
        products: []
      };
      products.push(targetSystem);
    }

    const productId = slugify(productName);
    const exists = targetSystem.products.some((entry) =>
      entry.id === productId || entry.name.toLowerCase() === productName.toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ message: "Product already exists" });
    }

    const newProduct = {
      id: productId,
      name: productName,
      unit: product.unit ? String(product.unit).trim() : "pcs",
      variants: normalizedVariants
    };

    if (product.length_m !== undefined && product.length_m !== null && product.length_m !== "") {
      const length = Number(product.length_m);
      if (!Number.isFinite(length)) {
        return res.status(400).json({ message: "Invalid length" });
      }
      newProduct.length_m = length;
    }

    targetSystem.products.push(newProduct);
    writeProducts(products);

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Failed to create product", err);
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
});

// UPDATE product
router.put("/:system/:productId", (req, res) => {
  try {
    const systemKey = req.params.system.toUpperCase();
    const productId = req.params.productId;
    const { product } = req.body || {};

    if (!product) {
      return res.status(400).json({ message: "Product payload is required" });
    }

    const products = loadProducts();
    const targetSystem = products.find((entry) => entry.system === systemKey);
    if (!targetSystem) {
      return res.status(404).json({ message: "System not found" });
    }

    const productIndex = targetSystem.products.findIndex((entry) => entry.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = targetSystem.products[productIndex];
    const name = product.name ? String(product.name).trim() : existing.name;
    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    let variants = existing.variants;
    if (product.variants) {
      if (!Array.isArray(product.variants) || product.variants.length === 0) {
        return res.status(400).json({ message: "At least one variant is required" });
      }
      variants = product.variants.map(normalizeVariant);
    }

    const newId = slugify(name);
    const duplicate = targetSystem.products.some((entry, idx) =>
      idx !== productIndex && (entry.id === newId || entry.name.toLowerCase() === name.toLowerCase())
    );
    if (duplicate) {
      return res.status(409).json({ message: "Product already exists" });
    }

    const updated = {
      ...existing,
      id: newId,
      name,
      unit: product.unit ? String(product.unit).trim() : existing.unit,
      variants
    };

    if (Object.prototype.hasOwnProperty.call(product, "length_m")) {
      if (product.length_m === "" || product.length_m === null) {
        delete updated.length_m;
      } else {
        const length = Number(product.length_m);
        if (!Number.isFinite(length)) {
          return res.status(400).json({ message: "Invalid length" });
        }
        updated.length_m = length;
      }
    }

    targetSystem.products[productIndex] = updated;
    writeProducts(products);
    res.json(updated);
  } catch (err) {
    console.error("Failed to update product", err);
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
});

// DELETE product
router.delete("/:system/:productId", (req, res) => {
  try {
    const systemKey = req.params.system.toUpperCase();
    const productId = req.params.productId;

    const products = loadProducts();
    const targetSystem = products.find((entry) => entry.system === systemKey);
    if (!targetSystem) {
      return res.status(404).json({ message: "System not found" });
    }

    const beforeCount = targetSystem.products.length;
    targetSystem.products = targetSystem.products.filter((entry) => entry.id !== productId);
    if (targetSystem.products.length === beforeCount) {
      return res.status(404).json({ message: "Product not found" });
    }

    writeProducts(products);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Failed to delete product", err);
    res.status(500).json({ message: err.message || "Failed to delete product" });
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

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const productsFilePath = path.join(__dirname, "..", "data", "products.json");
const MM_PER_INCH = 25.4;

const roundTo = (value, decimals) => Number(value.toFixed(decimals));

// Greatest common divisor used to simplify inch fractions (e.g. 8/16 -> 1/2).
const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

// Converts decimal inch values into readable plumbing fractions (up to 1/16 precision).
const formatInchFraction = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";

  const whole = Math.floor(numeric);
  const fractional = numeric - whole;
  const denominator = 16;
  const numeratorRaw = Math.round(fractional * denominator);

  if (numeratorRaw === 0) {
    return whole ? String(whole) : "0";
  }

  if (numeratorRaw === denominator) {
    return String(whole + 1);
  }

  const divisor = gcd(numeratorRaw, denominator);
  const numerator = numeratorRaw / divisor;
  const reducedDenominator = denominator / divisor;

  if (!whole) {
    return `${numerator}/${reducedDenominator}`;
  }

  return `${whole}-${numerator}/${reducedDenominator}`;
};

// Accepts inch input in decimal, fraction, or mixed-fraction format.
// Examples: 0.5, 1/2, 1-1/4
const parseInchInput = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const normalized = raw.replace(/\s+/g, "");
  const mixedMatch = normalized.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (Number.isFinite(whole) && Number.isFinite(num) && Number.isFinite(den) && den > 0 && num > 0) {
      return whole + num / den;
    }
  }

  const fracMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0 && num > 0) {
      return num / den;
    }
  }

  return null;
};

// Normalized string format used for storage and display consistency.
const normalizeInchValue = (value) => {
  const parsed = parseInchInput(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return formatInchFraction(parsed);
};

// Ensures every variant saved to products.json has validated, consistent fields.
const normalizeVariant = (variant) => {
  const sizeMMInput = Number(variant.size_mm);
  const sizeInchInput = parseInchInput(variant.size_inch);
  const legacyLabelInchInput = parseInchInput(variant.size_label);
  const inchInput = Number.isFinite(sizeInchInput) ? sizeInchInput : legacyLabelInchInput;
  const price = Number(variant.price);
  const stockQtyInput = Number(variant.stock_qty);
  const reorderLevelInput = Number(variant.reorder_level);

  const hasSizeMM = Number.isFinite(sizeMMInput) && sizeMMInput > 0;
  const hasSizeInch = Number.isFinite(inchInput) && inchInput > 0;

  if ((!hasSizeMM && !hasSizeInch) || !Number.isFinite(price)) {
    throw new Error("Invalid variant size or price");
  }

  const sizeMM = hasSizeMM ? sizeMMInput : roundTo(inchInput * MM_PER_INCH, 2);
  const sizeInch = hasSizeInch ? formatInchFraction(inchInput) : formatInchFraction(sizeMM / MM_PER_INCH);

  const entry = {
    size_mm: sizeMM,
    size_inch: sizeInch,
    price,
    stock_qty: Number.isFinite(stockQtyInput) && stockQtyInput >= 0 ? stockQtyInput : 0,
    reorder_level: Number.isFinite(reorderLevelInput) && reorderLevelInput >= 0 ? reorderLevelInput : 0
  };

  const normalizedLegacyLabel = normalizeInchValue(variant.size_label);
  if (normalizedLegacyLabel) {
    entry.size_label = normalizedLegacyLabel;
  }

  return entry;
};

// File-backed storage helpers (this project uses JSON file catalog, not Mongo for products).
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

// UPDATE stock quantity for one variant
router.patch("/:system/:productId/variants/:sizeMM/stock", (req, res) => {
  try {
    const systemKey = req.params.system.toUpperCase();
    const productId = req.params.productId;
    const sizeMM = Number(req.params.sizeMM);
    const stockQty = Number(req.body?.stock_qty);

    if (!Number.isFinite(sizeMM) || sizeMM <= 0) {
      return res.status(400).json({ message: "Valid sizeMM is required" });
    }

    if (!Number.isFinite(stockQty) || stockQty < 0) {
      return res.status(400).json({ message: "Valid stock_qty (0 or greater) is required" });
    }

    const products = loadProducts();
    const targetSystem = products.find((entry) => entry.system === systemKey);
    if (!targetSystem) {
      return res.status(404).json({ message: "System not found" });
    }

    const targetProduct = (targetSystem.products || []).find((entry) => entry.id === productId);
    if (!targetProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const targetVariant = (targetProduct.variants || []).find((variant) => Number(variant.size_mm) === sizeMM);
    if (!targetVariant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    targetVariant.stock_qty = stockQty;
    writeProducts(products);

    res.json({
      message: "Variant stock quantity updated",
      productId,
      size_mm: sizeMM,
      stock_qty: stockQty
    });
  } catch (err) {
    console.error("Failed to update variant stock quantity", err);
    res.status(500).json({ message: "Failed to update variant stock quantity" });
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

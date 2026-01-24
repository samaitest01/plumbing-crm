const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, 'apollo_products_extracted.json');
const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Create CSV header
const csvHeader = 'Category,Item Code,Description,Price (₹)';

// Create CSV rows
const csvRows = products.map(product => {
  const category = `"${product.category.replace(/"/g, '""')}"`;
  const itemCode = `"${product.itemCode.replace(/"/g, '""')}"`;
  const description = `"${product.description.replace(/"/g, '""')}"`;
  const price = product.price;
  
  return `${category},${itemCode},${description},${price}`;
});

// Combine header and rows
const csvContent = [csvHeader, ...csvRows].join('\n');

// Write to CSV file
const csvPath = path.join(__dirname, 'apollo_products.csv');
fs.writeFileSync(csvPath, csvContent, 'utf8');

console.log(`\n✅ CSV file created successfully!`);
console.log(`📁 File: apollo_products.csv`);
console.log(`📊 Total products: ${products.length}`);
console.log(`📋 Columns: Category, Item Code, Description, Price`);

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'Apollo Price List_Brochure_June 2025.xlsx');
const workbook = XLSX.readFile(filePath);

const products = [];

// Extract from each sheet
workbook.SheetNames.forEach((sheetName) => {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  // Find category name (usually in first non-empty rows)
  let categoryName = sheetName;
  let categoryFound = false;
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.some(cell => cell && cell.toString().trim().length > 5)) {
      const cellText = row.find(cell => cell && cell.toString().trim().length > 0);
      if (cellText && cellText.toString().includes('CODE') || cellText.toString().includes('Description')) {
        continue; // Skip header rows
      }
      if (cellText && cellText.toString().trim()) {
        categoryName = cellText.toString().trim();
        categoryFound = true;
        break;
      }
    }
  }
  
  // Parse products from rows
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;
    
    const itemCode = row[0]?.toString().trim() || '';
    const description = row[2]?.toString().trim() || '';
    const priceStr = row[3]?.toString().trim() || '';
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    
    // Skip header rows and empty rows
    if (!itemCode || itemCode.includes('Item Code') || itemCode.includes('Description') || price === 0 || description === '') {
      continue;
    }
    
    products.push({
      category: categoryName,
      itemCode: itemCode,
      description: description,
      price: price
    });
  }
});

// Save to JSON
const outputPath = path.join(__dirname, 'apollo_products_extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

console.log(`\n✅ Extracted ${products.length} products`);
console.log(`📁 Saved to: apollo_products_extracted.json`);
console.log('\n📋 Categories found:');
const categories = [...new Set(products.map(p => p.category))];
categories.forEach(cat => {
  const count = products.filter(p => p.category === cat).length;
  console.log(`   - ${cat}: ${count} products`);
});

console.log('\n📄 Sample products:');
console.log(JSON.stringify(products.slice(0, 5), null, 2));

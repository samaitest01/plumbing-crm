const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Apollo Price List_Brochure_June 2025.xlsx');

// Read the Excel file
const workbook = XLSX.readFile(filePath);

console.log('\n=== EXCEL FILE ANALYSIS ===\n');
console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

// Process each sheet
workbook.SheetNames.forEach((sheetName, index) => {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SHEET ${index + 1}: ${sheetName}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Rows: ${data.length}`);
  console.log('\nFirst 10 rows:');
  console.log(JSON.stringify(data.slice(0, 10), null, 2));
});

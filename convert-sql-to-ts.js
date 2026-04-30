const fs = require('fs');

// Read SQL file
const sql = fs.readFileSync(r'c:\Users\kskof\Downloads\tests-complete (2).sql', 'utf-8');

// Category ID to slug mapping
const categoryMap = {
  1: 'allergy-and-sensitivity',
  2: 'autoimmune',
  3: 'bone-health',
  4: 'cancer',
  5: 'cardiac',
  6: 'digestive',
  7: 'endocrine',
  8: 'general-health',
  9: 'genetics',
  10: 'hematology',
  11: 'hormones',
  12: 'immunology',
  13: 'infectious-disease',
  14: 'liver',
  15: 'mens-health',
  16: 'mental-health',
  17: 'metabolic',
  18: 'neurology',
  19: 'nutrition',
  20: 'occupational-health',
  21: 'prenatal',
  22: 'renal',
  23: 'reproductive-health',
  24: 'rheumatology',
  25: 'std',
  26: 'thyroid',
  27: 'toxicology',
  28: 'womens-health',
};

// Parse all VALUES clauses
const valuesPattern = /VALUES\s*\((.*?)\);/gs;
const tests = [];
let match;

while ((match = valuesPattern.exec(sql)) !== null) {
  const valueStr = match[1];
  
  // Extract values - handle NULL and quoted strings
  const valuesParts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < valueStr.length; i++) {
    const char = valueStr[i];
    if (char === "'" && valueStr[i-1] !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      valuesParts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) valuesParts.push(current.trim());
  
  // Parse test data
  if (valuesParts.length >= 11) {
    const id = valuesParts[0];
    const name = valuesParts[1].replace(/'/g, '');
    const slug = valuesParts[2].replace(/'/g, '');
    const description = valuesParts[3].replace(/'/g, '');
    const shortDesc = valuesParts[4].replace(/'/g, '');
    const catId = parseInt(valuesParts[5]);
    const specimen = valuesParts[6].replace(/'/g, '');
    const turnaround = valuesParts[7];
    const isPanel = valuesParts[8];
    const cptCode = valuesParts[9].replace(/'/g, '') || null;
    const isActive = valuesParts[10];
    const isPopular = valuesParts[11];
    
    tests.push({
      id,
      name,
      slug,
      description,
      shortDescription: shortDesc,
      categorySlug: categoryMap[catId] || 'general-health',
      specimenType: specimen,
      baseTurnaroundDays: turnaround === 'NULL' ? 1 : parseInt(turnaround),
      cptCode: cptCode === 'NULL' ? null : cptCode,
      isPanel: isPanel === '1',
      requiresFasting: false, // Will derive from category
      isPopular: isPopular === '1',
    });
  }
}

console.log(`Total tests parsed: ${tests.length}`);
console.log('\n--- First test ---');
console.log(JSON.stringify(tests[0], null, 2));
console.log('\n--- Second test ---');
console.log(JSON.stringify(tests[1], null, 2));

// Write to file
fs.writeFileSync('parsed-tests.json', JSON.stringify(tests, null, 2));
console.log(`\nParsed tests saved to parsed-tests.json`);

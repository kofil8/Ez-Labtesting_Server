const fs = require('fs');
const path = require('path');

// Read SQL file
const sqlPath = path.join(process.env.USERPROFILE, 'Downloads', 'tests-complete (2).sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

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

// Function to parse VALUES section - handles multi-line and quoted strings
function parseValues(valueStr) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;

  for (let i = 0; i < valueStr.length; i++) {
    const char = valueStr[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && inQuotes) {
      escaped = true;
      current += char;
      continue;
    }

    if (char === "'" && inQuotes) {
      current += char;
      inQuotes = false;
      continue;
    }

    if (char === "'" && !inQuotes && current.trim().length === 0) {
      current += char;
      inQuotes = true;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }
  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

// Helper to clean quoted strings
function cleanValue(val) {
  if (val === 'NULL') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return val;
}

// Extract all INSERT statements using regex that handles multi-line
const insertRegex =
  /INSERT\s+IGNORE\s+INTO\s+tests\s*\([^)]+\)\s*VALUES\s*\(([^)]+(?:'[^']*'[^)]*)*)\)/gis;

const tests = [];
let match;
let count = 0;

while ((match = insertRegex.exec(sql)) !== null) {
  count++;
  const valueStr = match[1];
  const values = parseValues(valueStr);

  if (values.length !== 12) {
    console.error(`Test ${count}: Expected 12 values, got ${values.length}`);
    continue;
  }

  try {
    const id = parseInt(values[0]);
    const name = cleanValue(values[1]);
    const slug = cleanValue(values[2]);
    const description = cleanValue(values[3]);
    const shortDescription = cleanValue(values[4]);
    const categoryId = parseInt(values[5]);
    const specimenType = cleanValue(values[6]);
    const turnaroundDays = values[7] === 'NULL' ? null : parseInt(values[7]);
    const isPanel = values[8] === '1';
    const cptCode = cleanValue(values[9]);
    const isActive = values[10] === '1';
    const isPopular = values[11] === '1';

    tests.push({
      id,
      name,
      slug,
      description,
      shortDescription,
      categorySlug: categoryMap[categoryId] || 'unknown',
      specimenType,
      baseTurnaroundDays: turnaroundDays,
      cptCode,
      isPanel,
      isActive,
      isPopular,
    });
  } catch (e) {
    console.error(`Error parsing test ${count}:`, e.message);
  }
}

console.log(`\nExtracted ${tests.length} tests`);

// Output as JSON
const outputPath = path.join(__dirname, 'medical-tests.json');
fs.writeFileSync(outputPath, JSON.stringify(tests, null, 2), 'utf-8');
console.log(`Saved to ${outputPath}`);

// Show first 3 tests as sample
console.log('\nFirst 3 tests:');
console.log(JSON.stringify(tests.slice(0, 3), null, 2));
console.log(`\n... and ${tests.length - 3} more tests`);

// Summary
const panelCount = tests.filter((t) => t.isPanel).length;
const activeCount = tests.filter((t) => t.isActive).length;
const categoryCounts = {};
tests.forEach((t) => {
  categoryCounts[t.categorySlug] = (categoryCounts[t.categorySlug] || 0) + 1;
});

console.log(`\n=== Summary ===`);
console.log(`Total Tests: ${tests.length}`);
console.log(`Panel Tests: ${panelCount}`);
console.log(`Active Tests: ${activeCount}`);
console.log(`\nBy Category:`);
Object.keys(categoryCounts)
  .sort()
  .forEach((cat) => {
    console.log(`  ${cat}: ${categoryCounts[cat]}`);
  });

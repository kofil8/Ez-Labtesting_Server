const fs = require('fs');
const path = require('path');

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

// Read SQL file
const sqlPath = path.join(process.env.USERPROFILE, 'Downloads', 'tests-complete (2).sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

// Helper to parse quoted string
function parseQuotedString(str, startIdx) {
  let result = '';
  let i = startIdx;
  let escaped = false;

  while (i < str.length) {
    const char = str[i];

    if (escaped) {
      if (char === "'") result += "'";
      else if (char === '\\') result += '\\';
      else result += char;
      escaped = false;
      i++;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      i++;
      continue;
    }

    if (char === "'") {
      return { value: result, endIdx: i };
    }

    result += char;
    i++;
  }

  return { value: result, endIdx: i };
}

// Parse VALUES section
function parseValuesSection(str) {
  const values = [];
  let i = 0;
  let current = '';

  while (i < str.length) {
    const char = str[i];

    // Skip whitespace
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      i++;
      continue;
    }

    // Quoted string
    if (char === "'") {
      const parsed = parseQuotedString(str, i + 1);
      values.push({ type: 'string', value: parsed.value });
      i = parsed.endIdx + 1;

      // Skip whitespace after quote
      while (i < str.length && /[\s,]/.test(str[i])) {
        if (str[i] === ',') i++;
        else i++;
      }
      continue;
    }

    // NULL
    if (str.substr(i, 4) === 'NULL') {
      values.push({ type: 'null', value: null });
      i += 4;
      while (i < str.length && (str[i] === ' ' || str[i] === ',' || str[i] === '\n')) i++;
      continue;
    }

    // Number
    if (/[\d-]/.test(char)) {
      let numStr = '';
      while (i < str.length && /[\d\-\.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      values.push({ type: 'number', value: numStr });
      while (i < str.length && (str[i] === ' ' || str[i] === ',' || str[i] === '\n')) i++;
      continue;
    }

    i++;
  }

  return values;
}

// Extract all INSERT statements
const insertRegex = /INSERT\s+IGNORE\s+INTO\s+tests\s*\([^)]+\)\s*VALUES\s*\(([^;]+)\);/gis;

const tests = [];
let match;

while ((match = insertRegex.exec(sql)) !== null) {
  const valueStr = match[1];
  const values = parseValuesSection(valueStr);

  if (values.length !== 12) {
    console.error(`Skipping: Expected 12 values, got ${values.length}`);
    continue;
  }

  try {
    const test = {
      id: parseInt(values[0].value),
      name: values[1].value,
      slug: values[2].value,
      description: values[3].value,
      shortDescription: values[4].value,
      categorySlug: categoryMap[parseInt(values[5].value)] || 'unknown',
      specimenType: values[6].value,
      baseTurnaroundDays: values[7].type === 'null' ? null : parseInt(values[7].value),
      cptCode: values[9].value,
      isPanel: values[8].value === '1',
      isActive: values[10].value === '1',
      isPopular: values[11].value === '1',
    };

    tests.push(test);
  } catch (e) {
    console.error('Error parsing test:', e.message);
  }
}

console.log(`Extracted ${tests.length} tests`);

// Save to JSON
const outputPath = path.join(__dirname, 'medical-tests.json');
fs.writeFileSync(outputPath, JSON.stringify(tests, null, 2), 'utf-8');
console.log(`Saved to: ${outputPath}`);

// Show sample
console.log('\nFirst test:');
console.log(JSON.stringify(tests[0], null, 2));

// Summary stats
console.log(`\nTotal: ${tests.length}`);
console.log(`Active: ${tests.filter((t) => t.isActive).length}`);
console.log(`Panels: ${tests.filter((t) => t.isPanel).length}`);
console.log(`Popular: ${tests.filter((t) => t.isPopular).length}`);

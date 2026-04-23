import * as fs from 'fs';
import * as path from 'path';

export type CategorySeedRow = {
  slug: string;
  name: string;
  sortOrder: number;
};

export type LegacyLaboratoryRow = {
  legacyId: number;
  name: string;
  code: string;
  apiEndpoint: string | null;
  apiKeyEncrypted: string | null;
  isActive: boolean;
};

export type AccessPricingRow = {
  legacyTestId: number;
  legacyLaboratoryId: number;
  labTestCode: string;
  labCost: number;
  retailPrice: number;
  isAvailable: boolean;
  turnaroundDaysOverride: number | null;
};

export type AccessCostOverrideRow = {
  testName: string;
  labCost: number;
};

export type CplPricingRow = {
  labTestCode: string;
  labCost: number;
  isAvailable: boolean;
  candidateNames: string[];
};

export const CATEGORY_SEED_ROWS: CategorySeedRow[] = [
  { slug: 'allergy-and-sensitivity', name: 'Allergy and Sensitivity', sortOrder: 1 },
  { slug: 'autoimmune', name: 'Autoimmune', sortOrder: 2 },
  { slug: 'bone-health', name: 'Bone Health', sortOrder: 3 },
  { slug: 'cancer', name: 'Cancer', sortOrder: 4 },
  { slug: 'cardiac', name: 'Cardiac', sortOrder: 5 },
  { slug: 'digestive', name: 'Digestive', sortOrder: 6 },
  { slug: 'endocrine', name: 'Endocrine', sortOrder: 7 },
  { slug: 'general-health', name: 'General Health', sortOrder: 8 },
  { slug: 'genetics', name: 'Genetics', sortOrder: 9 },
  { slug: 'hematology', name: 'Hematology', sortOrder: 10 },
  { slug: 'hormones', name: 'Hormones', sortOrder: 11 },
  { slug: 'immunology', name: 'Immunology', sortOrder: 12 },
  { slug: 'infectious-disease', name: 'Infectious Disease', sortOrder: 13 },
  { slug: 'liver', name: 'Liver', sortOrder: 14 },
  { slug: 'mens-health', name: "Men's Health", sortOrder: 15 },
  { slug: 'mental-health', name: 'Mental Health', sortOrder: 16 },
  { slug: 'metabolic', name: 'Metabolic', sortOrder: 17 },
  { slug: 'neurology', name: 'Neurology', sortOrder: 18 },
  { slug: 'nutrition', name: 'Nutrition', sortOrder: 19 },
  { slug: 'occupational-health', name: 'Occupational Health', sortOrder: 20 },
  { slug: 'prenatal', name: 'Prenatal', sortOrder: 21 },
  { slug: 'renal', name: 'Renal', sortOrder: 22 },
  { slug: 'reproductive-health', name: 'Reproductive Health', sortOrder: 23 },
  { slug: 'rheumatology', name: 'Rheumatology', sortOrder: 24 },
  { slug: 'std', name: 'STD', sortOrder: 25 },
  { slug: 'thyroid', name: 'Thyroid', sortOrder: 26 },
  { slug: 'toxicology', name: 'Toxicology', sortOrder: 27 },
  { slug: 'womens-health', name: "Women's Health", sortOrder: 28 },
];

export const normalizeMatchName = (value: string) =>
  value
    .trim()
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const readUtf8File = (filePath: string) => fs.readFileSync(filePath, 'utf-8');

export const resolveSeedInputFile = (envVarName: string, defaultFileName: string) => {
  const candidates = [
    process.env[envVarName],
    process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, 'Downloads', defaultFileName)
      : undefined,
    path.join(process.cwd(), defaultFileName),
    path.join(process.cwd(), '..', defaultFileName),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not resolve seed input file "${defaultFileName}". Set ${envVarName} or place the file in Downloads.`,
  );
};

export const parseSqlStringLiteral = (rawValue: string) => {
  const trimmed = rawValue.trim();
  if (trimmed === 'NULL') {
    return null;
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
};

export const splitSqlTupleValues = (tupleContent: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < tupleContent.length; index += 1) {
    const character = tupleContent[index];
    const nextCharacter = tupleContent[index + 1];

    if (character === "'") {
      current += character;

      if (inQuotes && nextCharacter === "'") {
        current += nextCharacter;
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
};

export const extractSqlValueTuples = (valuesBlock: string) => {
  const tuples: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let index = 0; index < valuesBlock.length; index += 1) {
    const character = valuesBlock[index];
    const nextCharacter = valuesBlock[index + 1];

    if (character === "'") {
      current += character;

      if (inQuotes && nextCharacter === "'") {
        current += nextCharacter;
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === '(') {
      depth += 1;
      if (depth === 1) {
        current = '';
        continue;
      }
    }

    if (!inQuotes && character === ')') {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current.trim());
        current = '';
        continue;
      }
    }

    if (depth >= 1) {
      current += character;
    }
  }

  return tuples;
};

export const parseLaboratoryRowsFromSql = (sql: string): LegacyLaboratoryRow[] => {
  const insertMatch = sql.match(
    /INSERT\s+(?:IGNORE\s+)?INTO\s+laboratories\s*\([^)]+\)\s*VALUES\s*([\s\S]*?);/i,
  );

  if (!insertMatch) {
    return [];
  }

  return extractSqlValueTuples(insertMatch[1]).map((tuple) => {
    const values = splitSqlTupleValues(tuple);

    return {
      legacyId: Number(values[0]),
      name: parseSqlStringLiteral(values[1]) ?? '',
      code: (parseSqlStringLiteral(values[2]) ?? '').toUpperCase(),
      apiEndpoint: parseSqlStringLiteral(values[3]),
      apiKeyEncrypted: parseSqlStringLiteral(values[4]),
      isActive: Number(values[5]) === 1,
    };
  });
};

export const parseAccessPricingRows = (sql: string): AccessPricingRow[] => {
  const rowPattern =
    /INSERT INTO lab_tests\s*\(test_id,\s*laboratory_id,\s*lab_test_code,\s*lab_cost,\s*retail_price,\s*is_available,\s*turnaround_days_override\)\s*VALUES\s*\(([\s\S]*?)\)\s*ON DUPLICATE KEY UPDATE/gi;

  const rows: AccessPricingRow[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowPattern.exec(sql)) !== null) {
    const values = splitSqlTupleValues(match[1]);

    rows.push({
      legacyTestId: Number(values[0]),
      legacyLaboratoryId: Number(values[1]),
      labTestCode: parseSqlStringLiteral(values[2]) ?? '',
      labCost: Number(values[3]),
      retailPrice: Number(values[4]),
      isAvailable: Number(values[5]) === 1,
      turnaroundDaysOverride:
        values[6] === 'NULL' ? null : Number.parseInt(values[6], 10),
    });
  }

  return rows;
};

export const parseAccessCostOverrides = (sql: string): AccessCostOverrideRow[] => {
  const rowPattern =
    /UPDATE lab_tests lt\s*JOIN tests t ON t\.id = lt\.test_id\s*SET lt\.lab_cost = ([0-9.]+)\s*WHERE lt\.laboratory_id = @access_id AND LOWER\(TRIM\(t\.name\)\) = LOWER\(TRIM\('((?:''|[^'])*)'\)\);/gi;

  const rows: AccessCostOverrideRow[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowPattern.exec(sql)) !== null) {
    rows.push({
      labCost: Number(match[1]),
      testName: match[2].replace(/''/g, "'"),
    });
  }

  return rows;
};

export const parseCplPricingRows = (sql: string): CplPricingRow[] => {
  const rowPattern =
    /INSERT INTO lab_tests\s*\(test_id,\s*laboratory_id,\s*lab_test_code,\s*lab_cost,\s*retail_price,\s*is_available\)\s*SELECT t\.id,\s*4,\s*'([^']+)',\s*([0-9.]+),[\s\S]*?,\s*(\d+)\s*FROM tests t\s*WHERE\s*\(([\s\S]*?)\)\s*AND t\.is_active = 1\s*LIMIT 1\s*ON DUPLICATE KEY UPDATE[\s\S]*?;/gi;

  const rows: CplPricingRow[] = [];
  let match: RegExpExecArray | null;

  while ((match = rowPattern.exec(sql)) !== null) {
    const candidateNames = Array.from(
      match[4].matchAll(/LOWER\(TRIM\('((?:''|[^'])*)'\)\)/gi),
      (candidateMatch) => candidateMatch[1].replace(/''/g, "'"),
    );

    rows.push({
      labTestCode: match[1],
      labCost: Number(match[2]),
      isAvailable: Number(match[3]) === 1,
      candidateNames: [...new Set(candidateNames)],
    });
  }

  return rows;
};

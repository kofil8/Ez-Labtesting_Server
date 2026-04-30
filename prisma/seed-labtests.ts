import { Prisma, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  normalizeMatchName,
  parseAccessCostOverrides,
  parseAccessPricingRows,
  parseCplPricingRows,
  parseLaboratoryRowsFromSql,
  readUtf8File,
  resolveSeedInputFile,
} from './seed-utils';

const prisma = new PrismaClient();

const TESTS_JSON_PATH = path.join(__dirname, '..', 'medical-tests.json');
const PRICING_SQL_PATH = resolveSeedInputFile('PRICING_SQL_PATH', 'pricing.sql');
const LABORATORIES_SQL_PATH = resolveSeedInputFile('LABORATORIES_SQL_PATH', 'laboratories.sql');
const DEFAULT_CURRENCY = 'USD';
const LABTEST_BATCH_SIZE = 50;
const MAX_LAB_TEST_CODE_LENGTH = 50;

const TEST_NAME_ALIAS_TO_SLUG = new Map<string, string>(
  [
    ['Arsenic, Lead, Mercury, Random Urine', 'heavy-metals-screening-urine-arsenic-lead-mercury'],
    ['APOLIPOPROTEIN E MUTATION', 'apo-e-genotype'],
    ['CoQ10', 'coq10-lc-ms-ms'],
    ['Culture, Urine, Void', 'urine-culture-void'],
    ['DHT (Dihydrotestosterone)', 'dht-dihydrotestosterone-lc-ms-ms'],
    ['EPSTEIN BARR VCA IgG', 'epstein-barr-viral-capsid-ag-igg'],
    ['Estriol (E3)', 'estriol-e3-lc-ms-ms'],
    ['Estrogens, Total', 'estrogens-total-lc-ms-ms'],
    ['Estrone (E1)', 'estrone-e1-lc-ms-ms'],
    ['H PYLORI AG, STOOL', 'h-pylori-antigen-stool'],
    ['HERPES SIMPLEX 1/2 AB IgG', 'herpes-i-and-ii-igg'],
    ['LYME ANTIBODY,IgG/IgM', 'lyme-disease-ab-w-reflex-to-blot'],
    ['Pregnenolone', 'pregnenolone-lc-ms-ms'],
    ['Reverse T3', 'reverse-t3-lc-ms-ms'],
    ['RUBEOLA AB, IgG', 'measles-rubeola-igg'],
    [
      'Testosterone LC/MS/MS, Free & Total w/SHBG',
      'testosterone-free-testosterone-total-lcmsms-with-shbg',
    ],
    ['Zinc RBC', 'zinc-packed-rbc'],
  ].map(([alias, slug]) => [normalizeMatchName(alias), slug]),
);

type MedicalTestCatalogRow = {
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
};

type PendingLabTestRow = {
  testId: string;
  testName: string;
  testSlug: string;
  laboratoryId: string;
  laboratoryCode: string;
  labTestCode: string;
  labCost: number;
  retailPrice: number;
  turnaroundDaysOverride: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  sortOrder: number;
  currency: string;
};

type SeedLog = {
  createdLabTests: number;
  updatedLabTests: number;
  skippedUnmatchedRows: string[];
  rejectedPricingRows: string[];
  ambiguousMatches: string[];
  codeCollisionRetries: number;
  skippedCodeConflicts: string[];
  accessRowsParsed: number;
  accessOverridesParsed: number;
  cplRowsParsed: number;
};

const trimLabTestCode = (code: string) => code.slice(0, MAX_LAB_TEST_CODE_LENGTH);

const buildCollisionCode = (baseCode: string, testId: string) => {
  const suffix = `-${testId.slice(0, 4).toUpperCase()}`;
  const trimmedBase = baseCode.slice(0, Math.max(1, MAX_LAB_TEST_CODE_LENGTH - suffix.length));
  return `${trimmedBase}${suffix}`;
};

const readMedicalTestCatalog = (): MedicalTestCatalogRow[] => {
  const rawJson = fs.readFileSync(TESTS_JSON_PATH, 'utf-8');
  return JSON.parse(rawJson) as MedicalTestCatalogRow[];
};

const logUniqueEntry = (entries: string[], message: string) => {
  if (!entries.includes(message)) {
    entries.push(message);
  }
};

const resolveTestsByName = (
  rawName: string,
  dbTestsByNormalizedName: Map<string, Array<{ id: string; slug: string; name: string }>>,
  dbTestsBySlug: Map<string, { id: string; slug: string; name: string }>,
) => {
  const normalizedName = normalizeMatchName(rawName);
  const directMatches = dbTestsByNormalizedName.get(normalizedName) ?? [];
  if (directMatches.length > 0) {
    return directMatches;
  }

  const aliasedSlug = TEST_NAME_ALIAS_TO_SLUG.get(normalizedName);
  if (!aliasedSlug) {
    return [];
  }

  const aliasedTest = dbTestsBySlug.get(aliasedSlug);
  return aliasedTest ? [aliasedTest] : [];
};

const flushBatch = async (batch: Promise<unknown>[]) => {
  if (batch.length === 0) {
    return;
  }

  await Promise.all(batch);
  batch.length = 0;
};

async function seedLabTests() {
  const logs: SeedLog = {
    createdLabTests: 0,
    updatedLabTests: 0,
    skippedUnmatchedRows: [],
    rejectedPricingRows: [],
    ambiguousMatches: [],
    codeCollisionRetries: 0,
    skippedCodeConflicts: [],
    accessRowsParsed: 0,
    accessOverridesParsed: 0,
    cplRowsParsed: 0,
  };

  try {
    const pricingSql = readUtf8File(PRICING_SQL_PATH);
    const laboratoriesSql = readUtf8File(LABORATORIES_SQL_PATH);
    const legacyLaboratories = parseLaboratoryRowsFromSql(laboratoriesSql);
    const accessPricingRows = parseAccessPricingRows(pricingSql);
    const accessCostOverrides = parseAccessCostOverrides(pricingSql);
    const cplPricingRows = parseCplPricingRows(pricingSql);

    logs.accessRowsParsed = accessPricingRows.length;
    logs.accessOverridesParsed = accessCostOverrides.length;
    logs.cplRowsParsed = cplPricingRows.length;

    const catalogRows = readMedicalTestCatalog();
    const legacyCatalogById = new Map<number, { slug: string; name: string }>();
    for (const row of catalogRows) {
      if (row.id === undefined || row.id === null || !row.slug || !row.name) {
        continue;
      }

      legacyCatalogById.set(Number(row.id), {
        slug: row.slug,
        name: row.name,
      });
    }

    const [dbTests, dbLaboratories, existingLabTests] = await Promise.all([
      prisma.test.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
        },
      }),
      prisma.laboratory.findMany({
        select: {
          id: true,
          code: true,
        },
      }),
      prisma.labTest.findMany({
        select: {
          id: true,
          testId: true,
          laboratoryId: true,
          labTestCode: true,
        },
      }),
    ]);

    const dbTestsBySlug = new Map(dbTests.map((test) => [test.slug, test]));
    const dbTestsByNormalizedName = new Map<string, typeof dbTests>();
    for (const test of dbTests) {
      const normalizedName = normalizeMatchName(test.name);
      const existingMatches = dbTestsByNormalizedName.get(normalizedName) ?? [];
      existingMatches.push(test);
      dbTestsByNormalizedName.set(normalizedName, existingMatches);
    }

    const dbLaboratoryIdByCode = new Map(
      dbLaboratories.map((laboratory) => [laboratory.code.toUpperCase(), laboratory.id]),
    );
    const legacyLaboratoryCodeById = new Map(
      legacyLaboratories.map((laboratory) => [laboratory.legacyId, laboratory.code.toUpperCase()]),
    );

    const accessLaboratoryId = dbLaboratoryIdByCode.get('ACCESS');
    const cplLaboratoryId = dbLaboratoryIdByCode.get('CPL');

    if (!accessLaboratoryId) {
      throw new Error('ACCESS laboratory must be seeded before seeding lab tests');
    }

    if (!cplLaboratoryId) {
      throw new Error('CPL laboratory must be seeded before seeding lab tests');
    }

    const pendingRowsByPair = new Map<string, PendingLabTestRow>();
    const accessRowsByTestId = new Map<string, PendingLabTestRow>();

    for (const accessRow of accessPricingRows) {
      const laboratoryCode = legacyLaboratoryCodeById.get(accessRow.legacyLaboratoryId);
      if (!laboratoryCode) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access insert: unknown laboratory id ${accessRow.legacyLaboratoryId}`,
        );
        continue;
      }

      const laboratoryId = dbLaboratoryIdByCode.get(laboratoryCode);
      if (!laboratoryId) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access insert: laboratory code ${laboratoryCode} not seeded`,
        );
        continue;
      }

      const catalogMatch = legacyCatalogById.get(accessRow.legacyTestId);
      if (!catalogMatch) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access insert: legacy test id ${accessRow.legacyTestId} missing from medical-tests.json`,
        );
        continue;
      }

      const dbTest = dbTestsBySlug.get(catalogMatch.slug);
      if (!dbTest) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access insert: test slug ${catalogMatch.slug} not present in database`,
        );
        continue;
      }

      if (accessRow.retailPrice < accessRow.labCost) {
        logUniqueEntry(
          logs.rejectedPricingRows,
          `access insert: ${dbTest.slug} retail ${accessRow.retailPrice} below lab cost ${accessRow.labCost}`,
        );
        continue;
      }

      const pendingRow: PendingLabTestRow = {
        testId: dbTest.id,
        testName: dbTest.name,
        testSlug: dbTest.slug,
        laboratoryId,
        laboratoryCode,
        labTestCode: trimLabTestCode(accessRow.labTestCode),
        labCost: accessRow.labCost,
        retailPrice: accessRow.retailPrice,
        turnaroundDaysOverride: accessRow.turnaroundDaysOverride,
        isAvailable: accessRow.isAvailable,
        isVisible: true,
        sortOrder: 0,
        currency: DEFAULT_CURRENCY,
      };

      pendingRowsByPair.set(`${pendingRow.laboratoryId}::${pendingRow.testId}`, pendingRow);
      accessRowsByTestId.set(dbTest.id, pendingRow);
    }

    for (const overrideRow of accessCostOverrides) {
      const matches = resolveTestsByName(
        overrideRow.testName,
        dbTestsByNormalizedName,
        dbTestsBySlug,
      );

      if (matches.length === 0) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access override: no test matched "${overrideRow.testName}"`,
        );
        continue;
      }

      if (matches.length > 1) {
        logUniqueEntry(
          logs.ambiguousMatches,
          `access override: ambiguous test match for "${overrideRow.testName}"`,
        );
        continue;
      }

      const matchedTest = matches[0];
      const existingAccessRow = accessRowsByTestId.get(matchedTest.id);
      if (!existingAccessRow) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `access override: no base access row found for "${overrideRow.testName}"`,
        );
        continue;
      }

      if (existingAccessRow.retailPrice < overrideRow.labCost) {
        logUniqueEntry(
          logs.rejectedPricingRows,
          `access override: ${matchedTest.slug} retail ${existingAccessRow.retailPrice} below override lab cost ${overrideRow.labCost}`,
        );
        continue;
      }

      existingAccessRow.labCost = overrideRow.labCost;
      pendingRowsByPair.set(
        `${existingAccessRow.laboratoryId}::${existingAccessRow.testId}`,
        existingAccessRow,
      );
    }

    for (const cplRow of cplPricingRows) {
      const matchedTests = new Map<string, { id: string; slug: string; name: string }>();

      for (const candidateName of cplRow.candidateNames) {
        const candidateMatches = resolveTestsByName(
          candidateName,
          dbTestsByNormalizedName,
          dbTestsBySlug,
        );

        for (const match of candidateMatches) {
          matchedTests.set(match.id, match);
        }
      }

      if (matchedTests.size === 0) {
        logUniqueEntry(
          logs.skippedUnmatchedRows,
          `cpl insert: no test matched candidate names [${cplRow.candidateNames.join(', ')}]`,
        );
        continue;
      }

      if (matchedTests.size > 1) {
        logUniqueEntry(
          logs.ambiguousMatches,
          `cpl insert: ambiguous test match for [${cplRow.candidateNames.join(', ')}]`,
        );
        continue;
      }

      const matchedTest = Array.from(matchedTests.values())[0];
      const accessRetailPrice = accessRowsByTestId.get(matchedTest.id)?.retailPrice ?? null;
      const retailPrice = Math.max(
        cplRow.labCost * 2.5,
        accessRetailPrice ?? cplRow.labCost * 3,
        cplRow.labCost * 3,
      );

      if (retailPrice < cplRow.labCost) {
        logUniqueEntry(
          logs.rejectedPricingRows,
          `cpl insert: ${matchedTest.slug} retail ${retailPrice} below lab cost ${cplRow.labCost}`,
        );
        continue;
      }

      const pendingRow: PendingLabTestRow = {
        testId: matchedTest.id,
        testName: matchedTest.name,
        testSlug: matchedTest.slug,
        laboratoryId: cplLaboratoryId,
        laboratoryCode: 'CPL',
        labTestCode: trimLabTestCode(cplRow.labTestCode),
        labCost: cplRow.labCost,
        retailPrice,
        turnaroundDaysOverride: null,
        isAvailable: cplRow.isAvailable,
        isVisible: true,
        sortOrder: 0,
        currency: DEFAULT_CURRENCY,
      };

      pendingRowsByPair.set(`${pendingRow.laboratoryId}::${pendingRow.testId}`, pendingRow);
    }

    const existingPairKeys = new Set(
      existingLabTests.map((labTest) => `${labTest.laboratoryId}::${labTest.testId}`),
    );
    const reservedCodesByLaboratory = new Map<string, Map<string, string>>();

    for (const existingLabTest of existingLabTests) {
      const reservedCodes =
        reservedCodesByLaboratory.get(existingLabTest.laboratoryId) ?? new Map();
      reservedCodes.set(existingLabTest.labTestCode, existingLabTest.testId);
      reservedCodesByLaboratory.set(existingLabTest.laboratoryId, reservedCodes);
    }

    const operations: Array<{ existed: boolean; row: PendingLabTestRow }> = [];

    for (const row of pendingRowsByPair.values()) {
      const reservedCodes = reservedCodesByLaboratory.get(row.laboratoryId) ?? new Map();
      const currentReservation = reservedCodes.get(row.labTestCode);

      if (currentReservation && currentReservation !== row.testId) {
        logs.codeCollisionRetries += 1;
        const fallbackCode = buildCollisionCode(row.labTestCode, row.testId);
        const fallbackReservation = reservedCodes.get(fallbackCode);

        if (fallbackReservation && fallbackReservation !== row.testId) {
          logUniqueEntry(
            logs.skippedCodeConflicts,
            `${row.laboratoryCode}:${row.testSlug} could not reserve code ${row.labTestCode}`,
          );
          continue;
        }

        row.labTestCode = fallbackCode;
      }

      reservedCodes.set(row.labTestCode, row.testId);
      reservedCodesByLaboratory.set(row.laboratoryId, reservedCodes);

      operations.push({
        existed: existingPairKeys.has(`${row.laboratoryId}::${row.testId}`),
        row,
      });
    }

    const batch: Promise<unknown>[] = [];
    for (const operation of operations) {
      batch.push(
        prisma.labTest.upsert({
          where: {
            testId_laboratoryId: {
              testId: operation.row.testId,
              laboratoryId: operation.row.laboratoryId,
            },
          },
          update: {
            labTestCode: operation.row.labTestCode,
            labCost: operation.row.labCost,
            retailPrice: operation.row.retailPrice,
            salePrice: null,
            currency: operation.row.currency,
            isAvailable: operation.row.isAvailable,
            isVisible: operation.row.isVisible,
            turnaroundDaysOverride: operation.row.turnaroundDaysOverride,
            sortOrder: operation.row.sortOrder,
          },
          create: {
            testId: operation.row.testId,
            laboratoryId: operation.row.laboratoryId,
            labTestCode: operation.row.labTestCode,
            labCost: operation.row.labCost,
            retailPrice: operation.row.retailPrice,
            salePrice: null,
            currency: operation.row.currency,
            isAvailable: operation.row.isAvailable,
            isVisible: operation.row.isVisible,
            turnaroundDaysOverride: operation.row.turnaroundDaysOverride,
            sortOrder: operation.row.sortOrder,
          },
        }),
      );

      if (operation.existed) {
        logs.updatedLabTests += 1;
      } else {
        logs.createdLabTests += 1;
      }

      if (batch.length >= LABTEST_BATCH_SIZE) {
        await flushBatch(batch);
      }
    }
    await flushBatch(batch);

    console.log(`Access rows parsed: ${logs.accessRowsParsed}`);
    console.log(`Access overrides parsed: ${logs.accessOverridesParsed}`);
    console.log(`CPL rows parsed: ${logs.cplRowsParsed}`);
    console.log(`Lab tests created: ${logs.createdLabTests}`);
    console.log(`Lab tests updated: ${logs.updatedLabTests}`);
    console.log(`Code collision retries: ${logs.codeCollisionRetries}`);

    if (logs.skippedUnmatchedRows.length > 0) {
      console.warn('Skipped unmatched pricing rows:');
      logs.skippedUnmatchedRows.forEach((entry) => console.warn(`- ${entry}`));
    }

    if (logs.rejectedPricingRows.length > 0) {
      console.warn('Rejected pricing rows:');
      logs.rejectedPricingRows.forEach((entry) => console.warn(`- ${entry}`));
    }

    if (logs.ambiguousMatches.length > 0) {
      console.warn('Ambiguous pricing matches:');
      logs.ambiguousMatches.forEach((entry) => console.warn(`- ${entry}`));
    }

    if (logs.skippedCodeConflicts.length > 0) {
      console.warn('Skipped lab test code conflicts:');
      logs.skippedCodeConflicts.forEach((entry) => console.warn(`- ${entry}`));
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedLabTests().catch((error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('LabTest seed failed with Prisma error', error.code, error.message);
  } else {
    console.error('LabTest seed failed', error);
  }

  process.exitCode = 1;
});

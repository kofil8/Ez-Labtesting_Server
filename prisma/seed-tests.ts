import { PrismaClient, RestrictionType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TESTS_JSON_PATH = path.join(__dirname, '..', 'medical-tests.json');
const DEFAULT_MIN_AGE = 0;
const DEFAULT_MAX_AGE = 120;
const STATE_RESTRICTION_SEED_NOTE_PREFIX = '[seeded-state-policy]';

const POPULAR_TEST_SLUGS = new Set<string>([
  'basic-metabolic-panel',
  'comprehensive-metabolic-panel',
  'hemoglobin-a1c',
  'lipid-panel',
  'testosterone-total',
  'thyroid-panel-free-t3-free-t4-tsh',
  'tsh',
  'vitamin-d-25-oh-total',
]);

const LEGACY_STATE_RESTRICTION_SEED_NOTES = [
  'Development seed restriction for physician review coverage.',
  'Development seed restriction for hidden-lab routing checks.',
];

const DEFAULT_STATE_RESTRICTION_POLICIES: Array<{
  stateCode: string;
  restrictionType: RestrictionType;
  laboratoryCodes: string[];
  notes: string;
}> = [
  {
    stateCode: 'NY',
    restrictionType: RestrictionType.BLOCKED,
    laboratoryCodes: ['ACCESS', 'CPL'],
    notes:
      'Hard blocked. New York does not allow direct-to-consumer lab ordering for this lab route.',
  },
  {
    stateCode: 'NJ',
    restrictionType: RestrictionType.BLOCKED,
    laboratoryCodes: ['ACCESS', 'CPL'],
    notes:
      'Hard blocked. New Jersey does not allow direct-to-consumer lab ordering for this lab route.',
  },
  {
    stateCode: 'RI',
    restrictionType: RestrictionType.BLOCKED,
    laboratoryCodes: ['ACCESS', 'CPL'],
    notes:
      'Hard blocked. Rhode Island does not allow direct-to-consumer lab ordering for this lab route.',
  },
  {
    stateCode: 'MD',
    restrictionType: RestrictionType.REQUIRES_PHYSICIAN,
    laboratoryCodes: ['ACCESS', 'CPL'],
    notes:
      'Soft blocked. Verify current Maryland servicing rules with the laboratory before accepting an order.',
  },
  {
    stateCode: 'MA',
    restrictionType: RestrictionType.REQUIRES_PHYSICIAN,
    laboratoryCodes: ['ACCESS', 'CPL'],
    notes:
      'Soft blocked. Verify current Massachusetts servicing rules with the laboratory before accepting an order.',
  },
];

type MedicalTestSeedRow = {
  id?: number | string | null;
  name?: string | null;
  testCode?: string | null;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  testImageUrl?: string | null;
  categorySlug?: string | null;
  specimenType?: string | null;
  baseTurnaroundDays?: number | null;
  cptCode?: string | string[] | null;
  isPanel?: boolean | null;
  componentSlugs?: string[] | null;
  isActive?: boolean | null;
  isPopular?: boolean | null;
};

type SeededTestRecord = {
  id: string;
  slug: string;
  isPanel: boolean;
  categoryId: string;
};

type SeedLog = {
  createdTests: number;
  updatedTests: number;
  seededPanelMappings: number;
  seededStateRestrictions: number;
  skippedTests: string[];
  skippedPanelMappings: string[];
  skippedStateRestrictions: string[];
};

const normalizeOptionalString = (value: string | null | undefined) => {
  if (value === undefined || value === null) return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeRequiredString = (value: string | null | undefined) => {
  const normalized = normalizeOptionalString(value);
  return normalized ?? null;
};

const normalizeBoolean = (value: boolean | null | undefined, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

const normalizeNullableInteger = (value: number | null | undefined) => {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value)) return null;

  return Math.max(0, Math.trunc(value));
};

const normalizeStringArray = (value: string | string[] | null | undefined) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeOptionalString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const normalized = normalizeOptionalString(value);
  if (!normalized) return [];

  return normalized
    .split(',')
    .map((entry) => normalizeOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
};

const trimToLength = (value: string, maxLength: number) => value.slice(0, Math.max(0, maxLength));

const buildSeoDescription = (shortDescription: string | null, description: string | null) =>
  trimToLength(shortDescription ?? description ?? '', 500) || null;

const readMedicalTests = (): MedicalTestSeedRow[] => {
  const rawJson = fs.readFileSync(TESTS_JSON_PATH, 'utf-8');
  return JSON.parse(rawJson) as MedicalTestSeedRow[];
};

const logUniqueEntry = (entries: string[], message: string) => {
  if (!entries.includes(message)) {
    entries.push(message);
  }
};

const upsertStateRestrictionSeed = async (
  testId: string | null,
  laboratoryId: string | null,
  stateCode: string,
  restrictionType: RestrictionType,
  notes: string | undefined,
) => {
  const existing = await prisma.stateRestriction.findFirst({
    where: {
      stateCode,
      testId,
      laboratoryId,
      restrictionType,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.stateRestriction.update({
      where: { id: existing.id },
      data: {
        notes,
        isActive: true,
      },
    });

    return;
  }

  await prisma.stateRestriction.create({
    data: {
      stateCode,
      testId,
      laboratoryId,
      restrictionType,
      notes,
      isActive: true,
    },
  });
};

const resetManagedStateRestrictionSeeds = async () => {
  await prisma.stateRestriction.deleteMany({
    where: {
      OR: [
        {
          notes: {
            startsWith: STATE_RESTRICTION_SEED_NOTE_PREFIX,
          },
        },
        {
          notes: {
            in: LEGACY_STATE_RESTRICTION_SEED_NOTES,
          },
        },
      ],
    },
  });
};

async function seedTests() {
  const logs: SeedLog = {
    createdTests: 0,
    updatedTests: 0,
    seededPanelMappings: 0,
    seededStateRestrictions: 0,
    skippedTests: [],
    skippedPanelMappings: [],
    skippedStateRestrictions: [],
  };

  try {
    const medicalTests = readMedicalTests();
    console.log(`Seeding tests from ${TESTS_JSON_PATH}`);

    const [categories, existingTests] = await Promise.all([
      prisma.testCategory.findMany({
        select: { id: true, slug: true },
      }),
      prisma.test.findMany({
        select: { id: true, slug: true },
      }),
    ]);

    const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]));
    const existingTestIdsBySlug = new Map(existingTests.map((test) => [test.slug, test.id]));
    const seededTestsBySlug = new Map<string, SeededTestRecord>();

    for (const row of medicalTests) {
      const name = normalizeRequiredString(row.name);
      const testCode = normalizeRequiredString(row.testCode);
      const slug = normalizeRequiredString(row.slug);
      const categorySlug = normalizeRequiredString(row.categorySlug);

      if (!name || !testCode || !slug || !categorySlug) {
        const identifier = slug ?? name ?? `row-${row.id ?? 'unknown'}`;
        logs.skippedTests.push(`${identifier}: missing name, testCode, slug, or categorySlug`);
        console.warn(
          `Skipping test seed row "${identifier}" due to missing required fields (name/testCode/slug/categorySlug)`,
        );
        continue;
      }

      const categoryId = categoryIdBySlug.get(categorySlug);
      if (!categoryId) {
        logs.skippedTests.push(`${slug}: missing category "${categorySlug}"`);
        console.warn(`Skipping test "${slug}" because category "${categorySlug}" was not found`);
        continue;
      }

      const testData = {
        name,
        testCode,
        slug,
        description: normalizeOptionalString(row.description),
        shortDescription: normalizeOptionalString(row.shortDescription),
        testImageUrl: normalizeOptionalString(row.testImageUrl),
        specimenType: normalizeOptionalString(row.specimenType),
        baseTurnaroundDays: normalizeNullableInteger(row.baseTurnaroundDays),
        cptCode: normalizeStringArray(row.cptCode),
        categoryId,
        isPanel: normalizeBoolean(row.isPanel, false),
        isActive: normalizeBoolean(row.isActive, true),
        isPopular: normalizeBoolean(row.isPopular, false) || POPULAR_TEST_SLUGS.has(slug),
        seoTitle: trimToLength(name, 255),
        seoDescription: buildSeoDescription(
          normalizeOptionalString(row.shortDescription),
          normalizeOptionalString(row.description),
        ),
      };

      if (
        testData.isPanel &&
        (!Array.isArray(row.componentSlugs) || row.componentSlugs.length === 0)
      ) {
        logUniqueEntry(logs.skippedPanelMappings, `${slug}: missing componentSlugs`);
        console.warn(
          `Panel "${slug}" is missing componentSlugs and will be downgraded if reseeded`,
        );
      }

      if (existingTestIdsBySlug.has(slug)) {
        const updated = await prisma.test.update({
          where: { slug },
          data: testData,
          select: { id: true, slug: true, isPanel: true, categoryId: true },
        });

        seededTestsBySlug.set(slug, updated);
        logs.updatedTests += 1;
        console.log(`Updated test: ${slug}`);
      } else {
        const created = await prisma.test.create({
          data: {
            ...testData,
            minAge: DEFAULT_MIN_AGE,
            maxAge: DEFAULT_MAX_AGE,
          },
          select: { id: true, slug: true, isPanel: true, categoryId: true },
        });

        seededTestsBySlug.set(slug, created);
        existingTestIdsBySlug.set(slug, created.id);
        logs.createdTests += 1;
        console.log(`Created test: ${slug}`);
      }
    }

    for (const row of medicalTests) {
      const slug = normalizeRequiredString(row.slug);
      if (!slug) continue;

      const panelRecord = seededTestsBySlug.get(slug);
      if (!panelRecord?.isPanel) {
        continue;
      }

      if (!Array.isArray(row.componentSlugs) || row.componentSlugs.length === 0) {
        await prisma.testComponent.deleteMany({
          where: { panelId: panelRecord.id },
        });

        await prisma.test.update({
          where: { id: panelRecord.id },
          data: { isPanel: false },
        });

        panelRecord.isPanel = false;
        seededTestsBySlug.set(slug, panelRecord);
        logUniqueEntry(logs.skippedPanelMappings, `${slug}: missing componentSlugs`);
        console.warn(
          `Downgraded "${slug}" from panel to single test because componentSlugs are missing`,
        );
        continue;
      }

      const componentIds: string[] = [];
      const seenComponentIds = new Set<string>();

      for (const rawComponentSlug of row.componentSlugs) {
        const componentSlug = normalizeRequiredString(rawComponentSlug);

        if (!componentSlug) {
          logs.skippedPanelMappings.push(`${slug}: encountered empty component slug`);
          console.warn(`Panel "${slug}" contains an empty component slug; skipping it`);
          continue;
        }

        if (componentSlug === slug) {
          logs.skippedPanelMappings.push(`${slug}: cannot include itself`);
          console.warn(
            `Panel "${slug}" cannot include itself; skipping component "${componentSlug}"`,
          );
          continue;
        }

        const componentRecord = seededTestsBySlug.get(componentSlug);
        if (!componentRecord) {
          logs.skippedPanelMappings.push(`${slug}: missing component "${componentSlug}"`);
          console.warn(
            `Panel "${slug}" references missing component slug "${componentSlug}"; skipping it`,
          );
          continue;
        }

        if (componentRecord.isPanel) {
          logs.skippedPanelMappings.push(
            `${slug}: nested panel component "${componentSlug}" is not allowed`,
          );
          console.warn(`Panel "${slug}" references nested panel "${componentSlug}"; skipping it`);
          continue;
        }

        if (componentRecord.categoryId !== panelRecord.categoryId) {
          console.warn(
            `Panel "${slug}" includes component "${componentSlug}" from a different category; keeping it`,
          );
        }

        if (seenComponentIds.has(componentRecord.id)) {
          continue;
        }

        seenComponentIds.add(componentRecord.id);
        componentIds.push(componentRecord.id);
      }

      await prisma.testComponent.deleteMany({
        where: { panelId: panelRecord.id },
      });

      if (componentIds.length === 0) {
        await prisma.test.update({
          where: { id: panelRecord.id },
          data: { isPanel: false },
        });

        panelRecord.isPanel = false;
        seededTestsBySlug.set(slug, panelRecord);
        logUniqueEntry(
          logs.skippedPanelMappings,
          `${slug}: no valid component slugs after filtering`,
        );
        console.warn(
          `Downgraded "${slug}" from panel to single test because no valid components remain`,
        );
        continue;
      }

      await prisma.testComponent.createMany({
        data: componentIds.map((componentTestId, index) => ({
          panelId: panelRecord.id,
          componentTestId,
          sortOrder: index,
        })),
      });

      logs.seededPanelMappings += 1;
      console.log(`Seeded panel mapping: ${slug} (${componentIds.length} components)`);
    }

    await resetManagedStateRestrictionSeeds();

    const laboratories = await prisma.laboratory.findMany({
      select: { id: true, code: true },
    });
    const laboratoryIdByCode = new Map(
      laboratories.map((laboratory) => [laboratory.code, laboratory.id]),
    );

    for (const policy of DEFAULT_STATE_RESTRICTION_POLICIES) {
      for (const laboratoryCode of policy.laboratoryCodes) {
        const laboratoryId = laboratoryIdByCode.get(laboratoryCode) ?? null;

        if (!laboratoryId) {
          logUniqueEntry(
            logs.skippedStateRestrictions,
            `${policy.stateCode}: missing laboratory "${laboratoryCode}"`,
          );
          console.warn(
            `Skipping state restriction seed for missing laboratory code "${laboratoryCode}"`,
          );
          continue;
        }

        await upsertStateRestrictionSeed(
          null,
          laboratoryId,
          policy.stateCode,
          policy.restrictionType,
          `${STATE_RESTRICTION_SEED_NOTE_PREFIX} ${policy.notes}`,
        );
        logs.seededStateRestrictions += 1;
      }
    }

    console.log(`Tests created: ${logs.createdTests}`);
    console.log(`Tests updated: ${logs.updatedTests}`);
    console.log(`Panel mappings seeded: ${logs.seededPanelMappings}`);
    console.log(`State restrictions seeded: ${logs.seededStateRestrictions}`);

    if (logs.skippedTests.length > 0) {
      console.warn('Skipped test rows:');
      logs.skippedTests.forEach((entry) => console.warn(`- ${entry}`));
    }

    if (logs.skippedPanelMappings.length > 0) {
      console.warn('Skipped panel mappings:');
      logs.skippedPanelMappings.forEach((entry) => console.warn(`- ${entry}`));
    }

    if (logs.skippedStateRestrictions.length > 0) {
      console.warn('Skipped state restrictions:');
      logs.skippedStateRestrictions.forEach((entry) => console.warn(`- ${entry}`));
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedTests().catch((error) => {
  console.error('Test seed failed', error);
  process.exitCode = 1;
});

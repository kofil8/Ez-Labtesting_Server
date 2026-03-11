import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USER_COUNT = 100;
const DEFAULT_PASSWORD = 'Test@1234';

const round2 = (value: number) => Math.round(value * 100) / 100;

async function seedUsers() {
  console.log(`Seeding ${USER_COUNT} users...`);

  let createdCount = 0;
  let updatedCount = 0;

  const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  for (let i = 1; i <= USER_COUNT; i++) {
    const userNumber = i.toString().padStart(3, '0');
    const email = `seed.user${userNumber}@example.com`;
    const phoneNumber = `+1555${i.toString().padStart(7, '0')}`;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const payload = {
      firstName: 'Seed',
      lastName: `User ${userNumber}`,
      email,
      phoneNumber,
      password: hashedPassword,
      isVerified: true,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    };

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: payload,
      });
      updatedCount++;
      continue;
    }

    await prisma.user.create({ data: payload });
    createdCount++;
  }

  console.log(`Users seeded. Created: ${createdCount}, Updated: ${updatedCount}`);
  console.log(`Default password for all seeded users: ${DEFAULT_PASSWORD}`);
}

type SeedPanel = {
  name: string;
  description: string;
  testCodes: string[];
  discountPercent: number;
};

const seedPanelDefs: SeedPanel[] = [
  {
    name: 'Complete Wellness Panel',
    description:
      'Comprehensive annual check covering blood health, heart, thyroid, kidneys, and metabolism.',
    testCodes: ['GH-001', 'HM-001', 'CA-001', 'TH-001', 'RN-001', 'MT-001'],
    discountPercent: 20,
  },
  {
    name: 'Heart Health Package',
    description:
      'Cardiovascular risk assessment with lipids, inflammation markers, and metabolic screening.',
    testCodes: ['CA-001', 'CA-002', 'MT-001', 'MT-002', 'HM-001'],
    discountPercent: 15,
  },
  {
    name: 'Thyroid Complete Package',
    description: 'Full thyroid function evaluation combined with blood count and vitamin D status.',
    testCodes: ['TH-001', 'TH-002', 'HM-001', 'NU-001'],
    discountPercent: 15,
  },
  {
    name: 'Diabetes & Metabolic Panel',
    description:
      'A1c, insulin resistance, kidney function, and lipids for complete metabolic health assessment.',
    testCodes: ['MT-001', 'MT-002', 'RN-001', 'RN-002', 'CA-001'],
    discountPercent: 15,
  },
  {
    name: "Women's Wellness Package",
    description:
      "Hormone panel, thyroid, heart, blood count, and vitamin D tailored for women's health.",
    testCodes: ['WH-001', 'TH-001', 'CA-001', 'HM-001', 'NU-001'],
    discountPercent: 20,
  },
  {
    name: "Men's Health Package",
    description:
      "Testosterone, prostate health, cardiovascular, and blood count for men's comprehensive wellness.",
    testCodes: ['MH-001', 'MH-002', 'CA-001', 'HM-001', 'MT-001'],
    discountPercent: 20,
  },
  {
    name: 'Comprehensive STD Screen',
    description:
      'Full STD screening panel plus hepatitis C antibody for complete sexual health testing.',
    testCodes: ['ST-001', 'ST-002', 'LV-002'],
    discountPercent: 10,
  },
  {
    name: 'Vitamin & Nutrition Panel',
    description:
      'Vitamin D, B12, folate, and bone density markers for complete nutritional status evaluation.',
    testCodes: ['NU-001', 'NU-002', 'BH-001'],
    discountPercent: 10,
  },
  {
    name: 'Liver Health Panel',
    description:
      'Liver function tests, hepatitis C screening, and urinalysis for complete liver and organ health.',
    testCodes: ['LV-001', 'LV-002', 'GH-002'],
    discountPercent: 10,
  },
  {
    name: 'Kidney Health Package',
    description:
      'Comprehensive kidney panel, microalbumin, metabolic, and urinalysis for renal function monitoring.',
    testCodes: ['RN-001', 'RN-002', 'MT-001', 'GH-002'],
    discountPercent: 10,
  },
  {
    name: 'Allergy & Sensitivity Package',
    description:
      'Food sensitivity and environmental allergen testing for a comprehensive allergy profile.',
    testCodes: ['AS-001', 'AS-002'],
    discountPercent: 15,
  },
  {
    name: 'Cancer Screening Panel',
    description:
      'PSA, ovarian marker CA-125, and complete blood count for a multi-cancer awareness screen.',
    testCodes: ['CN-001', 'CN-002', 'HM-001'],
    discountPercent: 15,
  },
  {
    name: 'Hormonal Balance Panel',
    description:
      'Testosterone, estradiol, thyroid, and cortisol for a complete hormonal health picture.',
    testCodes: ['HO-001', 'HO-002', 'TH-001', 'EN-001'],
    discountPercent: 15,
  },
  {
    name: 'Autoimmune Workup Panel',
    description:
      'ANA, anti-dsDNA, immunoglobulins, and complement for comprehensive autoimmune investigation.',
    testCodes: ['AI-001', 'AI-002', 'IM-001', 'IM-002'],
    discountPercent: 20,
  },
  {
    name: 'Rheumatology Screening',
    description:
      'RA panel, uric acid, and ANA screen for joint disease and inflammatory condition assessment.',
    testCodes: ['RM-001', 'RM-002', 'AI-001'],
    discountPercent: 10,
  },
  {
    name: 'Prenatal Essential Panel',
    description:
      'First trimester prenatal panel with thyroid, urinalysis, and CBC for early prenatal care.',
    testCodes: ['PR-001', 'TH-001', 'GH-002', 'HM-001'],
    discountPercent: 20,
  },
  {
    name: 'Female Fertility Package',
    description:
      'Ovarian reserve, hormones panel, and thyroid for a complete female fertility workup.',
    testCodes: ['RH-001', 'WH-001', 'TH-001'],
    discountPercent: 15,
  },
  {
    name: 'Mental Wellness Panel',
    description:
      'Organic mood disorder screening with mental wellness labs, MTHFR, B12/folate, and thyroid.',
    testCodes: ['ML-001', 'ML-002', 'NU-002', 'TH-001'],
    discountPercent: 15,
  },
  {
    name: 'Bone & Joint Health Panel',
    description:
      'Bone density markers, PTH, uric acid, and vitamin D for comprehensive musculoskeletal health.',
    testCodes: ['BH-001', 'BH-002', 'RM-002', 'NU-001'],
    discountPercent: 10,
  },
  {
    name: 'Executive Health Screen',
    description:
      'Comprehensive executive health panel covering 9 key areas: wellness, heart, thyroid, metabolic, kidney, blood, and cancer markers.',
    testCodes: [
      'GH-001',
      'CA-001',
      'CA-002',
      'TH-002',
      'MT-001',
      'MT-002',
      'RN-001',
      'HM-001',
      'CN-001',
    ],
    discountPercent: 25,
  },
];

async function seedPanels() {
  console.log(`Seeding ${seedPanelDefs.length} test panels...`);

  // Load all seeded tests into a map by testCode for fast lookup
  const allTests = await prisma.test.findMany({
    where: { isActive: true },
    select: { id: true, testCode: true, price: true },
  });

  if (allTests.length === 0) {
    throw new Error('No active tests found. Run seed:tests first.');
  }

  const testMap = new Map(allTests.map((t) => [t.testCode, t]));

  let createdCount = 0;
  let updatedCount = 0;

  for (const def of seedPanelDefs) {
    const resolvedTests = def.testCodes
      .map((code) => testMap.get(code))
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    if (resolvedTests.length === 0) {
      console.warn(`⚠️  Skipping panel "${def.name}" — no matching tests found.`);
      continue;
    }

    const rawTotal = resolvedTests.reduce((sum, t) => sum + t.price, 0);
    const basePrice = round2(rawTotal * (1 - def.discountPercent / 100));

    const testLinks = resolvedTests.map((t, index) => ({
      testId: t.id,
      sortOrder: index + 1,
      isRequired: true,
    }));

    const existing = await prisma.testPanel.findFirst({
      where: { name: def.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.testPanel.update({
        where: { id: existing.id },
        data: {
          name: def.name,
          description: def.description,
          basePrice,
          discountPercent: def.discountPercent,
          isActive: true,
          tests: { deleteMany: {}, create: testLinks },
        },
      });
      updatedCount++;
    } else {
      await prisma.testPanel.create({
        data: {
          name: def.name,
          description: def.description,
          basePrice,
          discountPercent: def.discountPercent,
          isActive: true,
          tests: { create: testLinks },
        },
      });
      createdCount++;
    }

    console.log(
      `✅ Panel: ${def.name} (${resolvedTests.length} tests, ${def.discountPercent}% off → $${basePrice})`,
    );
  }

  console.log(`Panels seeded. Created: ${createdCount}, Updated: ${updatedCount}`);
}

async function main() {
  try {
    await seedUsers();
    await seedPanels();

    const [seededUsers, seededPanels] = await Promise.all([
      prisma.user.count({
        where: { email: { startsWith: 'seed.user' } },
      }),
      prisma.testPanel.count(),
    ]);

    console.log('----------------------------------------');
    console.log(`Verification: ${seededUsers}/${USER_COUNT} users present`);
    console.log(`Verification: ${seededPanels}/${seedPanelDefs.length} panels present`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seeding users/panels failed:', error);
  process.exit(1);
});

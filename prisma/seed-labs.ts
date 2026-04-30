import { PrismaClient } from '@prisma/client';
import { parseLaboratoryRowsFromSql, readUtf8File, resolveSeedInputFile } from './seed-utils';

const prisma = new PrismaClient();
const LABORATORIES_SQL_PATH = resolveSeedInputFile('LABORATORIES_SQL_PATH', 'laboratories.sql');

const applyLaboratoryVisibilityPolicy = (code: string, isActiveFromSql: boolean) => {
  const normalizedCode = code.toUpperCase();

  if (normalizedCode === 'ACCESS') {
    return {
      isActive: true,
      isVisibleToCustomers: true,
    };
  }

  if (normalizedCode === 'CPL') {
    return {
      isActive: true,
      isVisibleToCustomers: false,
    };
  }

  return {
    isActive: isActiveFromSql,
    isVisibleToCustomers: isActiveFromSql,
  };
};

async function seedLaboratories() {
  let createdCount = 0;
  let updatedCount = 0;

  try {
    const sql = readUtf8File(LABORATORIES_SQL_PATH);
    const laboratoryRows = parseLaboratoryRowsFromSql(sql);

    if (laboratoryRows.length === 0) {
      throw new Error(`No laboratory seed rows were parsed from ${LABORATORIES_SQL_PATH}`);
    }

    const existingLaboratories = await prisma.laboratory.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(existingLaboratories.map((laboratory) => laboratory.code));

    for (const row of laboratoryRows) {
      const visibility = applyLaboratoryVisibilityPolicy(row.code, row.isActive);
      const existed = existingCodes.has(row.code);

      await prisma.laboratory.upsert({
        where: { code: row.code },
        update: {
          name: row.name,
          apiEndpoint: row.apiEndpoint,
          apiKeyEncrypted: row.apiKeyEncrypted,
          isActive: visibility.isActive,
          isVisibleToCustomers: visibility.isVisibleToCustomers,
        },
        create: {
          name: row.name,
          code: row.code,
          apiEndpoint: row.apiEndpoint,
          apiKeyEncrypted: row.apiKeyEncrypted,
          isActive: visibility.isActive,
          isVisibleToCustomers: visibility.isVisibleToCustomers,
        },
      });

      if (existed) {
        updatedCount += 1;
        console.log(`Updated laboratory: ${row.code}`);
      } else {
        createdCount += 1;
        existingCodes.add(row.code);
        console.log(`Created laboratory: ${row.code}`);
      }
    }

    console.log(`Laboratories created: ${createdCount}`);
    console.log(`Laboratories updated: ${updatedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedLaboratories().catch((error) => {
  console.error('Laboratory seed failed', error);
  process.exitCode = 1;
});

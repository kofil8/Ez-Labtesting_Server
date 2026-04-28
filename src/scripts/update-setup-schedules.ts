import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

type CsvRow = {
  name?: string;
  setUpSchedule?: string | number | boolean | null;
};

type ScheduleByName = Map<string, string[]>;

const DEFAULT_CSV_PATH =
  "C:/Users/kskof/Downloads/test_names_setup_schedule.csv";

function normalizeScheduleValue(value: CsvRow["setUpSchedule"]): string[] {
  const schedule = String(value ?? "").trim();

  if (!schedule || schedule.toUpperCase() === "N/A") {
    return [];
  }

  return [schedule];
}

function sameSchedule(left: string[], right: string[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatSchedule(schedule: string[]): string {
  return schedule.length > 0 ? JSON.stringify(schedule) : "[]";
}

function loadSchedulesFromCsv(csvPath: string): {
  schedulesByName: ScheduleByName;
  conflicts: Array<{ name: string; schedules: string[][] }>;
  csvRowCount: number;
  uniqueCsvNameCount: number;
} {
  const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const workbook = XLSX.read(csvText, { type: "string" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(`No worksheets found in CSV: ${csvPath}`);
  }

  const rows = XLSX.utils.sheet_to_json<CsvRow>(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  const scheduleOptionsByName = new Map<string, string[][]>();

  for (const row of rows) {
    const name = String(row.name ?? "").trim();

    if (!name) {
      continue;
    }

    const schedule = normalizeScheduleValue(row.setUpSchedule);
    const existingSchedules = scheduleOptionsByName.get(name) ?? [];

    if (!existingSchedules.some((existing) => sameSchedule(existing, schedule))) {
      existingSchedules.push(schedule);
    }

    scheduleOptionsByName.set(name, existingSchedules);
  }

  const schedulesByName: ScheduleByName = new Map();
  const conflicts: Array<{ name: string; schedules: string[][] }> = [];

  for (const [name, schedules] of scheduleOptionsByName.entries()) {
    if (schedules.length === 1) {
      schedulesByName.set(name, schedules[0]);
    } else {
      conflicts.push({ name, schedules });
    }
  }

  return {
    schedulesByName,
    conflicts,
    csvRowCount: rows.length,
    uniqueCsvNameCount: scheduleOptionsByName.size,
  };
}

async function updateSetupSchedules(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPathArg = args.find((arg) => arg !== "--dry-run");
  const csvPath = path.resolve(csvPathArg ?? DEFAULT_CSV_PATH);

  console.log("Starting setup schedule update");
  console.log(`CSV path: ${csvPath}`);
  console.log(`Mode: ${dryRun ? "dry run" : "write"}`);
  console.log("");

  const { schedulesByName, conflicts, csvRowCount, uniqueCsvNameCount } =
    loadSchedulesFromCsv(csvPath);

  const tests = await prisma.test.findMany({
    select: {
      id: true,
      name: true,
      setUpSchedule: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const csvNames = new Set(schedulesByName.keys());
  const conflictNames = new Set(conflicts.map((conflict) => conflict.name));
  const dbNames = new Set(tests.map((test) => test.name.trim()));
  const csvNamesNotInDb = [...csvNames]
    .filter((name) => !dbNames.has(name))
    .sort((left, right) => left.localeCompare(right));
  const dbNamesWithoutCsv = [...dbNames]
    .filter((name) => !csvNames.has(name) && !conflictNames.has(name))
    .sort((left, right) => left.localeCompare(right));

  let matchedCount = 0;
  let nonEmptyMatchedCount = 0;
  let emptyMatchedCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  for (const test of tests) {
    const testName = test.name.trim();
    const schedule = schedulesByName.get(testName);

    if (!schedule) {
      continue;
    }

    matchedCount++;

    if (schedule.length > 0) {
      nonEmptyMatchedCount++;
    } else {
      emptyMatchedCount++;
    }

    if (sameSchedule(test.setUpSchedule, schedule)) {
      unchangedCount++;
      continue;
    }

    changedCount++;

    if (!dryRun) {
      await prisma.test.update({
        where: { id: test.id },
        data: { setUpSchedule: schedule },
      });
    }
  }

  const testsWithScheduleCount = await prisma.test.count({
    where: {
      setUpSchedule: {
        isEmpty: false,
      },
    },
  });

  console.log("Summary");
  console.log(`  CSV rows: ${csvRowCount}`);
  console.log(`  Unique CSV names: ${uniqueCsvNameCount}`);
  console.log(`  DB tests: ${tests.length}`);
  console.log(`  Exact usable DB matches: ${matchedCount}`);
  console.log(`  Matches with non-empty schedule: ${nonEmptyMatchedCount}`);
  console.log(`  Matches with empty schedule: ${emptyMatchedCount}`);
  console.log(`  ${dryRun ? "Would update" : "Updated"}: ${changedCount}`);
  console.log(`  Already correct: ${unchangedCount}`);
  console.log(
    `  DB tests with non-empty setup schedule ${
      dryRun ? "before update" : "after update"
    }: ${testsWithScheduleCount}`
  );
  console.log("");

  if (conflicts.length > 0) {
    console.log("Skipped conflicting duplicate CSV names");
    for (const conflict of conflicts) {
      const schedules = conflict.schedules.map(formatSchedule).join(" | ");
      console.log(`  - ${conflict.name}: ${schedules}`);
    }
    console.log("");
  }

  if (csvNamesNotInDb.length > 0) {
    console.log("CSV names not found in DB");
    for (const name of csvNamesNotInDb) {
      console.log(`  - ${name}`);
    }
    console.log("");
  }

  if (dbNamesWithoutCsv.length > 0) {
    console.log("DB test names without exact usable CSV match");
    for (const name of dbNamesWithoutCsv) {
      console.log(`  - ${name}`);
    }
  }
}

updateSetupSchedules()
  .catch((error) => {
    console.error("Fatal error updating setup schedules:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

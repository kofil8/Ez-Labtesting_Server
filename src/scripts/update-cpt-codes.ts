import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface MedicalTest {
  id: number;
  name: string;
  cptCode: string | null;
  slug: string;
  [key: string]: any;
}

/**
 * Parse CPT codes from a string
 * Examples:
 * - "86235 (x9)" -> ["86235"]
 * - "82040" -> ["82040"]
 * - "86900, 86901" -> ["86900", "86901"]
 * - "83001, 83002, 84146, 82670, 84403, 82627" -> ["83001", "83002", "84146", "82670", "84403", "82627"]
 */
function parseCptCodes(cptCodeString: string | null): string[] {
  if (!cptCodeString) return [];

  const codes: string[] = [];
  const parts = cptCodeString.split(",");

  for (const part of parts) {
    // Remove whitespace and anything in parentheses
    const cleaned = part.trim().split(/\s*\(/)[0].trim();
    if (cleaned) {
      codes.push(cleaned);
    }
  }

  return codes;
}

async function updateCptCodes() {
  try {
    console.log("📚 Starting CPT Code Database Update...\n");

    // Read the updated medical-tests.json
    // The file is in the root of the Server directory
    const jsonPath = path.resolve("medical-tests.json");
    console.log(`📁 Reading from: ${jsonPath}\n`);
    const jsonData: MedicalTest[] = JSON.parse(
      fs.readFileSync(jsonPath, "utf-8")
    );

    console.log(`📖 Loaded ${jsonData.length} tests from medical-tests.json\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    for (const test of jsonData) {
      try {
        const dbTest = await prisma.test.findFirst({
          where: { name: test.name },
        });

        if (!dbTest) {
          console.log(`⚠️  Test not found in DB: "${test.name}"`);
          notFoundCount++;
          continue;
        }

        // Parse CPT codes
        const cptCodes = parseCptCodes(test.cptCode);

        // Only update if there are CPT codes to add
        if (cptCodes.length > 0) {
          const updated = await prisma.test.update({
            where: { id: dbTest.id },
            data: { cptCode: cptCodes },
          });

          console.log(
            `✅ Updated: ${test.name}`
          );
          console.log(
            `   CPT Codes: ${cptCodes.join(", ")}\n`
          );
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped: ${test.name} (no CPT code)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating "${test.name}":`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Update Summary:");
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ⚠️  Not Found: ${notFoundCount}`);
    console.log("=".repeat(60));

    // Verify updates - get all tests to check
    const allTests = await prisma.test.findMany({
      select: { id: true, name: true, cptCode: true },
    });

    const testsWithCptCodes = allTests.filter((t) => t.cptCode.length > 0);
    const testsWithoutCptCodes = allTests.filter((t) => t.cptCode.length === 0);

    console.log(
      `\n🔍 Total tests with CPT codes in DB: ${testsWithCptCodes.length}`
    );

    console.log(`⚪ Tests still without CPT codes: ${testsWithoutCptCodes.length}`);

    if (testsWithoutCptCodes.length > 0 && testsWithoutCptCodes.length <= 20) {
      console.log("\nTests without CPT codes:");
      testsWithoutCptCodes.forEach((test) => {
        console.log(`  - ${test.name}`);
      });
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateCptCodes();

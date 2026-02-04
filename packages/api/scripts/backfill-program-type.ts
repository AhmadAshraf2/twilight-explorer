/**
 * Backfill script to populate the programType column in ZkosTransfer table
 *
 * This script updates existing records based on the order_operation field
 * in the decoded_data JSON column.
 *
 * Usage: npx tsx packages/api/scripts/backfill-program-type.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Starting programType backfill...\n');

  // First, let's see what we have
  const total = await prisma.zkosTransfer.count();
  const withProgramType = await prisma.zkosTransfer.count({
    where: { programType: { not: null } },
  });

  console.log(`Total records: ${total}`);
  console.log(`Already have programType: ${withProgramType}`);
  console.log(`Need to process: ${total - withProgramType}\n`);

  // Update using raw SQL for efficiency
  // Check both paths: decoded_data->'data'->'summary'->>'order_operation'
  // and decoded_data->'summary'->>'order_operation'
  const result = await prisma.$executeRaw`
    UPDATE "ZkosTransfer"
    SET "programType" = CASE
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) = 'order_open' THEN 'CreateTraderOrder'
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) IN ('order_close', 'order_settle') THEN 'SettleTraderOrder'
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) = 'lend_open' THEN 'CreateLendOrder'
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) IN ('lend_close', 'lend_settle') THEN 'SettleLendOrder'
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) = 'liquidate' THEN 'LiquidateOrder'
      WHEN COALESCE(
        "decodedData"->'data'->'summary'->>'order_operation',
        "decodedData"->'summary'->>'order_operation'
      ) IN ('relayer_init', 'relayer_initialize') THEN 'RelayerInitializer'
      ELSE NULL
    END
    WHERE "programType" IS NULL
  `;

  console.log(`Updated ${result} records\n`);

  // Verify the results
  const counts = await prisma.$queryRaw<Array<{ programType: string | null; count: bigint }>>`
    SELECT "programType", COUNT(*) as count
    FROM "ZkosTransfer"
    GROUP BY "programType"
    ORDER BY "programType" NULLS LAST
  `;

  console.log('Results by programType:');
  for (const row of counts) {
    console.log(`  ${row.programType || '(null/Transfer)'}: ${row.count}`);
  }

  await prisma.$disconnect();
  console.log('\nBackfill complete!');
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  prisma.$disconnect();
  process.exit(1);
});

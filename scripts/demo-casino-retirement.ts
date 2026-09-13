import { Prisma, PrismaClient } from "@prisma/client";

import {
  applyDemoCasinoRetirement,
  assertDemoRetirementApplyAuthority,
  inspectDemoCasinoRetirementPlan,
} from "./demo-casino-retirement-core";

type Mode = "plan" | "apply" | "verify";

const databaseUrl = process.env.DATABASE_URL?.trim() || process.env.PRODDB_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DEMO_RETIREMENT_DATABASE_URL_REQUIRED");
const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function readOnlyReport(mode: "plan" | "verify") {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const plan = await inspectDemoCasinoRetirementPlan(transaction);
    return {
      mode: mode.toUpperCase(),
      productionMutationPerformed: false,
      summary: {
        demoCasinoCount: plan.demoCasinoCount,
        existingDemoCasinoCount: plan.existingDemoCasinoCount,
        casinos: plan.casinos,
        existingAffiliateRows: plan.existingAffiliateRows,
        nonZeroDependencies: plan.dependencies
          .filter((dependency) => dependency.totalRows > 0)
          .map(({ table, totalRows, rowsByCasino, disposition, dispositionCounts, relationPaths }) => ({
            table,
            totalRows,
            rowsByCasino,
            disposition,
            dispositionCounts,
            relationPaths,
          })),
        nonZeroAffiliateDependencies: plan.affiliateDependencies
          .filter((dependency) => dependency.totalRows > 0),
        retainedHistory: plan.retainedHistory,
        conflicts: plan.conflicts,
        readyToApply: plan.readyToApply,
        planSha256: plan.planSha256,
      },
      plan,
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 10_000,
    timeout: 120_000,
  });
}

async function main() {
  const mode = (process.argv[2] ?? "plan") as Mode;
  if (!(<readonly Mode[]>["plan", "apply", "verify"]).includes(mode)) {
    throw new Error("DEMO_RETIREMENT_MODE_UNSUPPORTED");
  }

  if (mode === "plan" || mode === "verify") {
    const report = await readOnlyReport(mode);
    console.log(JSON.stringify(
      process.argv.includes("--summary-only")
        ? {
            mode: report.mode,
            productionMutationPerformed: report.productionMutationPerformed,
            summary: report.summary,
          }
        : report,
      null,
      2,
    ));
    if (mode === "verify" && (
      report.plan.conflicts.length !== 0
      || report.plan.existingDemoCasinoCount !== 0
      || Object.values(report.plan.existingAffiliateRows).some((count) => count !== 0)
    )) throw new Error("DEMO_RETIREMENT_VERIFICATION_FAILED");
    return;
  }

  assertDemoRetirementApplyAuthority({
    confirmation: argument("confirm"),
    planSha256: argument("plan-sha256"),
    environmentConfirmation: process.env.DEMO_CASINO_RETIREMENT_APPLY_CONFIRMATION,
  });
  const reviewedPlanSha256 = argument("plan-sha256")!;
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtext('b4gamble:rfc-012-demo-retirement'))");
    return applyDemoCasinoRetirement(transaction, reviewedPlanSha256);
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 120_000,
  });
  console.log(JSON.stringify({
    mode: "APPLY",
    productionMutationPerformed: true,
    result,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

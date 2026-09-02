import { affiliateRouteHealthService } from "../lib/services/affiliate-route-health.service";
import { prisma } from "../lib/db/prisma";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function main() {
  const report = await affiliateRouteHealthService.run({ casino: option("--casino"), countryCode: option("--geo") });
  if (process.argv.includes("--json")) console.info(JSON.stringify(report, null, 2));
  else {
    console.info(`Affiliate route health: ${report.noActiveRoutes ? "no active routes" : report.healthy ? "healthy" : "attention required"}`);
    console.info(`Checked ${report.summary.routes} route(s) at ${report.checkedAt}`);
    for (const result of report.results) {
      console.info(`${result.status.padEnd(20)} ${result.casinoSlug} × ${result.countryCode} /r/${result.redirectSlug ?? "missing"} — ${result.reason}`);
    }
  }
  if (!report.healthy) process.exitCode = 1;
}

main().catch(() => {
  console.error("Affiliate route health failed before a safe report could be produced.");
  process.exitCode = 2;
}).finally(async () => prisma.$disconnect());

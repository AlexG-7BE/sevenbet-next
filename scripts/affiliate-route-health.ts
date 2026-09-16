import { affiliateRouteHealthService } from "../lib/services/affiliate-route-health.service";
import { prisma } from "../lib/db/prisma";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function main() {
  const geo = option("--geo")?.trim().toUpperCase().replace(/_/g, "-");
  const report = await affiliateRouteHealthService.run({
    casino: option("--casino"),
    ...(geo?.includes("-") ? { marketCode: geo } : { countryCode: geo }),
  });
  if (process.argv.includes("--json")) console.info(JSON.stringify(report, null, 2));
  else {
    console.info(`Affiliate route health: ${report.summary.totalRoutes === 0 ? "no active routes" : report.actionRequired ? "action required" : "no action required"}`);
    console.info(`Checked ${report.summary.totalRoutes} route(s) at ${report.checkedAt}; ${report.summary.routesRequiringAction} require action`);
    for (const result of report.results) {
      const decision = result.actionRequired ? "ACTION" : "NO_ACTION";
      console.info(`${decision.padEnd(10)} ${result.currentEvidence.verifierStatus.padEnd(20)} ${result.casinoSlug} × ${result.marketCode} (${result.countryCode}) /r/${result.redirectSlug ?? "missing"} — ${result.currentEvidence.reason}`);
    }
  }
  if (report.actionRequired) process.exitCode = 1;
}

main().catch(() => {
  console.error("Affiliate route health failed before a safe report could be produced.");
  process.exitCode = 2;
}).finally(async () => prisma.$disconnect());

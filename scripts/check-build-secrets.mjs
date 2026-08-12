import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const roots = [".next/static", ".next/server/app"];
const browserDeliverableExtensions = new Set([
  ".body",
  ".css",
  ".html",
  ".js",
  ".json",
  ".meta",
  ".rsc",
  ".txt",
]);
const forbidden = [
  "ci-only-better-auth-sentinel-do-not-use",
  "ci-only-admin-preview-sentinel-do-not-use",
  "ops-ci-database-password",
  "ops-ci-auth-secret-not-used-by-production",
  "ops-ci-admin-token-not-used-by-production",
  "ops-ci-cron-secret-not-used-by-production",
  "ops-ci-vercel-token-not-used-by-production",
  "postgresql://",
  "postgres://",
  "AFFILIATE_CREDENTIALS_",
];

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(target)));
    if (entry.isFile() && browserDeliverableExtensions.has(path.extname(entry.name))) {
      files.push(target);
    }
  }
  return files;
}

const candidates = [];
for (const root of roots) {
  try {
    if ((await stat(root)).isDirectory()) candidates.push(...(await filesBelow(root)));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (candidates.length === 0) throw new Error("No browser-deliverable build output found");

const violations = [];
for (const file of candidates) {
  const content = await readFile(file, "utf8");
  if (forbidden.some((pattern) => content.includes(pattern))) violations.push(file);
}

if (violations.length > 0) {
  throw new Error(`Secret-pattern scan failed in ${violations.length} browser-deliverable file(s)`);
}

console.info(`Build secret scan passed for ${candidates.length} browser-deliverable files`);

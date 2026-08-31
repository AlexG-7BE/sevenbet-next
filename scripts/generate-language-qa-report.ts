import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { generateLanguageQaReport } from "../lib/i18n/language-qa";

async function main() {
  const report = generateLanguageQaReport();
  const destination = resolve(process.cwd(), "docs/internationalisation/ai-language-qa-report.json");
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${report.status} ${destination}`);
  if (report.status !== "PASS") process.exitCode = 1;
}

void main();

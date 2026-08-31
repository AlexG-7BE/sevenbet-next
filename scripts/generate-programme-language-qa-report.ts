import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { generateProgrammeLanguageQaReport } from "../lib/i18n/programme-language-qa";

async function main() {
  const report = generateProgrammeLanguageQaReport();
  const destination = resolve(process.cwd(), "docs/internationalisation/programme-ai-language-qa-report.json");
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${report.status} ${destination}`);
  if (report.status !== "AI_LANGUAGE_QA_PASSED") process.exitCode = 1;
}

void main();

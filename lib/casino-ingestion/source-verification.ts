import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CasinoIngestionBundle } from "./contract";

export interface SourceVerificationResult {
  verified: number;
  files: Array<{ path: string; sha256: string }>;
}

export async function verifyCasinoIngestionSources(bundle: CasinoIngestionBundle, sourceRoot: string): Promise<SourceVerificationResult> {
  const root = path.resolve(sourceRoot);
  const files: SourceVerificationResult["files"] = [];
  for (const source of bundle.sourceFiles) {
    const absolutePath = path.resolve(root, source.path);
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) throw new Error(`Source path escapes the explicit source root: ${source.path}`);
    const digest = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
    if (digest !== source.sha256) throw new Error(`Frozen source checksum mismatch: ${source.path}`);
    files.push({ path: source.path, sha256: digest });
  }
  return { verified: files.length, files };
}

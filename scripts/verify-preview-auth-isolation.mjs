import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

let verificationStage = "initialization";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function httpsOrigin(name) {
  const url = new URL(required(name));
  if (url.protocol !== "https:" || url.pathname !== "/") {
    throw new Error(`${name} must be an HTTPS origin`);
  }
  return url.origin;
}

function vercelRequest({ origin, path, method = "GET", body, cookieJar }) {
  const curlArguments = [
    "curl",
    path,
    "--deployment",
    origin,
    "--",
    "--silent",
    "--show-error",
    "--fail-with-body",
    "--request",
    method,
    "--header",
    `Origin: ${origin}`,
    "--cookie",
    cookieJar,
    "--cookie-jar",
    cookieJar,
  ];

  if (body) {
    curlArguments.push(
      "--header",
      "Content-Type: application/json",
      "--data-binary",
      "@-",
    );
  }

  const result = spawnSync("vercel", curlArguments, {
    encoding: "utf8",
    input: body ? JSON.stringify(body) : undefined,
    maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error("Protected deployment request failed");
  }

  const responseLine = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  if (!responseLine) throw new Error("Protected deployment response is empty");
  return JSON.parse(responseLine);
}

async function main() {
  const previewDatabaseURL = required("ENVISO_PREVIEW_DATABASE_URL");
  const productionDatabaseURL = required("ENVISO_PRODUCTION_DATABASE_URL");
  const previewOrigin = httpsOrigin("ENVISO_PREVIEW_BASE_URL");
  const productionOrigin = httpsOrigin("ENVISO_PRODUCTION_BASE_URL");

  if (previewDatabaseURL === productionDatabaseURL) {
    throw new Error("Preview and Production database authorities match");
  }
  if (previewOrigin === productionOrigin) {
    throw new Error("Preview and Production origins match");
  }

  const preview = new PrismaClient({ datasourceUrl: previewDatabaseURL });
  const production = new PrismaClient({ datasourceUrl: productionDatabaseURL });
  const email = `enviso-${randomUUID()}@example.invalid`;
  const password = randomBytes(36).toString("base64url");
  const previousUmask = process.umask(0o077);
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "sevenbet-env-iso-"));
  const cookieJar = join(temporaryDirectory, "cookies.txt");
  let cleanupResult = "NOT RUN";

  try {
    verificationStage = "initial database check";
    const [previewBefore, productionBefore] = await Promise.all([
      preview.user.count({ where: { email } }),
      production.user.count({ where: { email } }),
    ]);
    if (previewBefore !== 0 || productionBefore !== 0) {
      throw new Error("Isolation canary already exists");
    }

    verificationStage = "Preview sign-up";
    vercelRequest({
      origin: previewOrigin,
      path: "/api/auth/sign-up/email",
      method: "POST",
      body: {
        email,
        name: "ENV-ISO Preview Canary",
        password,
      },
      cookieJar,
    });

    verificationStage = "Preview cookie check";
    if (!existsSync(cookieJar) || statSync(cookieJar).size === 0) {
      throw new Error("Preview session cookie jar is missing");
    }

    verificationStage = "Preview session check";
    const previewSession = vercelRequest({
      origin: previewOrigin,
      path: "/api/auth/get-session",
      cookieJar,
    });
    if (previewSession?.user?.email !== email) {
      throw new Error("Preview did not recognize its session");
    }

    verificationStage = "Production session check";
    const productionSession = vercelRequest({
      origin: productionOrigin,
      path: "/api/auth/get-session",
      cookieJar,
    });
    if (productionSession?.user) {
      throw new Error("Production recognized the Preview session");
    }

    verificationStage = "database mutation check";
    const [previewPresent, productionPresent] = await Promise.all([
      preview.user.count({ where: { email } }),
      production.user.count({ where: { email } }),
    ]);
    if (previewPresent !== 1 || productionPresent !== 0) {
      throw new Error("Database mutation isolation check failed");
    }

    console.log("Database authority: Production != Preview — PASS");
    console.log("Preview auth account and session: PASS");
    console.log("Production session rejection: PASS");
    console.log("Preview/Production cookie host boundary: PASS");
    console.log("Safe mutation: Preview PRESENT / Production ABSENT — PASS");
  } finally {
    const pendingStage = verificationStage;
    verificationStage = "Preview canary cleanup";
    try {
      await preview.user.deleteMany({ where: { email } });
      const remaining = await preview.user.count({ where: { email } });
      if (remaining !== 0) throw new Error("Preview canary cleanup failed");
      cleanupResult = "PASS";
    } finally {
      await Promise.allSettled([preview.$disconnect(), production.$disconnect()]);
      rmSync(temporaryDirectory, { force: true, recursive: true });
      process.umask(previousUmask);
    }

    console.log(`Preview canary cleanup: ${cleanupResult}`);
    verificationStage = pendingStage;
  }
}

main().catch((error) => {
  const kind = error instanceof Error ? error.name : "UnknownError";
  console.error(
    `Environment isolation verification failed at ${verificationStage} (${kind})`,
  );
  process.exitCode = 1;
});

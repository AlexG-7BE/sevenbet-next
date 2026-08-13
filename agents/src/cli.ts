import { readFile, stat } from "node:fs/promises";
import { parseArgs } from "node:util";
import process from "node:process";

import { ZodError } from "zod";

import { AgentKeySchema } from "./contracts.js";
import { AgentCoreError, runOperationalAgent } from "./runner.js";
import { listSpecialists } from "./registry.js";

const MAX_INPUT_FILE_BYTES = 256 * 1024;

interface CliErrorShape {
  error: {
    code: string;
    message: string;
  };
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(error: unknown): void {
  let body: CliErrorShape = {
    error: {
      code: "COMMAND_FAILED",
      message: "The command failed without exposing sensitive input or provider data.",
    },
  };

  if (error instanceof AgentCoreError) {
    body = { error: { code: error.code, message: error.message } };
  } else if (error instanceof ZodError) {
    body = {
      error: {
        code: "VALIDATION_FAILED",
        message: "The input or command did not match the closed contract.",
      },
    };
  } else if (error instanceof SyntaxError) {
    body = {
      error: {
        code: "INVALID_JSON",
        message: "The input file is not valid JSON.",
      },
    };
  } else if (error instanceof Error && error.message.startsWith("CLI_")) {
    body = {
      error: {
        code: error.message,
        message: "The command arguments are incomplete or invalid.",
      },
    };
  }

  process.stderr.write(`${JSON.stringify(body, null, 2)}\n`);
  process.exitCode = 1;
}

async function readInputFile(path: string): Promise<unknown> {
  const file = await stat(path);

  if (!file.isFile() || file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error("CLI_INPUT_FILE_INVALID");
  }

  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function main(): Promise<void> {
  const parsed = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      agent: { type: "string" },
      input: { type: "string" },
      tier: { type: "string" },
      model: { type: "string" },
      "max-turns": { type: "string" },
      "timeout-ms": { type: "string" },
    },
  });
  const [command] = parsed.positionals;

  if (command === "list") {
    printJson(
      listSpecialists().map((definition) => ({
        key: definition.key,
        name: definition.name,
        defaultTier: definition.defaultTier,
        allowedRecommendations: definition.allowedRecommendations,
      })),
    );
    return;
  }

  if (command !== "run" || !parsed.values.agent || !parsed.values.input) {
    throw new Error("CLI_USAGE_INVALID");
  }

  const agent = AgentKeySchema.parse(parsed.values.agent);
  const input = await readInputFile(parsed.values.input);
  const maxTurns = parsed.values["max-turns"]
    ? Number(parsed.values["max-turns"])
    : undefined;
  const timeoutMs = parsed.values["timeout-ms"]
    ? Number(parsed.values["timeout-ms"])
    : undefined;
  const result = await runOperationalAgent(agent, input, {
    tier: parsed.values.tier,
    model: parsed.values.model,
    maxTurns,
    timeoutMs,
  });

  printJson(result);
}

main().catch((error: unknown) => {
  fail(error);
});

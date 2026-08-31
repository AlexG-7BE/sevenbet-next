import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { NextRequest } from "next/server";
import ts from "typescript";

import {
  isAllowedGoogleLinkRequest,
  isAllowedGoogleSignInRequest,
  programmeGoogleCallbacks,
} from "../lib/auth/google-flow";
import {
  generateProgrammeLanguageQaReport,
} from "../lib/i18n/programme-language-qa";
import {
  programmeCatalogueEntries,
  programmeText,
} from "../lib/i18n/programme-catalog";
import {
  parseProgrammeAudioUpload,
} from "../lib/programme/application/programme-ai-transcription.service";
import {
  anonymousProgrammeSubject,
  loadProgrammeSubjectContent,
  saveProgrammeSubjectContent,
} from "../lib/programme/local-subject-storage";
import { programmeAccessFailureMessageKey } from "../lib/programme/program-ai/access-errors";
import {
  deterministicGuidance,
  deterministicReview,
} from "../lib/programme/program-ai/mission-guidance";
import { OpenAiProgrammeAiAdapter } from "../lib/programme/program-ai/openai-adapters";
import { OpenAiMissionGuidanceAdapter } from "../lib/programme/program-ai/openai-mission-guidance";
import { ProgrammeAiOrchestrator } from "../lib/programme/program-ai/orchestration";
import { assertSafeProgrammeGeneratedText } from "../lib/programme/program-ai/output-safety";
import { ProgrammeProviderError } from "../lib/programme/program-ai/provider-errors";
import {
  PROGRAM_AI_OPENAI_MODEL,
  PROGRAM_AI_TRANSCRIPTION_MODEL,
} from "../lib/programme/program-ai/runtime-config";
import {
  parseProgramAiLocalWording,
} from "../lib/programme/program-ai/mission-validation";
import { parseProgrammeAiTurn } from "../lib/programme/program-ai/validation";
import {
  PROGRAMME_LOCALES,
  PROGRAMME_PRESENTATION_CONTEXT,
  PROGRAMME_ROUTES,
  parseProgrammeLocale,
  parseProgrammeRoute,
  programmeHelpPath,
  programmeLocaleFromPath,
  programmeLocaleHref,
  programmePath,
  programmePathForPresentationLocale,
  programmePublicHref,
  programmeTranscriptionLanguage,
  safeProgrammePresentationSearch,
  type ProgrammeLocale,
} from "../lib/programme/presentation";
import {
  PRESENTATION_CONTEXT_HEADER,
  PRESENTATION_LANGUAGE_HEADER,
  PRESENTATION_MARKET_HEADER,
} from "../lib/market/routing";
import { middleware } from "../middleware";

const expectedRoutes = [
  ["en-GB", "GB", "gb", "/program", "en"],
  ["de-DE", "DE", "de", "/de/program", "de"],
  ["es-ES", "ES", "es", "/es/program", "es"],
  ["sv-SE", "SE", "se", "/se/program", "sv"],
  ["da-DK", "DK", "dk", "/dk/program", "da"],
  ["el-GR", "GR", "gr", "/gr/program", "el"],
  ["it-IT", "IT", "it", "/it/program", "it"],
  ["pt-PT", "PT", "pt", "/pt/program", "pt"],
  ["nl-NL", "NL", "nl", "/nl/program", "nl"],
  ["fi-FI", "FI", "fi", "/fi/program", "fi"],
  ["nb-NO", "NO", "no", "/no/program", "no"],
] as const;

const providerEnvelope = {
  result: {
    type: "STARTING_POINT_CANDIDATE",
    startingPoint: "A difficult moment is followed by opening an app without a pause.",
    desiredChange: "Create a pause before opening it.",
    broadContext: "NOT_SPECIFIED",
    continuationCue: "Continue from the pause before opening the app.",
    chosenBoundaryAction: null,
  },
};

const validGuidance = {
  kind: "guidance",
  operation: "M2_GOAL",
  title: "One seven-day experiment",
  summary: "Keep one small direction in view and notice what changes the decision.",
  options: [{ id: "candidate_1", text: "Pause once when the chosen cue appears." }],
};

function responsesBody(output: unknown) {
  return new Response(JSON.stringify({
    status: "completed",
    output_text: JSON.stringify(output),
  }), { status: 200, headers: { "content-type": "application/json" } });
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
  entries() { return [...this.values.entries()]; }
}

test("Programme presentation exposes exactly the Founder-approved locale and route contract", () => {
  assert.deepEqual(PROGRAMME_ROUTES.map((route) => [route.locale, route.marketCode, route.routeMarket, route.path, route.transcriptionLanguage]), expectedRoutes);
  assert.deepEqual(PROGRAMME_LOCALES, expectedRoutes.map(([locale]) => locale));
  for (const [locale, , , path] of expectedRoutes) {
    assert.equal(programmePath(locale), path);
    assert.equal(programmeLocaleFromPath(path), locale);
    assert.equal(parseProgrammeRoute(path)?.route.locale, locale);
    assert.equal(parseProgrammeRoute(`${path}/unknown`)?.rendererPathname, "/program/unknown");
    assert.equal(programmeLocaleFromPath(`${path}/unknown`), null);
  }
  for (const invalid of ["fr-FR", "en-US", "no-NO", "nb-NB", "", null]) {
    assert.throws(() => parseProgrammeLocale(invalid), /Unsupported Programme locale/);
  }
  assert.equal(parseProgrammeRoute("/it/program")?.route.locale, "it-IT");
  assert.equal(parseProgrammeRoute("/it/programme"), null);
  assert.equal(parseProgrammeRoute("/de/program%2Fadmin"), null);
  for (const route of PROGRAMME_ROUTES) {
    assert.equal(programmePathForPresentationLocale(route.locale), route.path);
  }
  assert.equal(programmePathForPresentationLocale("en-CA"), "/program");
  assert.equal(programmePathForPresentationLocale("fr-CA"), "/program");
});

test("Permissions Policy grants microphone access only on the eleven canonical Programme routes", async () => {
  const configUrl = new URL("../next.config.mjs", import.meta.url).href;
  const config = (await import(configUrl)).default as {
    headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
  };
  const rules = await config.headers();
  const permissionsPolicy = (source: string) => rules
    .find((rule) => rule.source === source)
    ?.headers.find((header) => header.key === "Permissions-Policy")
    ?.value;
  const denied = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
  const programme = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";

  assert.equal(permissionsPolicy("/(.*)"), denied);
  assert.deepEqual(
    rules.filter((rule) => permissionsPolicy(rule.source) === programme).map((rule) => rule.source),
    PROGRAMME_ROUTES.map((route) => route.path),
  );
  for (const route of PROGRAMME_ROUTES) assert.equal(permissionsPolicy(route.path), programme, route.path);
  for (const ordinaryPath of ["/", "/de", "/de/learn", "/help", "/program/mission-01", "/de/program/mission-01"]) {
    assert.equal(permissionsPolicy(ordinaryPath), undefined, `${ordinaryPath} must inherit the global deny policy`);
  }
});

test("Programme access failures remain stage-specific, localized and free of server codes", () => {
  const cases = [
    ["authority", {}, "We could not verify Programme access. Check both boxes and try again."],
    ["session", { code: "PROGRAM_AI_DISABLED" }, "Mission 01 is temporarily unavailable. Your access checks were accepted. Try again later."],
    ["session", { code: "INTERNAL_ERROR" }, "Mission 01 could not be started. Try again."],
  ] as const;

  for (const locale of PROGRAMME_LOCALES) {
    for (const [stage, failure, expectedKey] of cases) {
      const key = programmeAccessFailureMessageKey(stage, failure);
      assert.equal(key, expectedKey);
      const message = programmeText(locale, key);
      assert.ok(message.length > 20, `${locale}: ${key}`);
      assert.doesNotMatch(message, /PROGRAM_AI|INTERNAL_ERROR|ACCESS_AUTHORITY|404|500/);
      if (locale !== "en-GB") assert.notEqual(message, key, `${locale}: ${key}`);
    }
  }
});

test("Programme middleware establishes a distinct request-local context for all routes and sanitises spoofed authority", async () => {
  for (const [locale, , routeMarket, path] of expectedRoutes) {
    const response = await middleware(new NextRequest(`http://127.0.0.1:4173${path}`, {
      headers: {
        [PRESENTATION_CONTEXT_HEADER]: "public-v1",
        [PRESENTATION_MARKET_HEADER]: "gb",
        [PRESENTATION_LANGUAGE_HEADER]: "en",
      },
    }));
    assert.equal(response.headers.get("Content-Language"), locale, path);
    assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_CONTEXT_HEADER}`), PROGRAMME_PRESENTATION_CONTEXT, path);
    assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_MARKET_HEADER}`), routeMarket, path);
    assert.equal(response.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), locale.split("-")[0].toLowerCase(), path);
    const rewrite = response.headers.get("x-middleware-rewrite");
    assert.equal(rewrite ? new URL(rewrite).pathname : path, "/program", path);
  }
  const login = await middleware(new NextRequest("http://127.0.0.1:4173/login?returnTo=%2Ffi%2Fprogram"));
  assert.equal(login.headers.get("Content-Language"), "fi-FI");
  assert.equal(login.headers.get(`x-middleware-request-${PRESENTATION_CONTEXT_HEADER}`), PROGRAMME_PRESENTATION_CONTEXT);
  const arbitrary = await middleware(new NextRequest("http://127.0.0.1:4173/login?returnTo=%2Ffi%2Fprogram%2Funknown"));
  assert.equal(arbitrary.headers.get(`x-middleware-request-${PRESENTATION_CONTEXT_HEADER}`), null);
});

test("Programme switching preserves only bounded callback state and keeps public publication boundaries separate", () => {
  assert.equal(safeProgrammePresentationSearch("auth=google-link-error&error=account_not_linked&returnTo=/admin&token=secret"), "?auth=google-link-error&error=account_not_linked");
  assert.equal(safeProgrammePresentationSearch("auth=google-error&error=internal-detail&narrative=private"), "?auth=google-error");
  assert.equal(safeProgrammePresentationSearch("returnTo=/de/program&narrative=private"), "");
  assert.equal(programmeLocaleHref("fi-FI", "auth=google-return&private=value"), "/fi/program?auth=google-return");

  for (const locale of ["de-DE", "es-ES", "sv-SE", "da-DK", "el-GR"] as const) {
    assert.equal(programmeHelpPath(locale), `/${PROGRAMME_ROUTES.find((route) => route.locale === locale)!.routeMarket}/help`);
    assert.equal(programmePublicHref(locale, "/casinos"), `/${PROGRAMME_ROUTES.find((route) => route.locale === locale)!.routeMarket}/casinos`);
  }
  for (const locale of ["en-GB", "it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO"] as const) {
    assert.equal(programmeHelpPath(locale), "/help");
    assert.equal(programmePublicHref(locale, "/casinos"), "/casinos");
  }
});

test("Google callbacks are the exact bounded Programme pairs for all locales", () => {
  for (const locale of PROGRAMME_LOCALES) {
    const signIn = programmeGoogleCallbacks(locale);
    const link = programmeGoogleCallbacks(locale, "link");
    assert.deepEqual(signIn, {
      callbackURL: `${programmePath(locale)}?auth=google-return`,
      errorCallbackURL: `${programmePath(locale)}?auth=google-error`,
    });
    assert.deepEqual(link, {
      callbackURL: `${programmePath(locale)}?auth=google-link-return`,
      errorCallbackURL: `${programmePath(locale)}?auth=google-link-error`,
    });
    assert.equal(isAllowedGoogleSignInRequest({ provider: "google", ...signIn, requestSignUp: true }), true, locale);
    assert.equal(isAllowedGoogleLinkRequest({ provider: "google", ...link }), true, locale);
  }
  assert.equal(isAllowedGoogleSignInRequest({ provider: "google", callbackURL: "/fi/program?auth=google-return&next=/admin", errorCallbackURL: "/fi/program?auth=google-error", requestSignUp: true }), false);
  assert.equal(isAllowedGoogleLinkRequest({ provider: "google", callbackURL: "https://attacker.example/", errorCallbackURL: "/program?auth=google-link-error" }), false);
});

test("every Programme locale is mandatory at HTTP/application boundaries and maps to a verified transcription language", async () => {
  assert.deepEqual(PROGRAMME_LOCALES.map((locale) => programmeTranscriptionLanguage(locale)), expectedRoutes.map((route) => route[4]));
  for (const locale of PROGRAMME_LOCALES) {
    assert.equal(parseProgrammeAiTurn({ locale, inputMode: "text", situation: "I open an app after a difficult working day.", clarificationAnswers: [] }).locale, locale);
    assert.equal(parseProgramAiLocalWording({ locale, localWording: "Kept in this tab" }).locale, locale);
  }
  assert.throws(() => parseProgrammeAiTurn({ locale: "fr-FR", inputMode: "text", situation: "I open an app after a difficult working day.", clarificationAnswers: [] }), /locale/i);
  assert.throws(() => parseProgramAiLocalWording({ locale: "fr-FR" }), /locale/i);
  const form = new FormData();
  form.set("audio", new File([new Uint8Array([1])], "voice", { type: "audio/webm" }));
  form.set("durationMs", "1000");
  form.set("locale", "fr-FR");
  await assert.rejects(parseProgrammeAudioUpload(form), /locale/i);
});

test("M1 and Mission guidance provider requests name the requested locale without logging private input", async () => {
  const m1Bodies: Array<Record<string, unknown>> = [];
  const m1 = new OpenAiProgrammeAiAdapter({
    provider: "openai",
    apiKey: "test-secret",
    programmeModel: PROGRAM_AI_OPENAI_MODEL,
    transcriptionModel: PROGRAM_AI_TRANSCRIPTION_MODEL,
  }, {
    fetchImpl: (async (_url, init) => {
      m1Bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return responsesBody(providerEnvelope);
    }) as typeof fetch,
    logger: () => undefined,
    timeoutSignal: () => new AbortController().signal,
  });

  const guidanceBodies: Array<Record<string, unknown>> = [];
  const guidance = new OpenAiMissionGuidanceAdapter("test-secret", PROGRAM_AI_OPENAI_MODEL, (async (_url, init) => {
    guidanceBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return responsesBody(validGuidance);
  }) as typeof fetch);

  for (const locale of PROGRAMME_LOCALES) {
    await m1.createTurn({ locale, inputMode: "text", situation: "PRIVATE-SENTINEL: I open an app after a difficult working day.", clarificationAnswers: [] });
    await guidance.generate("M2_GOAL", { locale, localWording: "PRIVATE-SENTINEL" }, locale);
  }
  for (const [index, locale] of PROGRAMME_LOCALES.entries()) {
    assert.match(String(m1Bodies[index].instructions), new RegExp(`Requested output locale: ${locale}`));
    const inputText = ((m1Bodies[index].input as Array<{ content: Array<{ text: string }> }>)[0].content[0].text);
    assert.equal((JSON.parse(inputText) as { locale: string }).locale, locale);
    assert.match(String(guidanceBodies[index].instructions), new RegExp(`Requested output locale: ${locale}`));
  }
});

test("provider failure produces same-locale deterministic output while preserving user-owned wording verbatim", async () => {
  const situation = "USER-OWNED-SENTINEL — exact wording stays unchanged.";
  for (const locale of PROGRAMME_LOCALES) {
    const m1 = await new ProgrammeAiOrchestrator(null).createTurn({ locale, inputMode: "text", situation, clarificationAnswers: [] });
    assert.equal(m1.kind, "STARTING_POINT_CANDIDATE");
    if (m1.kind !== "STARTING_POINT_CANDIDATE") continue;
    assert.equal(m1.candidate.startingPoint, situation);
    assert.equal(m1.candidate.desiredChange, programmeText(locale, "Build more control around the situation described here."));
    const mission = deterministicGuidance("M2_GOAL", undefined, locale);
    assert.equal(mission.title, programmeText(locale, "A small seven-day experiment"));
    const review = deterministicReview("REVIEW_M3", { facts: [] }, locale);
    assert.equal(review.title, programmeText(locale, "First Personal Review"));
  }
});

test("multilingual provider-output safety rejects at least one prohibited claim in every locale", () => {
  const prohibited: Readonly<Record<ProgrammeLocale, string>> = {
    "en-GB": "Your risk score is high.",
    "de-DE": "Dein Risikowert ist hoch.",
    "es-ES": "Tu puntuación de riesgo es alta.",
    "sv-SE": "Din riskpoäng är hög.",
    "da-DK": "Din risikoscore er høj.",
    "el-GR": "Η βαθμολογία κινδύνου είναι υψηλή.",
    "it-IT": "Il punteggio di rischio è alto.",
    "pt-PT": "A pontuação de risco é alta.",
    "nl-NL": "Je risicoscore is hoog.",
    "fi-FI": "Riskipisteet ovat korkeat.",
    "nb-NO": "Risikoscore er høy.",
  };
  for (const locale of PROGRAMME_LOCALES) {
    assert.throws(
      () => assertSafeProgrammeGeneratedText(prohibited[locale]),
      (error) => error instanceof ProgrammeProviderError && error.providerCode === "PROVIDER_INVALID_OUTPUT",
      locale,
    );
  }
  assert.equal(assertSafeProgrammeGeneratedText("USER-OWNED-SENTINEL"), "USER-OWNED-SENTINEL");
});

test("the Programme catalogue passes the durable 11-locale AI language gate", () => {
  const report = generateProgrammeLanguageQaReport();
  assert.equal(report.status, "AI_LANGUAGE_QA_PASSED");
  assert.deepEqual(report.supportedLocales, PROGRAMME_LOCALES);
  assert.ok(report.checkedCatalogueKeys > 500);
  assert.equal(report.locales.length, 11);
  for (const locale of report.locales) {
    assert.equal(locale.status, "PASS", `${locale.locale}: ${locale.findings.join("; ")}`);
    assert.ok(locale.checkedStrings > 500);
    assert.deepEqual(locale.findings, []);
    assert.equal(programmeCatalogueEntries(locale.locale).length, report.checkedCatalogueKeys);
  }
});

test("locale switching cannot mutate Programme subject identity or browser-local narrative", () => {
  const storage = new MemoryStorage();
  const subject = anonymousProgrammeSubject(storage);
  const content = {
    programAi: {
      phase: "intake",
      situation: "LOCAL-NARRATIVE-SENTINEL — do not translate",
      candidate: null,
      inputMode: "text",
      xpPreview: 20,
    },
  };
  saveProgrammeSubjectContent(storage, subject, content);
  const before = storage.entries();
  for (const locale of [...PROGRAMME_LOCALES, ...[...PROGRAMME_LOCALES].reverse()]) {
    assert.equal(programmeLocaleHref(locale), programmePath(locale));
    assert.deepEqual(anonymousProgrammeSubject(storage), subject);
    assert.deepEqual(loadProgrammeSubjectContent(storage, subject), content);
  }
  assert.deepEqual(storage.entries(), before);
});

test("Programme persistence keys remain locale-neutral and the feature introduces no locale migration", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /model ProgramEnrollment\s*\{[\s\S]*?@@unique\(\[userId, programId\]\)[\s\S]*?\}/);
  assert.match(schema, /model ProgrammeMissionProgress\s*\{[\s\S]*?@@unique\(\[enrollmentId, missionNumber\]\)[\s\S]*?\}/);
  for (const model of ["ProgramEnrollment", "ProgrammeMissionProgress", "ProgrammeStartingPoint", "PendingProgrammeClaim", "AnonymousProgrammeSession"]) {
    const block = schema.match(new RegExp(`model ${model}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";
    assert.ok(block, model);
    assert.doesNotMatch(block, /^\s*(?:locale|language|market)\s+/m, model);
  }
  const migrations = readdirSync("prisma/migrations");
  assert.equal(migrations.some((name) => /programme.*(?:locale|language|international)|(?:locale|language|international).*programme/i.test(name)), false);

  const forbiddenPresentationConsumers = [
    "lib/programme/infrastructure/repositories/programme-progress.repository.ts",
    "lib/programme/infrastructure/repositories/programme-reward.repository.ts",
    "lib/programme/application/programme-ai-missions.service.ts",
    "lib/programme/domain/mission-registry.ts",
    "lib/programme/domain/reward-policy.ts",
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(forbiddenPresentationConsumers, /programme\/presentation|ProgrammeLocale|locale:/);
});

test("active Programme JSX contains no uncatalogued authored system copy", () => {
  const files = [
    "app/program/layout.tsx",
    "app/program/not-found.tsx",
    "app/program/page.tsx",
    "components/auth/LoginExperience.tsx",
    ...readdirSync("components/programme")
      .filter((name) => /^ProgramAi.*\.tsx$/.test(name))
      .map((name) => `components/programme/${name}`),
  ];
  const allowed = new Set(["B4GAMBLE", "XP", "18+"]);
  const findings: string[] = [];
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node)) {
        const value = node.text.replace(/\s+/g, " ").trim();
        if (/[A-Za-z]/.test(value) && !allowed.has(value)) findings.push(`${path}: ${value}`);
      }
      if (ts.isJsxAttribute(node) && ["aria-label", "placeholder", "title", "alt"].includes(node.name.getText(file)) && node.initializer && ts.isStringLiteral(node.initializer)) {
        findings.push(`${path}: ${node.name.getText(file)}=${node.initializer.text}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  assert.deepEqual(findings, []);
  const selector = readFileSync("components/programme/ProgrammeLanguageSelector.tsx", "utf8");
  assert.match(selector, /PROGRAMME_ROUTES/);
  assert.match(selector, /programmeLocaleHref/);
  assert.doesNotMatch(selector, /api\/presentation|document\.cookie|fetch\(/);
});

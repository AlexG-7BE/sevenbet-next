import "server-only";

import sanitizeHtml from "sanitize-html";
import type { EmailTemplateKey, EmailTemplateType } from "@prisma/client";

import prisma from "@/lib/db/prisma";

const templateKeys = [
  "EMAIL_VERIFICATION", "PASSWORD_RESET", "ACCOUNT_SECURITY",
  "WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST",
] as const satisfies readonly EmailTemplateKey[];
const templateTypes = ["TRANSACTIONAL", "LIFECYCLE", "MARKETING"] as const satisfies readonly EmailTemplateType[];
const templateTypeByKey: Record<EmailTemplateKey, EmailTemplateType> = {
  EMAIL_VERIFICATION: "TRANSACTIONAL",
  PASSWORD_RESET: "TRANSACTIONAL",
  ACCOUNT_SECURITY: "TRANSACTIONAL",
  WELCOME: "LIFECYCLE",
  PROGRAMME_REMINDER: "LIFECYCLE",
  MARKETING_BROADCAST: "MARKETING",
};
const ALLOWED_VARIABLES = new Set(["name", "action_url", "programme_url", "unsubscribe_url"]);
const URL_VARIABLES = ["action_url", "programme_url", "unsubscribe_url"] as const;
const HEADER_CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;
const REQUIRED_BODY_VARIABLES: Record<EmailTemplateKey, readonly string[]> = {
  EMAIL_VERIFICATION: ["action_url"],
  PASSWORD_RESET: ["action_url"],
  ACCOUNT_SECURITY: [],
  WELCOME: ["programme_url"],
  PROGRAMME_REMINDER: ["programme_url", "unsubscribe_url"],
  MARKETING_BROADCAST: ["unsubscribe_url"],
};

function approvedStaticEmailUrl(value: string) {
  try {
    const url = new URL(value);
    let decodedPath = url.pathname;
    try {
      for (let index = 0; index < 2; index += 1) decodedPath = decodeURIComponent(decodedPath);
    } catch { return false; }
    return url.origin === "https://b4gamble.com"
      && !url.username
      && !url.password
      && !/^\/(?:r|go)(?:\/|$)/i.test(decodedPath);
  } catch {
    return false;
  }
}

function boundedText(value: unknown, maximum: number, field: string) {
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) throw new Error(`${field} is outside its allowed length`);
  return normalized;
}

function templateVariables(value: string) {
  return [...value.matchAll(/{{\s*([A-Za-z_]+)\s*}}/g)].map((match) => match[1]);
}

export function sanitizeEmailTemplate(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Template payload is required");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["key", "type", "locale", "subject", "htmlBody", "textBody"].includes(key))) {
    throw new Error("Template contains unsupported fields");
  }
  const key = String(body.key) as EmailTemplateKey;
  const type = String(body.type) as EmailTemplateType;
  if (!templateKeys.includes(key) || !templateTypes.includes(type) || templateTypeByKey[key] !== type) {
    throw new Error("Template key or type is invalid");
  }
  const locale = boundedText(body.locale, 16, "locale");
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale)) throw new Error("Template locale is invalid");
  const subject = boundedText(body.subject, 200, "subject");
  if (HEADER_CONTROL_PATTERN.test(subject)) {
    throw new Error("Template subject cannot contain line breaks or control characters");
  }
  const rawHtml = boundedText(body.htmlBody, 50_000, "htmlBody");
  const textBody = boundedText(body.textBody, 20_000, "textBody");
  for (const variable of [...templateVariables(subject), ...templateVariables(rawHtml), ...templateVariables(textBody)]) {
    if (!ALLOWED_VARIABLES.has(variable)) throw new Error(`Unsupported template variable: ${variable}`);
  }
  if (templateVariables(subject).some((variable) => variable !== "name")) {
    throw new Error("Template subject supports only the name variable");
  }
  for (const content of [subject, rawHtml, textBody]) {
    if (/{{|}}/.test(content.replace(/{{\s*[A-Za-z_]+\s*}}/g, ""))) {
      throw new Error("Template contains malformed variable syntax");
    }
  }
  for (const variable of REQUIRED_BODY_VARIABLES[key]) {
    if (!templateVariables(rawHtml).includes(variable) || !templateVariables(textBody).includes(variable)) {
      throw new Error(`${key} requires {{${variable}}} in both HTML and plain text`);
    }
  }
  for (const match of rawHtml.matchAll(/href\s*=\s*(["'])(.*?)\1/gi)) {
    const variables = templateVariables(match[2]);
    for (const variable of variables) {
      if (!URL_VARIABLES.includes(variable as typeof URL_VARIABLES[number]) || match[2].trim() !== `{{${variable}}}`) {
        throw new Error("Link variables must use one approved URL placeholder as the complete href");
      }
    }
    if (!variables.length && !approvedStaticEmailUrl(match[2].trim())) {
      throw new Error("Static email links must use the canonical B4GAMBLE HTTPS origin and cannot be outbound routes");
    }
  }
  for (const match of textBody.matchAll(/https?:\/\/[^\s<>()]+/gi)) {
    if (!approvedStaticEmailUrl(match[0])) {
      throw new Error("Plain-text links must use the canonical B4GAMBLE HTTPS origin");
    }
  }
  const protectedHtml = URL_VARIABLES.reduce(
    (content, variable) => content.replaceAll(new RegExp(`{{\\s*${variable}\\s*}}`, "g"), `https://template.invalid/__${variable}__`),
    rawHtml,
  );
  const sanitizedHtml = sanitizeHtml(protectedHtml, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h1", "h2", "h3"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
  for (const match of sanitizedHtml.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')/gi)) {
    const href = (match[1] ?? match[2] ?? "").trim();
    const placeholder = /^https:\/\/template\.invalid\/__(action_url|programme_url|unsubscribe_url)__$/.test(href);
    if (!placeholder && !approvedStaticEmailUrl(href)) {
      throw new Error("Sanitized email links must use an approved URL placeholder or the canonical B4GAMBLE HTTPS origin");
    }
  }
  const htmlBody = URL_VARIABLES.reduce(
    (content, variable) => content.replaceAll(`https://template.invalid/__${variable}__`, `{{${variable}}}`),
    sanitizedHtml,
  );
  if ([subject, htmlBody, textBody].some((content) => /{{\s*(email|user_id|password|token)\s*}}/i.test(content))) {
    throw new Error("Sensitive template variables are not allowed");
  }
  return { key, type, locale, subject, htmlBody, textBody };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function renderString(template: string, variables: Record<string, string>, html: boolean) {
  return template.replace(/{{\s*([a-z_]+)\s*}}/g, (_match, name: string) => {
    const value = variables[name] ?? "";
    return html ? escapeHtml(value) : value;
  });
}

export function renderEmailTemplate(
  template: { subject: string; htmlBody: string; textBody: string },
  variables: Record<string, string>,
) {
  const subject = renderString(template.subject, variables, false);
  if (HEADER_CONTROL_PATTERN.test(subject)) {
    throw new Error("Rendered email subject contains line breaks or control characters");
  }
  return {
    subject,
    html: renderString(template.htmlBody, variables, true),
    text: renderString(template.textBody, variables, false),
  };
}

export async function activeEmailTemplate(key: EmailTemplateKey, locale: string) {
  const requested = await prisma.emailTemplate.findFirst({
    where: { key, active: true, locale },
    orderBy: { version: "desc" },
  });
  if (requested || locale === "en") return requested;
  return prisma.emailTemplate.findFirst({
    where: { key, active: true, locale: "en" },
    orderBy: { version: "desc" },
  });
}

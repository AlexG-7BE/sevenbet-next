import { createHash } from "node:crypto";

const SUPERFLY_CAMPAIGN_DESTINATION = /^https:\/\/go\.superflypartners\.net\/c\/[a-f0-9]{8}$/i;
const HTTPS_TOKEN = /https:\/\/[^\s\"'<>]+/gi;

export function destinationSha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function assertCanonicalSuperflyCampaignDestination(value: string) {
  if (value !== value.trim()) throw new Error("Superfly campaign destination contains surrounding whitespace.");
  if (!SUPERFLY_CAMPAIGN_DESTINATION.test(value)) {
    throw new Error("Superfly campaign destination is not an exact canonical campaign URL.");
  }
  const parsed = new URL(value);
  if (parsed.protocol !== "https:"
    || parsed.hostname !== "go.superflypartners.net"
    || parsed.port
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash) {
    throw new Error("Superfly campaign destination is outside the exact governed campaign shape.");
  }
  return value;
}

export function extractHashBoundSuperflyCampaignDestination(claim: string, expectedSha256: string) {
  const tokens = [...claim.matchAll(HTTPS_TOKEN)].map((match) => match[0]);
  if (tokens.length !== 1) throw new Error("Route evidence must contain exactly one HTTPS destination token.");

  const token = tokens[0];
  const terminalSentencePeriod = token.match(/^(https:\/\/go\.superflypartners\.net\/c\/[a-f0-9]{8})\.$/i);
  const candidate = terminalSentencePeriod?.[1] ?? token;
  assertCanonicalSuperflyCampaignDestination(candidate);

  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || destinationSha256(candidate) !== expectedSha256) {
    throw new Error("Superfly campaign destination does not match its evidence-bound checksum.");
  }
  return candidate;
}

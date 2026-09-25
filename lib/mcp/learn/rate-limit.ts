import { createMcpRateLimiter, mcpRequestKey } from "@/lib/mcp/rate-limit";

const limiter = createMcpRateLimiter();

export const learnMcpRequestKey = mcpRequestKey;

export function consumeLearnMcpRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  return limiter.consume(key, limit, windowMs, now);
}

export function clearLearnMcpRateLimitsForTests() {
  limiter.clear();
}

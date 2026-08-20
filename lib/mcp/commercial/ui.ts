export function safeCommercialMcpReturnTo(value: string | undefined) {
  if (!value || value.length > 4_000) return "/admin";
  try {
    const url = new URL(value, "https://b4gamble.com");
    const allowedPath = url.pathname === "/api/mcp/oauth/authorize"
      || url.pathname === "/admin/integrations/chatgpt-work/consent";
    if (url.origin !== "https://b4gamble.com" || !allowedPath) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

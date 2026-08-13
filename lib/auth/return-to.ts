export const DEFAULT_AUTH_RETURN_TO = "/program";

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

export function safeAuthReturnTo(value: unknown) {
  if (typeof value !== "string"
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || CONTROL_CHARACTER.test(value)) {
    return DEFAULT_AUTH_RETURN_TO;
  }

  try {
    const url = new URL(value, "https://b4gamble.invalid");
    if (url.origin !== "https://b4gamble.invalid"
      || url.pathname === "/login"
      || url.pathname.startsWith("/login/")) {
      return DEFAULT_AUTH_RETURN_TO;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_RETURN_TO;
  }
}

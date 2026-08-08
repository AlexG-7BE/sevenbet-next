export function isIsoCountryCode(value: string) {
  const code = value.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || ["EU", "UN", "XA", "XB", "XK", "XX"].includes(code)) return false;
  const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
  return Boolean(name && name !== code && name !== "Unknown Region");
}

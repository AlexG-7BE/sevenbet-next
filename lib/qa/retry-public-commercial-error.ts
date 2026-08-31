const PUBLIC_COMMERCIAL_ERROR_FIXTURE = "public-commercial";

/**
 * Normal errors retry their segment in place. The deterministic local error
 * fixture must first consume its query flag or every retry would throw again.
 */
export function retryPublicCommercialError(reset: () => void) {
  const url = new URL(window.location.href);
  if (url.searchParams.get("errorFixture") === PUBLIC_COMMERCIAL_ERROR_FIXTURE) {
    url.searchParams.delete("errorFixture");
    window.location.replace(`${url.pathname}${url.search}${url.hash}`);
    return;
  }
  reset();
}

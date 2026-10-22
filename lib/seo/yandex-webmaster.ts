/**
 * Yandex Webmaster ownership check for b4gamble.com (Founder, 22 October 2026). Yandex asks
 * for a file at the site root whose name and body carry this code. The code is public by
 * design: it only proves that the host serves `/yandex_<code>.html`
 * (app/yandex_<code>.html/route.ts). Main host only, like the IndexNow key file: the file is
 * `COMMERCIAL`, so the help host answers 404 (lib/site/host-routes.ts).
 */
export const YANDEX_VERIFICATION_CODE = "2c1ce41417df0f15";
export const YANDEX_VERIFICATION_PATH = `/yandex_${YANDEX_VERIFICATION_CODE}.html`;

/** The body Yandex Webmaster prints for this code, byte for byte. */
export const YANDEX_VERIFICATION_HTML = [
  "<html>",
  "<head>",
  '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
  "</head>",
  `<body>Verification: ${YANDEX_VERIFICATION_CODE}</body>`,
  "</html>",
  "",
].join("\n");

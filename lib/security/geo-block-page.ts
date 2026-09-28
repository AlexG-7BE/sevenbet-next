// The 451 page is self-contained: inline style under the response nonce, the text wordmark
// and a data: icon. It requests nothing else, so the geo-block and the Firewall rule may
// refuse every other resource. No links, offers, forms, scripts or trackers.

// Public site palette as rendered (28 Sep 2026): near-black ground, warm white, lime accent.
const BACKGROUND = "#100F0F";
const SURFACE = "#1A1919";
const TEXT = "#FAFAF7";
const MUTED = "rgba(250,250,247,.72)";
const SUBTLE = "rgba(250,250,247,.56)";
const BORDER = "rgba(250,250,247,.14)";
const ACCENT = "#E4E24E";

export const GEO_BLOCK_MESSAGES = {
  ru: "Сайт недоступен в вашем регионе",
  en: "This website is not available in your region",
  kk: "Бұл сайт сіздің аймағыңызда қолжетімсіз",
} as const;

export function geoBlockPageHtml(nonce: string) {
  if (!/^[A-Za-z0-9-]+$/.test(nonce)) throw new Error("Invalid CSP nonce");
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="dark">
<title>451 · B4GAMBLE</title>
<link rel="icon" href="data:,">
<style nonce="${nonce}">
*{box-sizing:border-box}
html{background:${BACKGROUND};color:${TEXT};color-scheme:dark}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;font-family:Archivo,Arial,"Helvetica Neue",sans-serif}
main{width:min(100%,560px)}
.brand{margin:0 0 32px;color:#FFF;font-family:Archivo,"Arial Black",Arial,sans-serif;font-size:22px;line-height:24px;font-weight:800;letter-spacing:.02em}
.panel{padding:32px 24px;border:1px solid ${BORDER};border-top:3px solid ${ACCENT};border-radius:3px;background:${SURFACE}}
h1,.panel p{margin:0;font-size:20px;line-height:1.4;font-weight:700}
.panel p{margin-top:16px;color:${MUTED};font-weight:600}
.status{margin:24px 0 0;color:${SUBTLE};font-size:14px;line-height:20px}
</style>
</head>
<body>
<main>
<p class="brand" translate="no">B4GAMBLE</p>
<section class="panel">
<h1 lang="ru">${GEO_BLOCK_MESSAGES.ru}</h1>
<p lang="en">${GEO_BLOCK_MESSAGES.en}</p>
<p lang="kk">${GEO_BLOCK_MESSAGES.kk}</p>
</section>
<p class="status">HTTP 451</p>
</main>
</body>
</html>
`;
}

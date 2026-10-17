// The help host's answer for a route it does not serve (RFC-057 §7.1 step 3). It is
// self-contained: inline style under the response nonce, no image, script, font or link of
// any kind, so it can never carry a commercial address onto the help host (§6 rule 1).
//
// This is the dark-switch answer of phase 1. When the help shell and its own not-found page
// land, the gate rewrites to that page instead and this file goes with the same commit.

const BACKGROUND = "#100F0F";
const TEXT = "#FAFAF7";
const MUTED = "rgba(250,250,247,.72)";

export function helpHostNotFoundHtml(nonce: string) {
  if (!/^[A-Za-z0-9-]+$/.test(nonce)) throw new Error("Invalid CSP nonce");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="dark">
<title>Page not found</title>
<style nonce="${nonce}">
:root { color-scheme: dark }
html, body { margin: 0; height: 100% }
body {
  background: ${BACKGROUND};
  color: ${TEXT};
  display: grid;
  place-items: center;
  font: 400 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 24px;
  text-align: center;
}
h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px }
p { color: ${MUTED}; font-size: 16px; margin: 0 }
</style>
</head>
<body>
<main>
<h1>Page not found</h1>
<p>This page is not part of this site.</p>
</main>
</body>
</html>`;
}

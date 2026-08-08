const productionOrigin = "https://sevenbet-next.vercel.app";
const baseUrl = (process.env.PRODUCTION_SMOKE_BASE_URL ?? productionOrigin).replace(/\/$/, "");
const routes = [
  "/",
  "/responsible-gambling",
  "/privacy",
  "/terms",
  "/self-check",
  "/tools/budget-calculator",
  "/faq",
  "/casinos",
  "/bonuses",
];
const timeoutMs = 8_000;
const attempts = 3;

if (new URL(baseUrl).protocol !== "https:" && !baseUrl.startsWith("http://127.0.0.1:")) {
  throw new Error("Production smoke accepts only HTTPS or explicit 127.0.0.1 test origins");
}

async function requestRoute(route) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        headers: { "user-agent": "SevenBet-Production-Smoke/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`);

      if (route === "/") {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("text/html")) {
          throw new Error("root did not return HTML");
        }
        const body = await response.text();
        if (!/<html[\s>]/i.test(body)) throw new Error("root HTML marker missing");
      } else {
        await response.body?.cancel();
      }

      console.info(`${route} — 200`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "request failed";
  throw new Error(`${route} failed after ${attempts} attempts: ${reason}`);
}

for (const route of routes) await requestRoute(route);
console.info(`Production smoke passed for ${routes.length} read-only routes`);

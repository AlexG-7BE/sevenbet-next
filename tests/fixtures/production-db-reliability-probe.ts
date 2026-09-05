const unhandled: string[] = [];

process.on("unhandledRejection", (error) => {
  unhandled.push(error instanceof Error ? error.name : String(error));
});

async function methodProbe() {
  const commercial = await import("../../app/api/mcp/commercial/route");
  const media = await import("../../app/api/mcp/media/route");
  const handlers = [
    commercial.GET,
    commercial.DELETE,
    commercial.PATCH,
    commercial.PUT,
    commercial.OPTIONS,
    media.GET,
    media.DELETE,
    media.PATCH,
    media.PUT,
    media.OPTIONS,
  ];
  const responses = await Promise.all(handlers.map((handler) => handler()));
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    statuses: responses.map((response) => response.status),
    allow: responses.map((response) => response.headers.get("allow")),
    cacheControl: responses.map((response) => response.headers.get("cache-control")),
    unhandled,
  };
}

function request(path: "commercial" | "media") {
  const tool = path === "commercial"
    ? { name: "commercial_list_opportunities", arguments: { limit: 1, offset: 0 } }
    : { name: "media_list_recent_ingestions", arguments: { limit: 1 } };
  return new Request(`http://127.0.0.1:4173/api/mcp/${path}`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: "Bearer b4mcp_at_unreachable_fixture",
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: tool }),
  });
}

async function postProbe() {
  const commercial = await import("../../app/api/mcp/commercial/route");
  const media = await import("../../app/api/mcp/media/route");
  const started = performance.now();
  const responses = [];
  for (const [name, operation] of [
    ["commercial", () => commercial.POST(request("commercial"))],
    ["media", () => media.POST(request("media"))],
  ] as const) {
    const response = await operation();
    responses.push({
      name,
      status: response.status,
      cacheControl: response.headers.get("cache-control"),
      retryAfter: response.headers.get("retry-after"),
      body: await response.json(),
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { responses, elapsedMs: Math.round(performance.now() - started), unhandled };
}

async function main() {
  const result = process.argv[2] === "post" ? await postProbe() : await methodProbe();
  console.log(JSON.stringify(result));
}

void main();

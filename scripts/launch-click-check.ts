// Launch click check — one real click on every casino's public /r/ route from a real exit in
// each launch market (Globalping), classified against the licence register (RFC-054).
//
//   npm run launch:click-check -- [--markets GB,SE,DK,DE] [--casinos playojo,turbonino] [--site https://b4gamble.com]
//
// Read-only for B4GAMBLE's data: it writes nothing itself. Each click is recorded by /r/ as an
// OutboundClick with trafficKind BOT (the Globalping user agent), so it never counts as a visitor.
// The redirect is not followed, so the partner never receives the click. A NO_ROUTE in an open
// market is retried from fresh probes (see NO_ROUTE_ATTEMPTS).
//
// Output: a Markdown matrix on stdout and the full JSON on stderr's last line. The exit code is 1
// when any VIOLATION (a closed market reaching a partner) or UNEXPECTED response is found.
import { globalpingFetch } from "../lib/affiliate-health/globalping-fetch";
import {
  LAUNCH_MARKETS,
  clickVerdict,
  launchCasinos,
  publicRouteSlug,
  type ClickVerdict,
} from "../lib/market-access/launch-click-check";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

const list = (value: string | undefined) => value?.split(",").map((item) => item.trim()).filter(Boolean);

type Row = { market: string; casino: string; route: string; verdict: ClickVerdict; statusCode: number | null; destination: string | null; probe: string | null; error?: string };

// Vercel geolocates some probes' addresses to another country than Globalping does (London OVH
// probes are seen as FR), and such a click is refused as if it came from there. A partner redirect
// from any real probe proves the route, so a refusal in an open market is retried from fresh probes.
const NO_ROUTE_ATTEMPTS = 3;

async function click(site: string, market: string, casino: string): Promise<Row> {
  let row = await clickOnce(site, market, casino);
  for (let attempt = 1; attempt < NO_ROUTE_ATTEMPTS && row.verdict === "NO_ROUTE"; attempt += 1) {
    row = await clickOnce(site, market, casino);
  }
  return row;
}

async function clickOnce(site: string, market: string, casino: string): Promise<Row> {
  const route = publicRouteSlug(casino);
  let probe: string | null = null;
  const fetcher = globalpingFetch(market, { onProbe: (value) => { probe = `${value.city ?? "?"} (${value.network ?? "?"})`; } });
  const at = new Date();
  try {
    const response = await fetcher(new URL(`/r/${route}`, site), { method: "GET" });
    const location = response.headers.get("location");
    const destination = location ? new URL(location, site) : null;
    return {
      market, casino, route, probe,
      verdict: clickVerdict(casino, market, at, { statusCode: response.status, location }),
      statusCode: response.status,
      // Host and path only: a partner URL's query carries our affiliate identifiers.
      destination: destination ? `${destination.hostname}${destination.pathname}` : null,
    };
  } catch (error) {
    return { market, casino, route, probe, verdict: "UNEXPECTED", statusCode: null, destination: null, error: error instanceof Error ? error.message : "UNKNOWN" };
  }
}

async function main() {
  const site = option("--site") ?? "https://b4gamble.com";
  const markets = list(option("--markets")) ?? [...LAUNCH_MARKETS];
  const casinos = list(option("--casinos")) ?? launchCasinos();
  const rows: Row[] = [];
  for (const market of markets) {
    // Globalping's anonymous budget is shared; a few clicks at a time is plenty.
    for (let index = 0; index < casinos.length; index += 4) {
      rows.push(...await Promise.all(casinos.slice(index, index + 4).map((casino) => click(site, market, casino))));
    }
    console.error(`[${new Date().toISOString().slice(11, 19)}] ${market}: ${rows.filter((row) => row.market === market).length} clicks`);
  }

  const lines = ["| Market | Casino | Verdict | HTTP | Lands on | Probe |", "| --- | --- | --- | --- | --- | --- |"];
  for (const row of rows) {
    lines.push(`| ${row.market} | ${row.casino} | ${row.verdict} | ${row.statusCode ?? "—"} | ${row.destination ?? row.error ?? "—"} | ${row.probe ?? "—"} |`);
  }
  const totals = Object.fromEntries(markets.map((market) => {
    const inMarket = rows.filter((row) => row.market === market);
    const count = (verdict: ClickVerdict) => inMarket.filter((row) => row.verdict === verdict).length;
    return [market, { partnerClicks: count("PASS"), closedRefused: count("PASS_CLOSED"), noRoute: count("NO_ROUTE"), violations: count("VIOLATION"), unexpected: count("UNEXPECTED") }];
  }));
  console.info(lines.join("\n"));
  console.info(`\n${JSON.stringify(totals)}`);
  console.error(JSON.stringify({ checkedAt: new Date().toISOString(), site, totals, rows }));
  if (rows.some((row) => row.verdict === "VIOLATION" || row.verdict === "UNEXPECTED")) process.exitCode = 1;
}

void main();

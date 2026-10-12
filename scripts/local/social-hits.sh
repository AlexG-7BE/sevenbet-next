#!/usr/bin/env bash
# Counts clicks on the short social links (/ig, /fb, /x, /threads, /lana, /x/<code>, /t/<code>,
# /fb/<code>, /ig/<code>) from the Production function log: every hit writes one line
# `social_hit src=<network> campaign=<bio|post|story|text> content=<code> country=<CC> bot=<0|1>`
# (lib/social/short-links.ts). Read-only; needs the Vercel CLI logged in to the project.
#
#   bash scripts/local/social-hits.sh                 # last 24 h, people only
#   bash scripts/local/social-hits.sh 2026-10-03      # since a date (UTC) or ISO time, or 7d / 12h
#   bash scripts/local/social-hits.sh 7d --bots       # also count link-preview crawlers
#   bash scripts/local/social-hits.sh 24h --csv       # CSV rows for analytics history
#
# Runtime logs are kept about 30 days on this project, so keep the daily CSV for longer history.
set -euo pipefail
cd "$(dirname "$0")/../.."

SINCE="${1:-24h}"
shift || true
UNTIL="now"
MODE="table"
BOTS=0
while [ $# -gt 0 ]; do
  case "$1" in
    --until) UNTIL="$2"; shift 2;;
    --csv) MODE="csv"; shift;;
    --bots) BOTS=1; shift;;
    *) echo "Unknown option: $1" >&2; exit 2;;
  esac
done

SINCE="$SINCE" UNTIL="$UNTIL" MODE="$MODE" BOTS="$BOTS" python3 - <<'PY'
import collections, concurrent.futures, datetime as dt, json, os, re, subprocess, sys, time

# `vercel logs` (CLI 55) answers with at most 50 rows per call whatever `-n` asks for, so a window
# that comes back with 50 or more rows is treated as cut off and read again in two halves.
REQUEST = 1000
PAGE_CAP = 50
FIRST_WINDOW = dt.timedelta(hours=6)
SMALLEST_WINDOW = dt.timedelta(minutes=2)
CALL_TIMEOUT = 90
ATTEMPTS = 4
WORKERS = 4
LINE = re.compile(r"social_hit src=(\S+) campaign=(\S+) content=(\S+) country=(\S+)(?: bot=([01]))?")
now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)

def parse_time(value):
    match = re.fullmatch(r"(\d+)([mhd])", value)
    if match:
        unit = {"m": "minutes", "h": "hours", "d": "days"}[match.group(2)]
        return now - dt.timedelta(**{unit: int(match.group(1))})
    if value == "now":
        return now
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc)

def iso(moment):
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")

def call(since, until):
    """One `vercel logs` call with a timeout; a hung or failed call is retried."""
    command = ["vercel", "logs", "--environment", "production", "--no-branch", "--json",
               "--query", "social_hit", "--since", iso(since), "--until", iso(until), "-n", str(REQUEST)]
    project = os.environ.get("VERCEL_PROJECT")
    if project:
        command += ["--project", project]
    problem = ""
    for attempt in range(ATTEMPTS):
        if attempt:
            time.sleep(2 * attempt)
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=CALL_TIMEOUT)
        except subprocess.TimeoutExpired:
            problem = f"no answer in {CALL_TIMEOUT} s"
            continue
        if result.returncode == 0:
            return [json.loads(line) for line in result.stdout.splitlines() if line.startswith("{")]
        problem = result.stderr.strip()[-400:]
    raise RuntimeError(f"vercel logs failed for {iso(since)}..{iso(until)}: {problem}")

def fetch(since, until):
    """Reads one window; halves it while it comes back full."""
    entries = call(since, until)
    if len(entries) < min(REQUEST, PAGE_CAP):
        return entries
    if until - since > SMALLEST_WINDOW:
        middle = since + dt.timedelta(seconds=int((until - since).total_seconds()) // 2)
        return fetch(since, middle) + fetch(middle, until)
    print(f"warning: {len(entries)}+ hits in {iso(since)}..{iso(until)}; counts are a floor", file=sys.stderr)
    return entries

def fetch_all(since, until):
    windows, start = [], since
    while start < until:
        windows.append((start, min(start + FIRST_WINDOW, until)))
        start += FIRST_WINDOW
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        try:
            return [entry for batch in pool.map(lambda window: fetch(*window), windows) for entry in batch]
        except RuntimeError as error:
            pool.shutdown(cancel_futures=True)
            sys.exit(str(error))

since, until = parse_time(os.environ["SINCE"]), parse_time(os.environ["UNTIL"])
seen, hits, bots = set(), collections.Counter(), 0
for entry in fetch_all(since, until):
    match = LINE.search(entry.get("message") or "")
    # Neighbouring windows share their boundary second, so the same entry can arrive twice.
    key = entry.get("id") or (entry.get("timestamp"), entry.get("message"))
    if not match or key in seen:
        continue
    seen.add(key)
    source, campaign, content, country, bot = match.groups()
    if bot == "1":
        bots += 1
        if os.environ["BOTS"] != "1":
            continue
    hits[(source, campaign, content, country, bot or "0")] += 1

if os.environ["MODE"] == "csv":
    print("since,until,network,campaign,content,country,bot,hits")
    for (source, campaign, content, country, bot), count in sorted(hits.items()):
        print(f"{iso(since)},{iso(until)},{source},{campaign},{content},{country},{bot},{count}")
    sys.exit(0)

who = "people and crawlers" if os.environ["BOTS"] == "1" else f"people only; {bots} crawler hits left out"
print(f"social_hit {iso(since)} → {iso(until)} ({who})")
if not hits:
    print("no hits")
    sys.exit(0)
rows = collections.Counter()
for (source, campaign, content, country, bot), count in hits.items():
    rows[(source, f"{campaign}:{content}", country)] += count
print(f"{'network':<10} {'campaign:content':<28} {'country':<7} {'hits':>5}")
for (source, link, country), count in sorted(rows.items(), key=lambda item: (item[0][0], -item[1], item[0][1], item[0][2])):
    print(f"{source:<10} {link:<28} {country:<7} {count:>5}")
by_network = collections.Counter()
for (source, *_), count in rows.items():
    by_network[source] += count
print("total: " + ", ".join(f"{source} {count}" for source, count in by_network.most_common()) + f" = {sum(by_network.values())}")
PY

import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PublicErrorBrowserHarness() {
  const enabled =
    process.env.LAUNCH_POLISH_ERROR_HARNESS === "true" &&
    process.env.PLAYWRIGHT_BASE_URL === "http://127.0.0.1:4173" &&
    process.env.VERCEL_ENV !== "production";

  if (!enabled) notFound();
  throw new Error("LAUNCH_POLISH_BROWSER_HARNESS");
}

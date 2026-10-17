import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import { connection } from "next/server";
import { SiteMotionController } from "@/components/motion/SiteMotionController";
import { ProgrammeDocumentBoundary } from "@/components/programme/ProgrammeDocumentBoundary";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { googleTagBootstrap } from "@/lib/analytics/google-analytics";
import { googleAnalyticsMeasurementId } from "@/lib/analytics/google-analytics.server";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";
import { CSP_NONCE_REQUEST_HEADER } from "@/lib/security/content-security-policy";
import { siteUrl } from "@/lib/site";
import { HELP_SHARE_IMAGE_PATH, helpShellCopy } from "@/lib/site/help-copy";
import { HELP_CANONICAL_ORIGIN, HELP_SITE_NAME } from "@/lib/site/host-gate";
import { resolveServerSite } from "@/lib/site/server-site";
import "./design-system.css";
import "./globals.css";

export const dynamic = "force-dynamic";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-seven-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  variable: "--font-seven-serif",
  display: "swap",
});

/**
 * RFC-057 §8. One module constant cannot give two sites their own canonical URLs, so the root
 * metadata is resolved per request. On the main host every field below is byte-for-byte what
 * the static object held before; on the help host `metadataBase` is the help origin, the title
 * and description are the help site's own (no "casino comparison", no B4GAMBLE), `siteName` is
 * "Pause Plan" (Founder, Q2) and the default social image is the help share image, because
 * `/opengraph-image` is COMMERCIAL and answers 404 there.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveServerSite();
  if (site === "help") {
    const presentation = await resolveServerPresentationContext();
    const help = helpShellCopy(presentation.locale);
    return {
      metadataBase: new URL(HELP_CANONICAL_ORIGIN),
      title: { default: help.metadataTitle, template: "%s" },
      description: help.metadataDescription,
      openGraph: {
        type: "website",
        siteName: HELP_SITE_NAME,
        images: [{ url: HELP_SHARE_IMAGE_PATH, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: [HELP_SHARE_IMAGE_PATH] },
    };
  }
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "B4GAMBLE (Before Gamble) | Know your limits before you play",
      template: "%s",
    },
    description: "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.",
    openGraph: {
      type: "website",
      siteName: "B4GAMBLE",
    },
    // app/opengraph-image.tsx supplies the default image to every page without its own.
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Child route params are not exposed to the root layout, so middleware supplies
  // a validated request-local presentation context for the server-rendered lang.
  const presentation = await resolveServerPresentationContext();
  // Q3 is answered G3 (RFC-057 §10): the help host carries no Google tag, no first-party
  // analytics and therefore no cookie banner — the one notice fewer the consent-once rule
  // asks for. b4gamble.com keeps its 4 October 2026 decision exactly as it is.
  const site = await resolveServerSite();
  const analyticsEnabled = site !== "help" && isProductAnalyticsEnabled();
  // Google Analytics: Production only, never on staff-marked devices.
  const requestHeaders = await headers();
  const googleAnalyticsId = analyticsEnabled ? googleAnalyticsMeasurementId(requestHeaders) : null;
  const nonce = requestHeaders.get(CSP_NONCE_REQUEST_HEADER) || undefined;
  return (
    <html lang={presentation.locale}>
      {googleAnalyticsId ? (
        <head>
          {/* Google tag (gtag.js), RFC-046 §16. */}
          <script async nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: googleTagBootstrap(googleAnalyticsId) }} />
        </head>
      ) : null}
      <body className={`${archivo.variable} ${instrumentSerif.variable}`}>
        <JsonLd data={organizationSchema(site)} />
        <JsonLd data={websiteSchema(site)} />
        {children}
        {analyticsEnabled ? <AnalyticsPageView /> : null}
        {analyticsEnabled ? <AnalyticsConsentBanner locale={presentation.locale} /> : null}
        <ProgrammeDocumentBoundary />
        <SiteMotionController />
      </body>
    </html>
  );
}

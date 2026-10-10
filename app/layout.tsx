import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import { connection } from "next/server";
import { SiteMotionController } from "@/components/motion/SiteMotionController";
import { ProgrammeDocumentPolicyBoundary } from "@/components/programme/ProgrammeDocumentPolicyBoundary";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  GOOGLE_TAG_MANAGER_NOSCRIPT_URL,
  GOOGLE_TAG_MANAGER_SNIPPET,
  googleTagBootstrap,
} from "@/lib/analytics/google-analytics";
import { googleAnalyticsMeasurementId } from "@/lib/analytics/google-analytics.server";
import { isProductAnalyticsEnabled } from "@/lib/analytics/product-analytics";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";
import { CSP_NONCE_REQUEST_HEADER } from "@/lib/security/content-security-policy";
import { siteUrl } from "@/lib/site";
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

export const metadata: Metadata = {
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Child route params are not exposed to the root layout, so middleware supplies
  // a validated request-local presentation context for the server-rendered lang.
  const presentation = await resolveServerPresentationContext();
  const analyticsEnabled = isProductAnalyticsEnabled();
  // Google Tag Manager and Google Analytics: Production only, never on staff-marked devices.
  const requestHeaders = await headers();
  const googleAnalyticsId = analyticsEnabled ? googleAnalyticsMeasurementId(requestHeaders) : null;
  const nonce = requestHeaders.get(CSP_NONCE_REQUEST_HEADER) || undefined;
  return (
    <html lang={presentation.locale}>
      {googleAnalyticsId ? (
        <head>
          {/* Google Tag Manager */}
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: GOOGLE_TAG_MANAGER_SNIPPET }} />
          {/* Google tag (gtag.js), RFC-046 §16. */}
          <script async nonce={nonce} src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: googleTagBootstrap(googleAnalyticsId) }} />
        </head>
      ) : null}
      <body className={`${archivo.variable} ${instrumentSerif.variable}`}>
        {googleAnalyticsId ? (
          // Google Tag Manager (noscript)
          <noscript>
            <iframe src={GOOGLE_TAG_MANAGER_NOSCRIPT_URL} title="Google Tag Manager" height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
          </noscript>
        ) : null}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {children}
        {analyticsEnabled ? <AnalyticsPageView /> : null}
        {analyticsEnabled ? <AnalyticsConsentBanner locale={presentation.locale} /> : null}
        <ProgrammeDocumentPolicyBoundary />
        <SiteMotionController />
      </body>
    </html>
  );
}

import Link from "next/link";

import type { FirstWaveMarketEvidenceProfile } from "@/lib/market/first-wave-evidence";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import styles from "./ProtectedHelp.module.css";

const localizedShellCopy = {
  "de-DE": { skip: "Zum Hauptinhalt", badge: "Geschützte Hilfe", help: "Hilfe", back: "Zur Website", exit: "Zurück", privacy: "Datenschutz", terms: "Bedingungen", about: "Über uns" },
  "es-ES": { skip: "Saltar al contenido principal", badge: "Ayuda protegida", help: "Ayuda", back: "Volver al sitio", exit: "Salir", privacy: "Privacidad", terms: "Términos", about: "Quiénes somos" },
  "es-PE": { skip: "Saltar al contenido principal", badge: "Ayuda protegida", help: "Ayuda", back: "Volver al sitio", exit: "Salir", privacy: "Privacidad", terms: "Términos", about: "Quiénes somos" },
  "sv-SE": { skip: "Gå till huvudinnehållet", badge: "Skyddad hjälp", help: "Hjälp", back: "Till webbplatsen", exit: "Lämna", privacy: "Integritet", terms: "Villkor", about: "Om oss" },
  "da-DK": { skip: "Gå til hovedindhold", badge: "Beskyttet hjælp", help: "Hjælp", back: "Tilbage til siden", exit: "Forlad", privacy: "Privatliv", terms: "Vilkår", about: "Om os" },
  "el-GR": { skip: "Μετάβαση στο κύριο περιεχόμενο", badge: "Προστατευμένη βοήθεια", help: "Βοήθεια", back: "Επιστροφή στον ιστότοπο", exit: "Έξοδος", privacy: "Απόρρητο", terms: "Όροι", about: "Σχετικά" },
} as const;

export function protectedHelpShellCopy(profile?: FirstWaveMarketEvidenceProfile | null) {
  return profile ? localizedShellCopy[profile.locale] : null;
}

export function ProtectedHelpHeader({ presentation, profile }: { presentation?: PresentationResolution; profile?: FirstWaveMarketEvidenceProfile | null }) {
  const copy = protectedHelpShellCopy(profile);
  const helpHref = presentation && profile ? productHref(presentation, "/help") : "/help";
  const homeHref = presentation && profile ? productHref(presentation, "/") : "/";
  return (
    <div className={styles.headerWrap}>
      <header className={styles.header} data-protected-help="header">
        <div className={styles.identity}>
          <Link className={styles.brand} href={helpHref} aria-label={`B4GAMBLE ${copy?.help ?? "Help"}`} translate="no">
            B4GAMBLE
          </Link>
          <span className={styles.protectedBadge}>{copy?.badge ?? "Protected Help"}</span>
        </div>
        <nav className={styles.helpNavigation} aria-label={copy?.badge ?? "Protected Help navigation"}>
          <Link className={styles.desktopHelpLink} href={helpHref} aria-current="page">
            {copy?.help ?? "Help home"}
          </Link>
          {!profile ? <Link className={styles.desktopHelpLink} href="/program">My Programme</Link> : null}
          <Link className={styles.exitLink} href={homeHref}>
            <span className={styles.desktopExit}>{copy?.back ?? "Back to site"}</span>
            <span className={styles.mobileExit}>{copy?.exit ?? "Exit"}</span>
          </Link>
        </nav>
      </header>
    </div>
  );
}

export function ProtectedHelpFooter({ presentation, profile }: { presentation?: PresentationResolution; profile?: FirstWaveMarketEvidenceProfile | null }) {
  const copy = protectedHelpShellCopy(profile);
  const helpHref = presentation && profile ? productHref(presentation, "/help") : "/help";
  const aboutHref = presentation && profile ? productHref(presentation, "/about") : "/about";
  return (
    <div className={styles.footerWrap}>
      <footer className={styles.footer} data-protected-help="footer">
        <div className={styles.footerBoundary}>
          <p className={styles.footerEyebrow}>{profile?.copy.eyebrow ?? <>Control &amp; support</>}</p>
          <p className={styles.footerTitle}>{profile?.copy.helpTitle ?? "Help stays non-commercial."}</p>
          <p className={styles.footerCopy}>
            {profile?.copy.disclaimer ?? "B4GAMBLE provides information, not emergency or clinical care. External support opens on another site and should be checked for your location."}
          </p>
          <p className={styles.footerCopy}>{profile?.copy.nonCommercial ?? "Your activity here is never used for offers, rankings or ads."}</p>
        </div>
        <div className={styles.footerUtility}>
          <p className={styles.separationBadge}>{profile?.copy.eyebrow ?? "No casino · No bonus · No affiliate"}</p>
          <nav className={styles.footerLinks} aria-label={copy?.badge ?? "Protected Help footer"}>
            <Link href={helpHref}>{copy?.help ?? "Help home"}</Link>
            <Link href="/privacy">{copy?.privacy ?? "Privacy"}</Link>
            <Link href="/terms">{copy?.terms ?? "Terms"}</Link>
            <Link href={aboutHref}>{copy?.about ?? "About"}</Link>
          </nav>
          <p className={styles.copyright}>© 2026 B4GAMBLE</p>
        </div>
      </footer>
    </div>
  );
}

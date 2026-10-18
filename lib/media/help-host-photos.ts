import heroPlanJpg from "@/public/home/hero-plan.jpg";
import heroPlan320Avif from "@/public/home/responsive/hero-plan-320.avif";
import heroPlan640Avif from "@/public/home/responsive/hero-plan-640.avif";
import heroPlan1280Avif from "@/public/home/responsive/hero-plan-1280.avif";
import heroPlan1920Avif from "@/public/home/responsive/hero-plan-1920.avif";
import heroPlan320Webp from "@/public/home/responsive/hero-plan-320.webp";
import heroPlan640Webp from "@/public/home/responsive/hero-plan-640.webp";
import heroPlan1280Webp from "@/public/home/responsive/hero-plan-1280.webp";
import heroPlan1920Webp from "@/public/home/responsive/hero-plan-1920.webp";
import heroConfidenceJpg from "@/public/home/hero-confidence.jpg";
import heroConfidence320Avif from "@/public/home/responsive/hero-confidence-320.avif";
import heroConfidence640Avif from "@/public/home/responsive/hero-confidence-640.avif";
import heroConfidence1280Avif from "@/public/home/responsive/hero-confidence-1280.avif";
import heroConfidence1920Avif from "@/public/home/responsive/hero-confidence-1920.avif";
import heroConfidence320Webp from "@/public/home/responsive/hero-confidence-320.webp";
import heroConfidence640Webp from "@/public/home/responsive/hero-confidence-640.webp";
import heroConfidence1280Webp from "@/public/home/responsive/hero-confidence-1280.webp";
import heroConfidence1920Webp from "@/public/home/responsive/hero-confidence-1920.webp";
import heroCreatorJpg from "@/public/home/hero-creator.jpg";
import heroCreator320Avif from "@/public/home/responsive/hero-creator-320.avif";
import heroCreator640Avif from "@/public/home/responsive/hero-creator-640.avif";
import heroCreator1280Avif from "@/public/home/responsive/hero-creator-1280.avif";
import heroCreator1920Avif from "@/public/home/responsive/hero-creator-1920.avif";
import heroCreator320Webp from "@/public/home/responsive/hero-creator-320.webp";
import heroCreator640Webp from "@/public/home/responsive/hero-creator-640.webp";
import heroCreator1280Webp from "@/public/home/responsive/hero-creator-1280.webp";
import heroCreator1920Webp from "@/public/home/responsive/hero-creator-1920.webp";
import heroOutcomeJpg from "@/public/home/hero-outcome.jpg";
import heroOutcome320Avif from "@/public/home/responsive/hero-outcome-320.avif";
import heroOutcome640Avif from "@/public/home/responsive/hero-outcome-640.avif";
import heroOutcome1280Avif from "@/public/home/responsive/hero-outcome-1280.avif";
import heroOutcome1920Avif from "@/public/home/responsive/hero-outcome-1920.avif";
import heroOutcome320Webp from "@/public/home/responsive/hero-outcome-320.webp";
import heroOutcome640Webp from "@/public/home/responsive/hero-outcome-640.webp";
import heroOutcome1280Webp from "@/public/home/responsive/hero-outcome-1280.webp";
import heroOutcome1920Webp from "@/public/home/responsive/hero-outcome-1920.webp";

import chapterApplyJpg from "@/public/home/chapter-apply.jpg";
import chapterApply320Avif from "@/public/home/responsive/chapter-apply-320.avif";
import chapterApply640Avif from "@/public/home/responsive/chapter-apply-640.avif";
import chapterApply1280Avif from "@/public/home/responsive/chapter-apply-1280.avif";
import chapterApply1920Avif from "@/public/home/responsive/chapter-apply-1920.avif";
import chapterApply320Webp from "@/public/home/responsive/chapter-apply-320.webp";
import chapterApply640Webp from "@/public/home/responsive/chapter-apply-640.webp";
import chapterApply1280Webp from "@/public/home/responsive/chapter-apply-1280.webp";
import chapterApply1920Webp from "@/public/home/responsive/chapter-apply-1920.webp";

/**
 * The two photographs a help page shows, imported so that the bundler serves them from
 * `/_next/static/media/` with a content hash (RFC-057 §4.2; Founder, 17 October 2026:
 * «перенеси картинки»).
 *
 * **Why they could not stay in `public/home/`.** The phase-2 Vercel Firewall rule denies every
 * raster image and font on the help host except under `/_next/static/`, because the middleware
 * matcher never sees those paths and the help gate therefore cannot answer 404 for them
 * (`lib/security/help-host-firewall-rule.ts`). `public/home` is `COMMERCIAL` in the route
 * manifest, and §4.2 assumed the folder is never requested on the help host. Measured on the
 * phase-1 screens, it is: `/10-steps` and `/start` open on `hero-plan` and the guides hub opens
 * on `chapter-apply` — nine files each, a `.jpg` fallback and four widths in `avif` and `webp`.
 * A hashed copy under `/_next/static/` is served on both hosts through the one exception the
 * rule already makes, so the help site keeps its photographs and the rule stays a default deny.
 *
 * **Only the help host reads this.** The main host keeps `/home/...` exactly as it is: those
 * URLs are what its pages, its tests and its CDN cache hold today, and phase 1 leaves the main
 * site byte-identical. The module is loaded with a dynamic `import()` behind `site === "help"`,
 * which also keeps it out of the module graph of the Node tests that import the pages and the
 * handoff transforms — `node --test` cannot load a `.jpg`.
 *
 * The originals stay in `public/home/`: the home page, which the Founder's rule keeps
 * untouched, still serves them from there.
 */
export type HelpHostPhoto = Readonly<{
  /** The `<img src>` fallback: the original JPEG, hashed. */
  fallbackSrc: string;
  /** `srcset` for `<source type="image/avif">`, the four widths of `public/home/responsive`. */
  avifSrcSet: string;
  /** `srcset` for `<source type="image/webp">`. */
  webpSrcSet: string;
}>;

export type HelpHostPhotoName =
  | "chapter-apply.jpg"
  | "hero-confidence.jpg"
  | "hero-creator.jpg"
  | "hero-outcome.jpg"
  | "hero-plan.jpg";

const PHOTOS: Readonly<Record<HelpHostPhotoName, HelpHostPhoto>> = {
  "hero-plan.jpg": {
    fallbackSrc: heroPlanJpg.src,
    avifSrcSet: [`${heroPlan320Avif.src} 320w`, `${heroPlan640Avif.src} 640w`, `${heroPlan1280Avif.src} 1280w`, `${heroPlan1920Avif.src} 1920w`].join(", "),
    webpSrcSet: [`${heroPlan320Webp.src} 320w`, `${heroPlan640Webp.src} 640w`, `${heroPlan1280Webp.src} 1280w`, `${heroPlan1920Webp.src} 1920w`].join(", "),
  },
  "hero-confidence.jpg": {
    fallbackSrc: heroConfidenceJpg.src,
    avifSrcSet: [`${heroConfidence320Avif.src} 320w`, `${heroConfidence640Avif.src} 640w`, `${heroConfidence1280Avif.src} 1280w`, `${heroConfidence1920Avif.src} 1920w`].join(", "),
    webpSrcSet: [`${heroConfidence320Webp.src} 320w`, `${heroConfidence640Webp.src} 640w`, `${heroConfidence1280Webp.src} 1280w`, `${heroConfidence1920Webp.src} 1920w`].join(", "),
  },
  "hero-creator.jpg": {
    fallbackSrc: heroCreatorJpg.src,
    avifSrcSet: [`${heroCreator320Avif.src} 320w`, `${heroCreator640Avif.src} 640w`, `${heroCreator1280Avif.src} 1280w`, `${heroCreator1920Avif.src} 1920w`].join(", "),
    webpSrcSet: [`${heroCreator320Webp.src} 320w`, `${heroCreator640Webp.src} 640w`, `${heroCreator1280Webp.src} 1280w`, `${heroCreator1920Webp.src} 1920w`].join(", "),
  },
  "hero-outcome.jpg": {
    fallbackSrc: heroOutcomeJpg.src,
    avifSrcSet: [`${heroOutcome320Avif.src} 320w`, `${heroOutcome640Avif.src} 640w`, `${heroOutcome1280Avif.src} 1280w`, `${heroOutcome1920Avif.src} 1920w`].join(", "),
    webpSrcSet: [`${heroOutcome320Webp.src} 320w`, `${heroOutcome640Webp.src} 640w`, `${heroOutcome1280Webp.src} 1280w`, `${heroOutcome1920Webp.src} 1920w`].join(", "),
  },
  "chapter-apply.jpg": {
    fallbackSrc: chapterApplyJpg.src,
    avifSrcSet: [`${chapterApply320Avif.src} 320w`, `${chapterApply640Avif.src} 640w`, `${chapterApply1280Avif.src} 1280w`, `${chapterApply1920Avif.src} 1920w`].join(", "),
    webpSrcSet: [`${chapterApply320Webp.src} 320w`, `${chapterApply640Webp.src} 640w`, `${chapterApply1280Webp.src} 1280w`, `${chapterApply1920Webp.src} 1920w`].join(", "),
  },
};

/** The hashed set for one photograph. */
export function helpHostPhoto(name: HelpHostPhotoName): HelpHostPhoto {
  return PHOTOS[name];
}

/** Every hashed URL this module serves, for the guard that walks what a help page requests. */
export function helpHostPhotoUrls(): readonly string[] {
  return Object.values(PHOTOS).flatMap((photo) => [
    photo.fallbackSrc,
    ...photo.avifSrcSet.split(", ").map((candidate) => candidate.split(" ")[0]),
    ...photo.webpSrcSet.split(", ").map((candidate) => candidate.split(" ")[0]),
  ]);
}

const RESPONSIVE_WIDTHS = [320, 640, 1280, 1920] as const;

/**
 * Every `/home/…` path the captured home page asks for, mapped to the hashed build file that
 * serves the same picture (Founder, 18 October 2026: the help site gets the designed home).
 *
 * The capture writes the five photographs as `/home/<name>.jpg` plus four widths in `avif`
 * and `webp` under `/home/responsive/`, and `public/home` is `COMMERCIAL` in the route
 * manifest and denied outright by the phase-2 Firewall rule. Rewriting the whole set at once
 * is what lets the help host serve the design unchanged: the markup, the `sizes` and the
 * widths are the main site's, only the addresses move under `/_next/static/`.
 */
export function helpHostHomePhotoRewrites(): ReadonlyMap<string, string> {
  const rewrites = new Map<string, string>();
  for (const [name, photo] of Object.entries(PHOTOS) as [HelpHostPhotoName, HelpHostPhoto][]) {
    const stem = name.replace(/\.jpg$/, "");
    rewrites.set(`/home/${name}`, photo.fallbackSrc);
    for (const [format, srcSet] of [["avif", photo.avifSrcSet], ["webp", photo.webpSrcSet]] as const) {
      const candidates = srcSet.split(", ").map((candidate) => candidate.split(" ")[0]);
      RESPONSIVE_WIDTHS.forEach((width, index) => {
        rewrites.set(`/home/responsive/${stem}-${width}.${format}`, candidates[index]);
      });
    }
  }
  return rewrites;
}

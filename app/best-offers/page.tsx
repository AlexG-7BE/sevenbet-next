import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Best Offers | SevenBet",
  description: "A UK-ready preview of SevenBet's forthcoming transparent offer comparison experience.",
  alternates: { canonical: absoluteUrl("/best-offers") },
};

export default function BestOffersPage() {
  return (
    <main className="offerPreviewPage">
      <section className="offerPreviewHero">
        <div className="tenStepsWrap">
          <p className="tenStepsKicker">UK MARKET PREVIEW · 18+</p>
          <h1>Best offers, explained before they are activated.</h1>
          <p>
            This is the future SevenBet comparison layer. Live UK offers and referral actions will appear only after a partner, market and disclosure review is complete.
          </p>
          <div className="tenStepsActions">
            <Link className="tenStepsPrimary" href="/10-steps">Start with 10 Steps</Link>
            <Link className="tenStepsSecondary" href="/casinos">Browse casino reviews</Link>
          </div>
        </div>
      </section>
      <section className="offerPreviewBody">
        <div className="tenStepsWrap offerPreviewGrid">
          {[
            ["Market eligible", "Only offers approved for the visitor's market can appear."],
            ["Terms visible", "Wagering, expiry and material restrictions come before any action."],
            ["Referral disclosed", "Commercial relationships are labelled before a referral is activated."],
          ].map(([title, text], index) => (
            <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>
          ))}
        </div>
      </section>
    </main>
  );
}

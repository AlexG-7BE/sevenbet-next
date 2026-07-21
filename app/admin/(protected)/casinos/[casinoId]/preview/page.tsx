import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Card, Container } from "@/components/ui";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";
import { mediaService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Draft Casino Preview | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoPreviewPage({ params }: { params: Promise<{ casinoId: string }> }) {
  const { casinoId } = await params;
  const [{ casino, validation }, mediaResult] = await Promise.all([
    loadCasinoBuilderData(casinoId),
    mediaService.list({ casinoId, includeArchived: false, take: 200 }),
  ]);
  const blockers = validation.issues.filter((issue) => issue.severity === "error");
  const activeBonuses = casino.casinoBonuses.filter((bonus) => bonus.offerStatus === "ACTIVE");
  const media = mediaResult.records;
  const logo = media.find((asset) => asset.type === "LOGO" && asset.featured) || media.find((asset) => asset.type === "LOGO");
  const hero = media.find((asset) => asset.type === "HERO" && asset.featured) || media.find((asset) => asset.type === "HERO");
  const socialImage = media.find((asset) => asset.type === "SOCIAL_IMAGE" && asset.featured);
  const gallery = media.filter((asset) => asset.type === "GALLERY" || asset.type === "SCREENSHOT");
  const bonusCreative = (bonusId: string) => media.find((asset) => asset.type === "BONUS_CREATIVE" && asset.casinoBonusId === bonusId && asset.featured);

  return (
    <div className="adminPreview casinoDraftPreview">
      <div className="adminPreviewBar">
        <div>
          <strong>Authenticated draft preview · v{casino.draftVersion}</strong>
          <Badge tone={casino.status === "PUBLISHED" ? "green" : "warning"}>{casino.status}</Badge>
        </div>
        <Link className="button ghost" href={`/admin/casinos/${casinoId}/builder`}>Back to builder</Link>
      </div>
      <Container>
        <header className="casinoPreviewHero">
          <div>
            {logo && <img className="casinoPreviewLogo" alt={logo.altText} height={logo.height || 90} src={logo.publicUrl} width={logo.width || 220} />}
            <p className="eyebrow">Editorial casino preview</p>
            <h1>{casino.title}</h1>
            <p className="lead">{casino.summary || "No editorial summary has been added yet."}</p>
            <div className="badgeCluster">
              <Badge>{casino.domain}</Badge>
              <Badge>{casino.operator || "Operator not recorded"}</Badge>
              <Badge tone={validation.valid ? "green" : "warning"}>{validation.valid ? "Publication checks passed" : `${blockers.length} blockers`}</Badge>
            </div>
          </div>
          <Card>
            <span className="muted">Editor score</span>
            <strong className="casinoPreviewScore">{casino.editorScore?.toFixed(1) ?? "--"}</strong>
            <span className="muted">out of 10</span>
          </Card>
        </header>

        {hero && <figure className="casinoPreviewMediaHero"><img alt={hero.altText} height={hero.height || 520} src={hero.publicUrl} width={hero.width || 1200} />{hero.caption && <figcaption>{hero.caption}</figcaption>}</figure>}

        {gallery.length > 0 && <section className="casinoPreviewMedia" aria-labelledby="draft-media-title"><div><p className="eyebrow">Managed assets</p><h2 id="draft-media-title">Gallery and screenshots</h2></div><div className="casinoPreviewMediaGrid">{gallery.map((asset) => <figure key={asset.id}><img alt={asset.altText} height={asset.height || 400} loading="lazy" src={asset.publicUrl} width={asset.width || 640} />{asset.caption && <figcaption>{asset.caption}</figcaption>}</figure>)}</div></section>}

        <section className="casinoPreviewBonuses" aria-labelledby="draft-bonuses-title">
          <div>
            <p className="eyebrow">Active draft offers</p>
            <h2 id="draft-bonuses-title">Bonus preview</h2>
          </div>
          {!activeBonuses.length && <Card><p className="muted">No active bonus offers are configured.</p></Card>}
          <div className="casinoPreviewGrid">
            {activeBonuses.map((bonus) => (
              <Card key={bonus.id}>
                {bonusCreative(bonus.id) && <img className="casinoPreviewBonusMedia" alt={bonusCreative(bonus.id)!.altText} height={bonusCreative(bonus.id)!.height || 360} loading="lazy" src={bonusCreative(bonus.id)!.publicUrl} width={bonusCreative(bonus.id)!.width || 640} />}
                <div className="badgeCluster">
                  <Badge>{bonus.type.replaceAll("_", " ")}</Badge>
                  {bonus.featured && <Badge tone="warning">Featured</Badge>}
                  {bonus.exclusive && <Badge tone="green">Exclusive</Badge>}
                </div>
                <h3>{bonus.title}</h3>
                <p className="muted">
                  {[
                    bonus.percentage ? `${bonus.percentage}%` : null,
                    bonus.amount ? `${bonus.currency || ""} ${bonus.amount}`.trim() : null,
                    bonus.maximumBonus ? `up to ${bonus.currency || ""} ${bonus.maximumBonus}`.trim() : null,
                    bonus.freeSpins ? `${bonus.freeSpins} free spins` : null,
                  ].filter(Boolean).join(" + ") || "Offer amount not recorded"}
                </p>
                <div className="builderMetrics">
                  <span>Wagering <strong>{bonus.wageringMultiplier ? `${bonus.wageringMultiplier}x` : "--"}</strong></span>
                  <span>Minimum deposit <strong>{bonus.minimumDeposit ? `${bonus.currency || ""} ${bonus.minimumDeposit}` : "--"}</strong></span>
                  <span>Promo code <strong>{bonus.promoCode || "Not required"}</strong></span>
                  <span>GEO <strong>{bonus.geoMode === "GLOBAL" ? "Global" : bonus.geoMode === "ALLOW" ? bonus.allowedCountries.join(", ") : `Except ${bonus.blockedCountries.join(", ")}`}</strong></span>
                  <span>Expiry <strong>{bonus.evergreen ? "Evergreen" : bonus.expiresAt ? new Date(bonus.expiresAt).toLocaleDateString("en-US") : "Not set"}</strong></span>
                </div>
                <p>{bonus.shortTerms || "No short terms recorded."}</p>
                {bonus.importantConditions.length > 0 && <p className="muted">{bonus.importantConditions.join(" · ")}</p>}
              </Card>
            ))}
          </div>
        </section>

        <div className="casinoPreviewGrid">
          <Card><h2>Overview</h2><p className="muted">{casino.description || "No review description has been added."}</p></Card>
          <Card><h2>Licensing</h2><p className="muted">{casino.licenses.length ? casino.licenses.filter((item) => !item.archived).map((item) => `${item.authority}: ${item.status}${item.verified ? " · verified" : ""}`).join(" · ") : "No structured licenses recorded."}</p></Card>
          <Card><h2>Countries</h2><p className="muted">{casino.countries.length ? casino.countries.filter((item) => !item.archived).map((item) => `${item.countryCode}: ${item.availability.replaceAll("_", " ")}`).join(" · ") : "No country availability records."}</p></Card>
          <Card><h2>Payments</h2><p className="muted">{casino.paymentMethods.length ? casino.paymentMethods.filter((item) => !item.archived).map((item) => `${item.name} (${item.type.replaceAll("_", " ")})`).join(", ") : "No payment methods recorded."}</p></Card>
          <Card><h2>Game providers</h2><p className="muted">{casino.gameProviders.length ? casino.gameProviders.filter((item) => !item.archived).map((item) => `${item.name}${item.gameCount === null ? "" : ` · ${item.gameCount} games`}`).join(", ") : "No game providers recorded."}</p></Card>
          <Card><h2>Game categories</h2><p className="muted">{casino.gameCategories.length ? casino.gameCategories.filter((item) => !item.archived).map((item) => item.name).join(", ") : "No game categories recorded."}</p></Card>
          <Card><h2>Responsible gambling</h2><p className="muted">{casino.responsibleGamblingTools.length ? casino.responsibleGamblingTools.join(", ") : "No responsible gambling tools recorded."}</p></Card>
          <Card><h2>Score breakdown</h2><p className="muted">Trust {casino.generalMetadata.trustScore ?? "--"} · UX {casino.generalMetadata.userExperienceScore ?? "--"} · Payments {casino.generalMetadata.paymentsScore ?? "--"} · Games {casino.generalMetadata.gamesScore ?? "--"} · Support {casino.generalMetadata.supportScore ?? "--"}</p></Card>
          <Card><h2>SEO preview</h2>{socialImage && <img className="casinoPreviewSocialMedia" alt={socialImage.altText} height={socialImage.height || 360} loading="lazy" src={socialImage.publicUrl} width={socialImage.width || 640} />}<p><strong>{casino.seo?.title || casino.title}</strong></p><p className="muted">{casino.seo?.description || casino.summary || "No SEO description."}</p><p className="muted">{casino.seo?.canonicalUrl || casino.websiteUrl || casino.domain} · {casino.seo?.robots || "index,follow"}</p></Card>
        </div>
      </Container>
    </div>
  );
}

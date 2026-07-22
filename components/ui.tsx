import Link from "next/link";
import type { ReactNode } from "react";
import type { Casino } from "@/lib/data";
import { formatMoney } from "@/lib/data";

type LinkTarget = {
  href: string;
  external?: boolean;
};

type ButtonProps = LinkTarget & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  rel?: string;
  ariaLabel?: string;
};

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

export function Section({
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section ${className}`}>
      <Container>
        {(eyebrow || title || intro) && <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />}
        {children}
      </Container>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`sectionHead ${align === "center" ? "center" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {intro && <p className="lead">{intro}</p>}
    </div>
  );
}

export function Button({ children, href, external, variant = "secondary", className = "", rel, ariaLabel }: ButtonProps) {
  const buttonClass = `button ${variant === "primary" ? "gold" : ""} ${variant === "ghost" ? "ghost" : ""} ${className}`;

  if (external) {
    return (
      <a className={buttonClass} href={href} target="_blank" rel={rel ?? "nofollow sponsored noopener"} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link className={buttonClass} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "warning";
}) {
  return <article className={`card ${tone !== "default" ? `card-${tone}` : ""} ${className}`}>{children}</article>;
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "dark" | "warning";
  className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function RiskBadge({ level = "low" }: { level?: "low" | "medium" | "high" }) {
  const label = level === "high" ? "High risk" : level === "medium" ? "Terms check" : "Low terms risk";
  return <Badge tone={level === "low" ? "green" : "warning"}>{label}</Badge>;
}

export function VerificationBadge({
  verified,
  label,
}: {
  verified?: boolean;
  label?: string;
}) {
  return <Badge tone={verified ? "green" : "warning"}>{label ?? (verified ? "Verified casino" : "Needs review")}</Badge>;
}

export function OfferCard({ casino, rank }: { casino: Casino; rank?: number }) {
  const riskLevel = casino.wagering > 45 || casino.reviewNeeded ? "medium" : "low";
  const ratingPercent = Math.max(0, Math.min(100, casino.rating * 10));

  return (
    <Card className={`offerCard ${rank === 1 ? "featuredOffer" : ""}`}>
      <div className="cardTopline">
        <div className="casinoIdentity">
          <div className="casinoLogo" aria-hidden="true">
            {casino.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="cardRank">{rank ? `#${rank}` : casino.rating.toFixed(1)}</span>
            {rank === 1 && <Badge tone="warning">Editor&apos;s choice</Badge>}
          </div>
        </div>
        <div className="badgeCluster">
          <VerificationBadge verified={casino.isVerified} />
          <RiskBadge level={riskLevel} />
        </div>
      </div>
      <div>
        <h3>{casino.name}</h3>
        <p className="muted">{casino.bonusHeadline}</p>
      </div>
      <div className="ratingBlock">
        <div>
          <strong>{casino.rating}/10</strong>
          <span>SevenBet rating</span>
        </div>
        <div className="ratingBar" aria-hidden="true">
          <span style={{ width: `${ratingPercent}%` }} />
        </div>
      </div>
      <div className="chips">
        <Badge>{casino.license}</Badge>
        <Badge tone="green">x{casino.wagering}</Badge>
        <Badge>Min {formatMoney(casino.minDeposit)}</Badge>
        {casino.payoutHours <= 24 && <Badge tone="green">Fast payout</Badge>}
        {casino.wagering <= 30 && <Badge tone="warning">Low wagering</Badge>}
      </div>
      <div className="metricGrid">
        <div>
          <span>Payout speed</span>
          <strong>{casino.payoutHours}h</strong>
        </div>
        <div>
          <span>Min deposit</span>
          <strong>{formatMoney(casino.minDeposit)}</strong>
        </div>
        <div>
          <span>Wagering</span>
          <strong>x{casino.wagering}</strong>
        </div>
        <div>
          <span>Offer type</span>
          <strong>{casino.category}</strong>
        </div>
      </div>
      <div className="cardActions">
        {casino.affiliateUrl ? <Button href={casino.affiliateUrl} external rel="nofollow sponsored noopener" variant="primary">View offer</Button> : <span aria-disabled="true" className="button disabled">Offer unavailable</span>}
        <Button href={`/casino/${casino.slug}`} variant="ghost">
          Read review
        </Button>
      </div>
    </Card>
  );
}

export function CasinoCard({ casino }: { casino: Casino }) {
  const riskLevel = casino.wagering > 45 || casino.reviewNeeded ? "medium" : "low";
  const ratingPercent = Math.max(0, Math.min(100, casino.rating * 10));

  return (
    <Card className="casinoCard">
      <div className="casinoLogo" aria-hidden="true">
        {casino.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="casinoCardBody">
        <div className="cardTopline">
          <div className="badgeCluster">
            <VerificationBadge verified={casino.isVerified} />
            <RiskBadge level={riskLevel} />
          </div>
          {casino.crypto && <Badge>Crypto</Badge>}
        </div>
        <h3>{casino.name}</h3>
        <p className="muted">{casino.tagline}</p>
        <div className="ratingBar" aria-label={`SevenBet rating ${casino.rating} out of 10`}>
          <span style={{ width: `${ratingPercent}%` }} />
        </div>
        <div className="chips">
          <Badge tone="dark">{casino.rating}/10</Badge>
          <Badge>{casino.category}</Badge>
          <Badge>{casino.license}</Badge>
          <Badge tone="green">x{casino.wagering}</Badge>
          {casino.payoutHours <= 24 && <Badge tone="green">Fast payout</Badge>}
        </div>
      </div>
      <div className="casinoCardOffer">
        <span>Offer terms</span>
        <strong>{casino.bonusHeadline}</strong>
        <small>Min deposit {formatMoney(casino.minDeposit)} · payout ~{casino.payoutHours}h</small>
      </div>
      <Button href={`/casino/${casino.slug}`}>Read review</Button>
    </Card>
  );
}

export function CTA({
  eyebrow,
  title,
  intro,
  primary,
  secondary,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  primary: LinkTarget & { label: string };
  secondary?: LinkTarget & { label: string };
}) {
  return (
    <Card className="ctaBlock" tone="soft">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {intro && <p className="muted">{intro}</p>}
      </div>
      <div className="heroActions">
        <Button href={primary.href} external={primary.external} variant="primary">
          {primary.label}
        </Button>
        {secondary && (
          <Button href={secondary.href} external={secondary.external} variant="ghost">
            {secondary.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function FAQ({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="faqGrid">
      {items.map(([question, answer]) => (
        <Card className="faqItem" key={question}>
          <h3>{question}</h3>
          <p className="muted">{answer}</p>
        </Card>
      ))}
    </div>
  );
}

export function AffiliateDisclosure() {
  return (
    <Card className="disclosureBlock" tone="soft">
      <VerificationBadge verified label="Affiliate disclosure" />
      <p>
        SevenBet may earn commission from sponsored links. 18+ only. We keep license, wagering, deposit and responsible
        gambling signals visible before any casino transition.
      </p>
    </Card>
  );
}

export function MethodologyBlock() {
  const items = [
    ["License first", "Operator and license status carry more weight than headline bonus value."],
    ["Terms visible", "Wagering, minimum deposit, payout speed and risk notes are shown before the click."],
    ["Rating discipline", "Cards highlight rating, payout speed, wagering and verification context together."],
    ["Commercial clarity", "Sponsored links are disclosed and do not remove risk labels."],
  ];

  return (
    <div className="methodGrid">
      {items.map(([title, text]) => (
        <Card className="methodCard" key={title}>
          <h3>{title}</h3>
          <p className="muted">{text}</p>
        </Card>
      ))}
    </div>
  );
}

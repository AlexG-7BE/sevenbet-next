"use client";

import Link from "next/link";
import React, { useId, useRef, type ReactNode } from "react";

import type { CasinoProfileAction } from "@/lib/casino-profile/presentation";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { OutboundIntentContext } from "@/lib/analytics/product-analytics-client";

type OutboundContext = OutboundIntentContext;

export function GovernedCommercialAction({
  action,
  ariaLabel,
  children,
  className,
  context,
  messages,
  offerMediaVariant,
}: {
  action: CasinoProfileAction;
  ariaLabel?: string;
  children: ReactNode;
  className: string;
  context: OutboundContext;
  messages?: ProductPageMessages["outbound"];
  offerMediaVariant?: "featured" | "secondary" | "bonus" | "casino-offer";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const slug = action.href.match(/^\/r\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1] ?? null;
  const confirmationHref = slug ? `/outbound/${slug}` : "/outbound/unavailable";

  function openConfirmation(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const dialog = dialogRef.current;
    if (!dialog?.showModal) return;
    event.preventDefault();
    productAnalyticsClient.outboundIntent("confirmation_opened", context);
    dialog.showModal();
    requestAnimationFrame(() => stayRef.current?.focus());
  }

  return (
    <>
      <a
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={className}
        data-commercial-action-placement={context.placement}
        data-commercial-action-source={context.source}
        data-commercial-media-variant={offerMediaVariant}
        href={confirmationHref}
        onClick={openConfirmation}
      >
        {children}
      </a>
      <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className="commercialOutboundDialog" ref={dialogRef}>
        <div className="commercialOutboundSheet">
          <p className="commercialOutboundLabel">{messages?.label ?? "02 / Outbound confirmation"}</p>
          <h2 id={titleId}>{messages?.title ?? "You are leaving B4GAMBLE."}</h2>
          <p id={descriptionId}>{messages?.description ?? "You are about to visit a third-party gambling operator. B4GAMBLE may earn commission if you complete a qualifying action. This does not change Editor Score or natural editorial ranking."}</p>
          <div className="commercialOutboundContract">
            <span>{messages?.contractLabel ?? "Handoff contract"}</span>
            <strong>{messages?.contractCopy ?? "No raw destination URL · no browser-supplied authority."}</strong>
            <small>{messages?.riskCopy ?? "18+ · Eligibility and operator terms apply · Gambling involves financial risk"}</small>
          </div>
          <a className="commercialOutboundPrimary" href={action.href} onClick={() => { productAnalyticsClient.outboundIntent("continued", context); dialogRef.current?.close(); }} rel="nofollow sponsored noopener" target="_blank">{messages?.continueAction ?? "Continue to eligible partner →"}</a>
          <button className="commercialOutboundSecondary" onClick={() => dialogRef.current?.close()} ref={stayRef} type="button">{messages?.cancelAction ?? "Cancel and stay on B4GAMBLE"}</button>
          <Link className="commercialOutboundHelp" href="/affiliate-disclosure">{messages?.disclosureAction ?? "Review affiliate disclosure"}</Link>
        </div>
      </dialog>
    </>
  );
}

export function CasinoOutboundAction({
  action,
  className = "",
  context = { source: "CTA", placement: "UNSPECIFIED" },
  messages,
}: {
  action: CasinoProfileAction;
  className?: string;
  context?: OutboundContext;
  messages?: ProductPageMessages["outbound"];
}) {
  return <GovernedCommercialAction
    action={action}
    className={`commercialOutboundPrimary ${className}`.trim()}
    context={context}
    messages={messages}
  >
    <span>{action.label}<span aria-hidden="true">→</span></span>
    <small className="commercialOutboundDisclosure">{messages?.affiliateNote ?? "Affiliate link · We may earn commission."}</small>
  </GovernedCommercialAction>;
}

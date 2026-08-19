"use client";

import Link from "next/link";
import React, { useId, useRef } from "react";

import type { CasinoProfileAction } from "@/lib/casino-profile/presentation";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";

export function CasinoOutboundAction({ action, className = "" }: { action: CasinoProfileAction; className?: string }) {
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
    productAnalyticsClient.outboundIntent("confirmation_opened");
    dialog.showModal();
    requestAnimationFrame(() => stayRef.current?.focus());
  }

  return (
    <>
      <a aria-haspopup="dialog" className={`commercialOutboundPrimary ${className}`.trim()} href={confirmationHref} onClick={openConfirmation}>
        <span>{action.label}<span aria-hidden="true">→</span></span>
        <small className="commercialOutboundDisclosure">Affiliate link · We may earn commission.</small>
      </a>
      <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className="commercialOutboundDialog" ref={dialogRef}>
        <div className="commercialOutboundSheet">
          <p className="commercialOutboundLabel">02 / Outbound confirmation</p>
          <h2 id={titleId}>You are leaving B4GAMBLE.</h2>
          <p id={descriptionId}>You are about to visit a third-party gambling operator. B4GAMBLE may earn commission if you complete a qualifying action. This does not change Editor Score or natural editorial ranking.</p>
          <div className="commercialOutboundContract">
            <span>Handoff contract</span>
            <strong>No raw destination URL · no browser-supplied authority.</strong>
            <small>18+ · Eligibility and operator terms apply · Gambling involves financial risk</small>
          </div>
          <a className="commercialOutboundPrimary" href={action.href} onClick={() => { productAnalyticsClient.outboundIntent("continued"); dialogRef.current?.close(); }} rel="nofollow sponsored noopener" target="_blank">Continue to eligible partner <span aria-hidden="true">→</span></a>
          <button className="commercialOutboundSecondary" onClick={() => dialogRef.current?.close()} ref={stayRef} type="button">Cancel and stay on B4GAMBLE</button>
          <Link className="commercialOutboundHelp" href="/affiliate-disclosure">Review affiliate disclosure</Link>
        </div>
      </dialog>
    </>
  );
}

"use client";

import Link from "next/link";
import { useId, useRef } from "react";

import type { CasinoProfileAction } from "@/lib/casino-profile/presentation";

import styles from "./CasinoProfile.module.css";

export function CasinoOutboundAction({ action, className = "" }: { action: CasinoProfileAction; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openConfirmation(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const dialog = dialogRef.current;
    if (!dialog?.showModal) return;
    event.preventDefault();
    dialog.showModal();
    requestAnimationFrame(() => stayRef.current?.focus());
  }

  return (
    <>
      <a className={`${styles.primaryAction} ${className}`.trim()} href={action.href} onClick={openConfirmation}>
        {action.label}<span aria-hidden="true">→</span>
      </a>
      <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className={styles.outboundDialog} ref={dialogRef}>
        <div className={styles.outboundSheet}>
          <p className={styles.tealLabel}>GOVERNED VISIT · AFFILIATE DISCLOSURE</p>
          <h2 id={titleId}>Review the handoff.</h2>
          <p id={descriptionId}>The internal route checks current eligibility again. If it permits an external transition, SevenBet may receive compensation. The editorial score and visible limitations do not change.</p>
          <div className={styles.destination}>
            <span>DESTINATION CONTEXT</span>
            <strong>{action.label.replace(/^Visit\s+/, "")}</strong>
            <small>No raw destination URL is exposed · 18+ · Terms apply</small>
          </div>
          <a className={styles.primaryAction} href={action.href}>Continue to governed route <span aria-hidden="true">→</span></a>
          <button className={styles.secondaryAction} onClick={() => dialogRef.current?.close()} ref={stayRef} type="button">Stay on review</button>
          <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
        </div>
      </dialog>
    </>
  );
}

"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useRef, useState } from "react";

import styles from "./CasinoProfile.module.css";

export function CasinoOutboundAction({ href, casinoName, compact = false }: { href: string; casinoName: string; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function showConfirmation(event: MouseEvent<HTMLAnchorElement>) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    event.preventDefault();
    dialog.showModal();
    setOpen(true);
    requestAnimationFrame(() => stayRef.current?.focus());
  }

  function closeConfirmation() {
    dialogRef.current?.close();
  }

  return (
    <>
      <a
        className={compact ? styles.compactAction : styles.primaryAction}
        href={href}
        onClick={showConfirmation}
        ref={triggerRef}
        rel="nofollow sponsored noopener"
      >
        Visit {casinoName} <span aria-hidden="true">→</span>
      </a>
      <dialog
        aria-labelledby="casino-outbound-title"
        className={styles.outboundDialog}
        onCancel={(event) => { event.preventDefault(); closeConfirmation(); }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        ref={dialogRef}
      >
        <div className={styles.outboundContent} data-state={open ? "open" : "closed"}>
          <p className={styles.outboundEyebrow}>External visit · Affiliate disclosure</p>
          <h2 id="casino-outbound-title">You’re leaving SevenBet.</h2>
          <p>You’re about to use SevenBet’s internal eligible route to visit {casinoName}. The external destination is not displayed here.</p>
          <div className={styles.outboundFact}><strong>{casinoName}</strong><span>External operator website · 18+ · Terms apply</span></div>
          <a className={styles.primaryAction} href={href} rel="nofollow sponsored noopener">Continue to {casinoName} <span aria-hidden="true">→</span></a>
          <button className={styles.ghostAction} onClick={closeConfirmation} ref={stayRef} type="button">Stay on review</button>
          <Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import styles from "./CasinoDiscovery.module.css";

export function MobileCasinoFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    setOpen(true);
    requestAnimationFrame(() => dialog.querySelector<HTMLElement>("input, select, button")?.focus());
  }

  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return (
    <div className={styles.mobileFilterRoot}>
      <button aria-controls="casino-filter-dialog" aria-expanded={open} className={styles.mobileFilterTrigger} onClick={show} ref={triggerRef} type="button">
        <span>Filters{activeCount ? ` (${activeCount})` : ""}</span><span aria-hidden="true">Refine results ↗</span>
      </button>
      <dialog
        aria-labelledby="casino-filter-title"
        className={styles.filterDialog}
        id="casino-filter-dialog"
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        ref={dialogRef}
      >
        <div className={styles.dialogHeader}>
          <div><span>Directory controls</span><h2 id="casino-filter-title">Filter casinos</h2></div>
          <button aria-label="Close filters" className={styles.dialogClose} onClick={close} type="button">×</button>
        </div>
        {children}
      </dialog>
    </div>
  );
}

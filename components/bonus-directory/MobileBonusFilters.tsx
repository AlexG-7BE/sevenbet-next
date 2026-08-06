"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import styles from "@/components/bonus-directory/BonusDirectory.module.css";

export function MobileBonusFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function close() { dialogRef.current?.close(); }

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  return <div className={styles.mobileFilterRoot}>
    <button aria-controls="bonus-filter-dialog" aria-expanded={open} className={styles.mobileFilterTrigger} onClick={show} ref={triggerRef} type="button"><span>Filters{activeCount ? ` (${activeCount})` : ""}</span><span>Refine Results ↗</span></button>
    <dialog aria-labelledby="bonus-filter-title" className={styles.filterDialog} id="bonus-filter-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); triggerRef.current?.focus(); }} ref={dialogRef}>
      <div className={styles.dialogHeader}><div><span>Directory controls</span><h2 id="bonus-filter-title">Filter Bonuses</h2></div><button aria-label="Close filters" autoFocus onClick={close} type="button">×</button></div>
      {children}
    </dialog>
  </div>;
}

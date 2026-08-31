"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import styles from "./MobileDirectoryFilters.module.css";

type MobileDirectoryFiltersProps = {
  activeCount: number;
  children: ReactNode;
  dialogId: string;
  title: string;
  labels?: { filters: string; refine: string; directoryControls: string; closeFilters: string };
};

export function MobileDirectoryFilters({ activeCount, children, dialogId, title, labels }: MobileDirectoryFiltersProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    setOpen(true);
    requestAnimationFrame(() => dialog.querySelector<HTMLElement>("select, input:not([type='hidden']), button, a")?.focus());
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

  const headingId = `${dialogId}-title`;

  return (
    <div className={styles.root}>
      <button
        aria-controls={dialogId}
        aria-expanded={open}
        className={styles.trigger}
        onClick={show}
        ref={triggerRef}
        type="button"
      >
        <span>{labels?.filters ?? "Filters"}{activeCount ? ` (${activeCount})` : ""}</span>
        <span aria-hidden="true">{labels?.refine ?? "Refine results"} ↗</span>
      </button>
      <dialog
        aria-labelledby={headingId}
        className={styles.drawer}
        id={dialogId}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <div><span>{labels?.directoryControls ?? "Directory controls"}</span><h2 id={headingId}>{title}</h2></div>
          <button aria-label={labels?.closeFilters ?? "Close filters"} className={styles.close} onClick={close} type="button">×</button>
        </div>
        <div className={styles.body}>{children}</div>
      </dialog>
    </div>
  );
}

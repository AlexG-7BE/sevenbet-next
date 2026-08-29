"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import styles from "./DirectoryFilterSurface.module.css";

type DirectoryFilterSurfaceProps = {
  activeCount: number;
  dialogId: string;
  title: string;
  primary: ReactNode;
  secondary: ReactNode;
  summary: ReactNode;
  note: ReactNode;
  labels?: { allFilters: string; directoryControls: string; closeFilters: string };
};

export function DirectoryFilterSurface({
  activeCount,
  dialogId,
  title,
  primary,
  secondary,
  summary,
  note,
  labels,
}: DirectoryFilterSurfaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    setOpen(true);
    requestAnimationFrame(() => dialog.querySelector<HTMLElement>("select, input, button, a")?.focus());
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
    <section aria-label={`${title} controls`} className={styles.surface}>
      <div className={styles.primary}>{primary}</div>
      <button
        aria-controls={dialogId}
        aria-expanded={open}
        className={styles.allFiltersButton}
        onClick={show}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className={styles.slidersIcon}><i /><i /><i /></span>
        <span>{labels?.allFilters ?? "All filters"}</span>
        {activeCount ? <b>{activeCount}</b> : null}
      </button>
      <div className={styles.meta}>
        <strong>{summary}</strong>
        <span>{note}</span>
      </div>
      <dialog
        aria-labelledby={headingId}
        className={styles.drawer}
        id={dialogId}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        ref={dialogRef}
      >
        <div className={styles.drawerHeader}>
          <div><span>{labels?.directoryControls ?? "Directory controls"}</span><h2 id={headingId}>{title}</h2></div>
          <button aria-label={labels?.closeFilters ?? "Close all filters"} className={styles.drawerClose} onClick={close} type="button">×</button>
        </div>
        <div className={styles.drawerBody}>{secondary}</div>
      </dialog>
    </section>
  );
}

import Link from "next/link";

import styles from "./DirectoryPagination.module.css";

type DirectoryPaginationProps = {
  ariaLabel: string;
  currentPage: number;
  nextHref: string | null;
  pageCount: number;
  previousHref: string | null;
  labels?: { previous: string; next: string; pageOf: string };
};

export function DirectoryPagination({ ariaLabel, currentPage, nextHref, pageCount, previousHref, labels }: DirectoryPaginationProps) {
  if (pageCount <= 1) return null;

  return <nav aria-label={ariaLabel} className={styles.pagination} data-current-page={currentPage} data-directory-pagination data-page-count={pageCount}>
    {previousHref
      ? <Link className={styles.control} href={previousHref}>{labels?.previous ?? "Previous"}</Link>
      : <span aria-disabled="true" className={styles.control}>{labels?.previous ?? "Previous"}</span>}
    <b className={styles.label}>{(labels?.pageOf ?? "Page {page} of {pages}").replace("{page}", String(currentPage)).replace("{pages}", String(pageCount))}</b>
    {nextHref
      ? <Link className={styles.control} href={nextHref}>{labels?.next ?? "Next"}</Link>
      : <span aria-disabled="true" className={styles.control}>{labels?.next ?? "Next"}</span>}
  </nav>;
}

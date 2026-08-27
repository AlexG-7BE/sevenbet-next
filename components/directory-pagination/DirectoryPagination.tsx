import Link from "next/link";

import styles from "./DirectoryPagination.module.css";

type DirectoryPaginationProps = {
  ariaLabel: string;
  currentPage: number;
  nextHref: string | null;
  pageCount: number;
  previousHref: string | null;
};

export function DirectoryPagination({ ariaLabel, currentPage, nextHref, pageCount, previousHref }: DirectoryPaginationProps) {
  if (pageCount <= 1) return null;

  return <nav aria-label={ariaLabel} className={styles.pagination} data-directory-pagination>
    {previousHref
      ? <Link className={styles.control} href={previousHref}>Previous</Link>
      : <span aria-disabled="true" className={styles.control}>Previous</span>}
    <b className={styles.label}>Page {currentPage} of {pageCount}</b>
    {nextHref
      ? <Link className={styles.control} href={nextHref}>Next</Link>
      : <span aria-disabled="true" className={styles.control}>Next</span>}
  </nav>;
}

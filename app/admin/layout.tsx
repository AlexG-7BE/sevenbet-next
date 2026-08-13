import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skipLink" href="#admin-main-content">Skip to admin content</a>
      <div id="admin-main-content" tabIndex={-1}>{children}</div>
    </>
  );
}

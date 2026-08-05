import type { ReactNode } from "react";

export default function ProtectedHelpLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skipLink" href="#main-content">Skip to main content</a>
      <main id="main-content">{children}</main>
    </>
  );
}

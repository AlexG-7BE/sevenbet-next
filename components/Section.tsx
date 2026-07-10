import type { ReactNode } from "react";

export function Section({
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section ${className}`}>
      <div className="container">
        {(eyebrow || title || intro) && (
          <div className="sectionHead">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
            {intro && <p className="lead">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

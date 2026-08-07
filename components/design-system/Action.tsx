import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

import styles from "./Action.module.css";

export type ActionStyle = "primary" | "ghost-night" | "ghost-paper";
export type ActionSize = "medium" | "large";

const styleClasses: Record<ActionStyle, string> = {
  primary: styles.primary,
  "ghost-night": styles.ghostNight,
  "ghost-paper": styles.ghostPaper,
};

function actionClassName({
  className = "",
  size,
  variant,
}: {
  className?: string;
  size: ActionSize;
  variant: ActionStyle;
}) {
  return `${styles.action} ${styles[size]} ${styleClasses[variant]} ${className}`.trim();
}

export function ActionLink({
  children,
  className,
  href,
  onClick,
  size = "medium",
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  size?: ActionSize;
  variant?: ActionStyle;
}) {
  return (
    <Link className={actionClassName({ className, size, variant })} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}

export function ActionButton({
  children,
  className,
  size = "medium",
  variant = "primary",
  type = "button",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: ActionSize;
  variant?: ActionStyle;
}) {
  return (
    <button
      {...buttonProps}
      className={actionClassName({ className, size, variant })}
      type={type}
    >
      {children}
    </button>
  );
}

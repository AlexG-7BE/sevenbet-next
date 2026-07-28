import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gambling Budget Calculator | SevenBet",
  description: "An educational budgeting worksheet to set a spending limit and session cap before gambling.",
  alternates: { canonical: absoluteUrl("/tools/budget-calculator") },
};

export default function BudgetCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

import { CommercialHandoffUnavailable } from "@/components/commercial-handoff/CommercialHandoffPage";

export const metadata: Metadata = {
  title: "Destination Unavailable | SevenBet",
  description: "SevenBet could not confirm an eligible managed outbound destination. No redirect or substitute offer was provided.",
  robots: { index: false, follow: false },
};

export default function CommercialHandoffUnavailablePage() {
  return <CommercialHandoffUnavailable />;
}

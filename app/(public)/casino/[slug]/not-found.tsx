import { CasinoProfileUnavailable } from "@/components/casino-profile/CasinoProfileUnavailable";
import { productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { resolveServerPresentationContext } from "@/lib/market/server";

export default async function CasinoProfileNotFound() {
  const presentation = await resolveServerPresentationContext();
  const messages = productPageMessages(presentation.locale);
  return <CasinoProfileUnavailable description={messages.profile.unavailableDescription} eyebrow={messages.profile.offerUnavailable} messages={messages} presentation={presentation} title={messages.profile.unavailableTitle.replace(/\s*\|\s*B4GAMBLE$/, "")} />;
}

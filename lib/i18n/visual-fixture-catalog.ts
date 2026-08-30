import type { SupportedLocale } from "@/lib/market/registry";

type VisualFixtureCopy = Readonly<{
  atLeastHours: string;
  cashbackTitle: string;
  cryptoPayout: string;
  welcomeBonusType: string;
}>;

const catalog: Record<SupportedLocale, VisualFixtureCopy> = {
  "en-GB": { atLeastHours: "at least {hours}", cashbackTitle: "{percent} weekly cashback up to {amount}", cryptoPayout: "crypto supported", welcomeBonusType: "welcome bonus" },
  "de-DE": { atLeastHours: "mindestens {hours}", cashbackTitle: "Wöchentlich {percent} Cashback, bis zu {amount}", cryptoPayout: "Krypto unterstützt", welcomeBonusType: "Willkommensbonus" },
  "it-IT": { atLeastHours: "almeno {hours}", cashbackTitle: "Rimborso settimanale del {percent} fino a {amount}", cryptoPayout: "criptovalute supportate", welcomeBonusType: "bonus di benvenuto" },
  "es-ES": { atLeastHours: "al menos {hours}", cashbackTitle: "Reembolso semanal del {percent} hasta {amount}", cryptoPayout: "admite criptomonedas", welcomeBonusType: "bono de bienvenida" },
  "pt-PT": { atLeastHours: "pelo menos {hours}", cashbackTitle: "Reembolso semanal de {percent} até {amount}", cryptoPayout: "aceita criptomoedas", welcomeBonusType: "bónus de boas-vindas" },
  "el-GR": { atLeastHours: "τουλάχιστον {hours}", cashbackTitle: "Επιστροφή χρημάτων {percent} κάθε εβδομάδα, έως {amount}", cryptoPayout: "υποστηρίζει κρυπτονομίσματα", welcomeBonusType: "μπόνους καλωσορίσματος" },
  "nl-NL": { atLeastHours: "minstens {hours}", cashbackTitle: "Wekelijkse terugbetaling van {percent} tot {amount}", cryptoPayout: "crypto ondersteund", welcomeBonusType: "welkomstbonus" },
  "sv-SE": { atLeastHours: "minst {hours}", cashbackTitle: "Återbetalning på {percent} varje vecka upp till {amount}", cryptoPayout: "krypto stöds", welcomeBonusType: "välkomstbonus" },
  "da-DK": { atLeastHours: "mindst {hours}", cashbackTitle: "Ugentlig tilbagebetaling på {percent} op til {amount}", cryptoPayout: "krypto understøttes", welcomeBonusType: "velkomstbonus" },
  "fi-FI": { atLeastHours: "vähintään {hours}", cashbackTitle: "Viikoittainen {percent}:n palautus, enintään {amount}", cryptoPayout: "kryptovaluuttoja tuetaan", welcomeBonusType: "tervetuliaisbonus" },
  "nb-NO": { atLeastHours: "minst {hours}", cashbackTitle: "Ukentlig tilbakebetaling på {percent} opptil {amount}", cryptoPayout: "krypto støttes", welcomeBonusType: "velkomstbonus" },
  "en-CA": { atLeastHours: "at least {hours}", cashbackTitle: "{percent} weekly cashback up to {amount}", cryptoPayout: "crypto supported", welcomeBonusType: "welcome bonus" },
  "fr-CA": { atLeastHours: "au moins {hours}", cashbackTitle: "Remise hebdomadaire de {percent} jusqu’à {amount}", cryptoPayout: "cryptomonnaies acceptées", welcomeBonusType: "bonus de bienvenue" },
};

export function visualFixtureCopy(locale: SupportedLocale) {
  return catalog[locale];
}

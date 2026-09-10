import type { SupportedLocale } from "@/lib/market/registry";

export type CommercialUiLabels = Readonly<{
  visitCasino: string;
  notStated: string;
  noCurrentOffer: string;
}>;

const labels: Record<SupportedLocale, CommercialUiLabels> = {
  "en-GB": { visitCasino: "Visit Casino", notStated: "Not stated", noCurrentOffer: "No current offer in your jurisdiction." },
  "en-CA": { visitCasino: "Visit Casino", notStated: "Not stated", noCurrentOffer: "No current offer in your jurisdiction." },
  "fr-CA": { visitCasino: "Visiter le casino", notStated: "Non indiqué", noCurrentOffer: "Aucune offre actuelle dans votre juridiction." },
  "de-DE": { visitCasino: "Casino besuchen", notStated: "Nicht angegeben", noCurrentOffer: "In Ihrer Region ist derzeit kein Angebot verfügbar." },
  "it-IT": { visitCasino: "Visita il casinò", notStated: "Non indicato", noCurrentOffer: "Nessuna offerta attuale nella tua giurisdizione." },
  "es-ES": { visitCasino: "Visitar casino", notStated: "No indicado", noCurrentOffer: "No hay una oferta actual en tu jurisdicción." },
  "es-PE": { visitCasino: "Visitar casino", notStated: "No indicado", noCurrentOffer: "No hay una oferta actual en tu jurisdicción." },
  "pt-PT": { visitCasino: "Visitar casino", notStated: "Não indicado", noCurrentOffer: "Não existe uma oferta atual na sua jurisdição." },
  "el-GR": { visitCasino: "Επίσκεψη στο καζίνο", notStated: "Δεν αναφέρεται", noCurrentOffer: "Δεν υπάρχει τρέχουσα προσφορά στη δικαιοδοσία σου." },
  "nl-NL": { visitCasino: "Bezoek casino", notStated: "Niet vermeld", noCurrentOffer: "Geen actuele aanbieding in jouw rechtsgebied." },
  "sv-SE": { visitCasino: "Besök casinot", notStated: "Inte angivet", noCurrentOffer: "Inget aktuellt erbjudande i din jurisdiktion." },
  "da-DK": { visitCasino: "Besøg casinoet", notStated: "Ikke oplyst", noCurrentOffer: "Intet aktuelt tilbud i din jurisdiktion." },
  "fi-FI": { visitCasino: "Siirry kasinolle", notStated: "Ei ilmoitettu", noCurrentOffer: "Ei ajankohtaista tarjousta alueellasi." },
  "nb-NO": { visitCasino: "Besøk kasinoet", notStated: "Ikke oppgitt", noCurrentOffer: "Ingen gjeldende tilbud i din jurisdiksjon." },
};

export function commercialUiLabels(locale: SupportedLocale): CommercialUiLabels {
  return labels[locale];
}

import type { SupportedLocale } from "@/lib/market/registry";

/** Closing "next step" copy for trust pages (About, FAQ, Methodology). */
export type NextStepMessages = Readonly<{
  eyebrow: string;
  title: string;
  body: string;
}>;

const baseMessages = {
  "en-GB": { eyebrow: "Your next step", title: "Put it into practice.", body: "Ten short missions turn what you've read into limits that hold. Free to use." },
  "de-DE": { eyebrow: "Dein nächster Schritt", title: "Setze es in die Praxis um.", body: "Zehn kurze Missionen machen aus dem Gelesenen Grenzen, die halten. Kostenlos nutzbar." },
  "it-IT": { eyebrow: "Il tuo prossimo passo", title: "Mettilo in pratica.", body: "Dieci brevi missioni trasformano ciò che hai letto in limiti che reggono. Uso gratuito." },
  "es-ES": { eyebrow: "Tu siguiente paso", title: "Ponlo en práctica.", body: "Diez misiones breves convierten lo que has leído en límites que se mantienen. Uso gratuito." },
  "pt-PT": { eyebrow: "O teu próximo passo", title: "Põe em prática.", body: "Dez missões curtas transformam o que leste em limites que se mantêm. Utilização gratuita." },
  "el-GR": { eyebrow: "Το επόμενο βήμα σου", title: "Βάλ' το σε πράξη.", body: "Δέκα σύντομες αποστολές μετατρέπουν όσα διάβασες σε όρια που κρατούν. Δωρεάν χρήση." },
  "nl-NL": { eyebrow: "Je volgende stap", title: "Breng het in de praktijk.", body: "Tien korte missies maken van wat je hebt gelezen grenzen die standhouden. Gratis te gebruiken." },
  "sv-SE": { eyebrow: "Ditt nästa steg", title: "Omsätt det i praktiken.", body: "Tio korta uppdrag gör det du läst till gränser som håller. Gratis att använda." },
  "da-DK": { eyebrow: "Dit næste skridt", title: "Omsæt det til praksis.", body: "Ti korte missioner gør det, du har læst, til grænser, der holder. Gratis at bruge." },
  "fi-FI": { eyebrow: "Seuraava askeleesi", title: "Vie se käytäntöön.", body: "Kymmenen lyhyttä tehtävää muuttaa lukemasi pitäviksi rajoiksi. Käyttö on maksutonta." },
  "nb-NO": { eyebrow: "Ditt neste steg", title: "Sett det ut i livet.", body: "Ti korte oppdrag gjør det du har lest til grenser som holder. Gratis å bruke." },
  "fr-CA": { eyebrow: "Votre prochaine étape", title: "Passez à la pratique.", body: "Dix courtes missions transforment ce que vous avez lu en limites qui tiennent. Utilisation gratuite." },
} as const satisfies Record<Exclude<SupportedLocale, "es-PE" | "en-CA">, NextStepMessages>;

const messages: Record<SupportedLocale, NextStepMessages> = {
  ...baseMessages,
  "es-PE": baseMessages["es-ES"],
  "en-CA": baseMessages["en-GB"],
};

export function nextStepMessages(locale: SupportedLocale): NextStepMessages {
  return messages[locale];
}

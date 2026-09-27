import type { CasinoEditorialLanguage } from "./types";

/**
 * Published editorial text that is already written in a catalog language:
 * offer terms imported for the Danish and German markets. It needs no
 * translation on a page in that language, and it counts as that language
 * when deciding whether a localized FAQ may be described in structured data.
 * On a page in any other language it stays as written.
 */
export const CASINO_EDITORIAL_NATIVE_TEXT: Readonly<Record<CasinoEditorialLanguage, readonly string[]>> = {
  sv: [],
  da: [
    "100% op til 200 kr",
    "Kun første indbetaling. 100% bonus op til 200 kr med 10x gennemspilskrav.",
    "10x indbetaling plus bonus, kun spilleautomater",
    "Nye spillere, kun første indbetaling.",
    "Gennemspilskravet regnes af indbetaling plus bonus: indbetal 100 kr, få 100 kr bonus, gennemspil 2.000 kr.",
    "Maksimal indsats under gennemspil er 50 kr.",
    "Bonuskøb tæller som en indsats.",
    "Kun spilleautomater bidrager, og gevinster fra spil over maksimal indsats fjernes.",
    "Kampagnesiden siger, at spilleautomater tæller 100% og andre spil 10%; forsiden siger, at kun spilleautomater tæller.",
  ],
  de: [
    "100 % bis 100 € + 50 Freispiele",
    "Erste Einzahlung ab 10 € wird zu 100 % bis 100 € verdoppelt, plus 50 Freispiele (0,10 €) auf Book of Dead; Bonuscode GLUECK.",
    "30× auf Einzahlung + Bonus innerhalb von 30 Tagen; Freispielgewinne laut Quellen 6× bis 60× — vor Veröffentlichung in den Bonusbedingungen prüfen",
    "Neukunden mit Wohnsitz in Deutschland nach GGL-Verifizierung; nur erste Einzahlung; ein Willkommensbonus pro 72 h über alle Anbieter.",
    "Mindesteinzahlung 10 € (eine Quelle nennt 20 €)",
    "Bonuscode GLUECK",
    "Max. Bonus 100 €",
    "50 Freispiele Book of Dead à 0,10 €",
    "30× Umsatz in 30 Tagen (nur Automaten)",
    "Max. Einsatz 10 % des Bonus / 5 €",
    "1 € Einsatzlimit pro Spin (GlüStV)",
  ],
};

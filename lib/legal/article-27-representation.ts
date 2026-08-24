export interface Article27Representative {
  jurisdiction: "EU" | "UK";
  jurisdictionLabel: string;
  legalName: string;
  postalAddress: readonly string[];
  legalScope: string;
  letterOfAppointmentSignedOn: "2026-08-22";
  certificate: {
    src: string;
    alt: string;
    intrinsicWidth: number;
    intrinsicHeight: number;
  };
}

export interface Article27Representation {
  portalUrl: string;
  representatives: readonly Article27Representative[];
}

export const currentArticle27Representation: Article27Representation = {
  portalUrl: "https://app.prighter.com/portal/16936473521",
  representatives: [
    {
      jurisdiction: "EU",
      jurisdictionLabel: "European Union (EU)",
      legalName: "Prighter EU Rep GmbH",
      postalAddress: ["Schellinggasse 3/10", "1010 Vienna", "Austria"],
      legalScope: "Representative in the EU pursuant to Article 27 of the EU GDPR",
      letterOfAppointmentSignedOn: "2026-08-22",
      certificate: {
        src: "https://app.prighter.com/v1/business/certificate-of-representation?business_id=16936473521&certificate_product=ART27",
        alt: "GDPR Certification: Art 27 representation by Prighter",
        intrinsicWidth: 1080,
        intrinsicHeight: 400,
      },
    },
    {
      jurisdiction: "UK",
      jurisdictionLabel: "United Kingdom (UK)",
      legalName: "Prighter Ltd",
      postalAddress: [
        "20 Mortlake Mortlake High Street",
        "London",
        "SW14 8JN",
        "United Kingdom",
      ],
      legalScope: "Representative in the UK pursuant to Article 27 of the UK GDPR",
      letterOfAppointmentSignedOn: "2026-08-22",
      certificate: {
        src: "https://app.prighter.com/v1/business/certificate-of-representation?business_id=16936473521&certificate_product=UKREP",
        alt: "UK-GDPR Certification: Art 27 representation by Prighter",
        intrinsicWidth: 1080,
        intrinsicHeight: 401,
      },
    },
  ],
};

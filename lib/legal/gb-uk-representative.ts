export interface GbUkRepresentative {
  legalName: string;
  postalAddress: readonly string[];
  email: string;
  contactRoute: string;
  mandateEvidenceReference: string;
}

/**
 * Public legal particulars. Remains null until Founder/Legal has retained the
 * signed Article 27 mandate and approved every public field in this record.
 */
export const currentGbUkRepresentative: GbUkRepresentative | null = null;

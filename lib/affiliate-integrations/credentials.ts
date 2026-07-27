import "server-only";

import { ValidationError } from "@/lib/services/service-error";

import type { AffiliateCredentials } from "./types";

export interface AffiliateCredentialStore {
  getCredentials(programId: string, reference?: string | null): Promise<AffiliateCredentials | null>;
  setCredentials(programId: string, credentials: AffiliateCredentials): Promise<void>;
  deleteCredentials(programId: string): Promise<void>;
  isConfigured(reference?: string | null): boolean;
}

function credentialEnvironmentName(reference: string) {
  return `AFFILIATE_CREDENTIALS_${reference.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function allowedReferences() {
  return new Set(
    (process.env.AFFILIATE_CREDENTIAL_REFERENCES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export class EnvironmentAffiliateCredentialStore implements AffiliateCredentialStore {
  isConfigured(reference?: string | null) {
    if (!reference || !allowedReferences().has(reference)) return false;
    return Boolean(process.env[credentialEnvironmentName(reference)]?.trim());
  }

  async getCredentials(_programId: string, reference?: string | null) {
    if (!reference) return null;
    if (!allowedReferences().has(reference)) {
      throw new ValidationError("Affiliate credential reference is not allowlisted");
    }
    const raw = process.env[credentialEnvironmentName(reference)]?.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AffiliateCredentials;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      return parsed;
    } catch {
      throw new ValidationError("Configured affiliate credentials are malformed");
    }
  }

  async setCredentials() {
    throw new ValidationError("Environment credentials are read-only; update the managed secret store");
  }

  async deleteCredentials() {
    throw new ValidationError("Environment credentials are read-only; update the managed secret store");
  }
}

export const affiliateCredentialStore = new EnvironmentAffiliateCredentialStore();

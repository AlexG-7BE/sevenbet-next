export type MediaAssetTypeValue =
  | "LOGO"
  | "FAVICON"
  | "HERO"
  | "SCREENSHOT"
  | "GALLERY"
  | "BONUS_CREATIVE"
  | "SOCIAL_IMAGE"
  | "AFFILIATE_CREATIVE"
  | "OTHER";

export interface MediaAssetAdminRecord {
  id: string;
  type: MediaAssetTypeValue;
  storageProvider: "LOCAL" | "S3";
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  altText: string;
  title: string | null;
  caption: string | null;
  credit: string | null;
  sortOrder: number;
  featured: boolean;
  status: "PROCESSING" | "ACTIVE" | "ARCHIVED" | "FAILED" | "STORAGE_DELETE_FAILED";
  checksum: string | null;
  metadata: Record<string, unknown> | null;
  variants: Array<Record<string, unknown>> | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  casinoId: string | null;
  casinoBonusId: string | null;
  affiliateOfferId: string | null;
}

export async function mediaJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Media request failed");
  return result as T;
}

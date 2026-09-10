export const ACTIVE_ADMIN_MEDIA_TYPES = ["LOGO", "SOCIAL_IMAGE"] as const;

export type ActiveAdminMediaType = typeof ACTIVE_ADMIN_MEDIA_TYPES[number];

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function isB4GambleOwnedEditorialMetadata(value: unknown) {
  return metadataRecord(value).b4gambleOwned === true;
}

export function isActiveAdminMediaType(value: string): value is ActiveAdminMediaType {
  return ACTIVE_ADMIN_MEDIA_TYPES.includes(value as ActiveAdminMediaType);
}

export function isActiveAdminMediaAsset(asset: { type: string; metadata?: unknown }) {
  return asset.type === "LOGO"
    || (asset.type === "SOCIAL_IMAGE" && isB4GambleOwnedEditorialMetadata(asset.metadata));
}

export function b4GambleEditorialMetadata(value: unknown) {
  return {
    ...metadataRecord(value),
    b4gambleOwned: true,
    mediaAuthority: "B4GAMBLE_EDITORIAL",
  };
}

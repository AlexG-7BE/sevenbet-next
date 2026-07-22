import type { MediaAssetAdminRecord } from "@/lib/media/admin-types";

export interface MediaMetadataDraft {
  altText: string;
  caption: string;
}

type MediaRequest = <T>(url: string, init?: RequestInit) => Promise<T>;

export function mediaMetadataDraft(record: MediaAssetAdminRecord): MediaMetadataDraft {
  return {
    altText: record.altText,
    caption: record.caption || "",
  };
}

export async function persistMediaMetadata(input: {
  casinoId: string;
  draft: MediaMetadataDraft;
  record: MediaAssetAdminRecord;
  request: MediaRequest;
}) {
  const result = await input.request<{ media: MediaAssetAdminRecord }>(`/api/admin/media/${input.record.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      casinoId: input.casinoId,
      expectedUpdatedAt: input.record.updatedAt,
      altText: input.draft.altText,
      caption: input.draft.caption,
    }),
  });

  return result.media;
}

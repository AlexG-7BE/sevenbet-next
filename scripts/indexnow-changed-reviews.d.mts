export declare const IN_DEPTH_FILES: Readonly<Record<"sv" | "da", string>>;
export declare function inDepthEntries(source: string | null | undefined): Map<string, string>;
export declare function changedInDepthSlugs(before: string | null | undefined, after: string | null | undefined): string[];
export declare function changedReviewUrls(readAt: (revision: string, path: string) => string, base: string, head: string): string[];

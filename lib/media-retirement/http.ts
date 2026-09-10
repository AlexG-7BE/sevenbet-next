export async function retiredMediaResponse(..._args: unknown[]) {
  return Response.json(
    { error: "MEDIA_OPERATIONS_RETIRED" },
    {
      status: 410,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

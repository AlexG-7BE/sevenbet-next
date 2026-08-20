export async function readBoundedBody(request: Request, limit: number) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > limit) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > limit) throw new Error("PAYLOAD_TOO_LARGE");
  return text;
}

export function privateNoStore(response: Response) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export function noStoreJson(value: unknown, init?: ResponseInit) {
  const response = Response.json(value, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

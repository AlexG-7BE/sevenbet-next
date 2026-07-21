import { createHash, createHmac } from "node:crypto";

import {
  assertStorageKey,
  StorageConfigurationError,
  type StorageObjectMetadata,
  type StorageProvider,
  type StorageUploadInput,
} from "./storage-provider";

interface S3Config {
  endpoint: URL;
  region: string;
  bucket: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new StorageConfigurationError(`${name} is required for S3 media storage`);
  return value;
}

function config(): S3Config {
  const endpoint = new URL(required("MEDIA_S3_ENDPOINT"));
  const publicUrl = new URL(required("MEDIA_S3_PUBLIC_BASE_URL"));
  if (endpoint.protocol !== "https:" && process.env.NODE_ENV === "production") throw new StorageConfigurationError("MEDIA_S3_ENDPOINT must use HTTPS in production");
  if (!["http:", "https:"].includes(endpoint.protocol) || !["http:", "https:"].includes(publicUrl.protocol) || endpoint.username || endpoint.password || publicUrl.username || publicUrl.password) {
    throw new StorageConfigurationError("S3 endpoint and public base URL must be credential-free HTTP(S) URLs");
  }
  if (publicUrl.protocol !== "https:" && process.env.NODE_ENV === "production") throw new StorageConfigurationError("MEDIA_S3_PUBLIC_BASE_URL must use HTTPS in production");
  return {
    endpoint,
    region: process.env.MEDIA_S3_REGION?.trim() || "auto",
    bucket: required("MEDIA_S3_BUCKET"),
    publicBaseUrl: publicUrl.toString().replace(/\/$/, ""),
    accessKeyId: required("MEDIA_S3_ACCESS_KEY_ID"),
    secretAccessKey: required("MEDIA_S3_SECRET_ACCESS_KEY"),
    sessionToken: process.env.MEDIA_S3_SESSION_TOKEN?.trim() || undefined,
  };
}

function hash(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function encodedPath(value: string) {
  return value.split("/").map((segment) => encodeURIComponent(segment).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}

async function signedRequest(method: "PUT" | "DELETE" | "HEAD", key: string, body?: Uint8Array, contentType?: string) {
  assertStorageKey(key);
  const settings = config();
  const pathname = `${settings.endpoint.pathname.replace(/\/$/, "")}/${encodedPath(settings.bucket)}/${encodedPath(key)}`.replace(/\/+/g, "/");
  const url = new URL(pathname, settings.endpoint);
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = timestamp.slice(0, 8);
  const payloadHash = hash(body || new Uint8Array());
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": timestamp,
  };
  if (contentType) {
    headers["content-type"] = contentType;
    headers["if-none-match"] = "*";
  }
  if (settings.sessionToken) headers["x-amz-security-token"] = settings.sessionToken;
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const scope = `${date}/${settings.region}/s3/aws4_request`;
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaderNames.join(";"), payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", timestamp, scope, hash(canonicalRequest)].join("\n");
  const dateKey = hmac(`AWS4${settings.secretAccessKey}`, date);
  const regionKey = hmac(dateKey, settings.region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${settings.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(";")}, Signature=${createHmac("sha256", signingKey).update(stringToSign).digest("hex")}`;
  delete headers.host;
  return fetch(url, { method, headers, body: body ? Buffer.from(body) : undefined, cache: "no-store" });
}

export class S3StorageProvider implements StorageProvider {
  readonly name = "S3" as const;

  async validate() {
    config();
  }

  getPublicUrl(key: string) {
    assertStorageKey(key);
    return `${config().publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async upload(input: StorageUploadInput) {
    const response = await signedRequest("PUT", input.key, input.data, input.contentType);
    if (response.status === 412) return { key: input.key, publicUrl: this.getPublicUrl(input.key), created: false };
    if (!response.ok) throw new Error(`S3 upload failed with status ${response.status}`);
    return { key: input.key, publicUrl: this.getPublicUrl(input.key), created: true };
  }

  async delete(key: string) {
    const response = await signedRequest("DELETE", key);
    if (!response.ok && response.status !== 404) throw new Error(`S3 delete failed with status ${response.status}`);
  }

  async exists(key: string) {
    const response = await signedRequest("HEAD", key);
    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`S3 metadata request failed with status ${response.status}`);
    return true;
  }

  async metadata(key: string): Promise<StorageObjectMetadata | null> {
    const response = await signedRequest("HEAD", key);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`S3 metadata request failed with status ${response.status}`);
    const size = Number(response.headers.get("content-length") || 0);
    return {
      sizeBytes: Number.isSafeInteger(size) ? size : 0,
      contentType: response.headers.get("content-type"),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified") ? new Date(response.headers.get("last-modified")!) : null,
    };
  }
}

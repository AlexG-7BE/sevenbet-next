# Media Storage Setup

## Provider selection

`MEDIA_STORAGE_PROVIDER` accepts `LOCAL` or `S3`. Provider objects are initialized only inside a request, so builds and tests do not require production credentials.

### Local development

```env
MEDIA_STORAGE_PROVIDER="LOCAL"
MEDIA_LOCAL_STORAGE_ROOT=".media-storage"
MEDIA_PUBLIC_BASE_URL="http://localhost:4173"
MEDIA_MAX_FILE_SIZE_BYTES="10485760"
MEDIA_MAX_DIMENSION="8000"
```

`.media-storage` is ignored by Git. Local objects are served by `/api/media/local/[...key]` only outside production, with `nosniff`, sandbox CSP, and no-store caching. Do not point the local root at `public`, the repository, or a shared production directory.

## S3-compatible production storage

The built-in provider uses server-side AWS Signature Version 4 and a path-style endpoint. It works with compatible object storage that supports conditional `PUT` via `If-None-Match: *`. No browser receives access credentials.

```env
MEDIA_STORAGE_PROVIDER="S3"
MEDIA_S3_ENDPOINT="https://storage.example.com"
MEDIA_S3_REGION="auto"
MEDIA_S3_BUCKET="sevenbet-media"
MEDIA_S3_PUBLIC_BASE_URL="https://media.example.com"
MEDIA_S3_ACCESS_KEY_ID="set-in-vercel"
MEDIA_S3_SESSION_TOKEN=""
```

Set the secret named `MEDIA_S3_SECRET_ACCESS_KEY` directly in Vercel; do not place a value in project documentation or source control.

Configure these values in Vercel project settings for Preview and Production as appropriate. Never commit real values. Both endpoint URLs must be credential-free HTTPS in production.

The bucket should be private for writes. Publish objects through a read-only CDN/custom domain corresponding to `MEDIA_S3_PUBLIC_BASE_URL`. Grant the application identity only object `PUT`, `HEAD`, and `DELETE` access within the selected bucket. List-bucket and administrative permissions are not required by the provider.

## Manual readiness check

Before enabling editors:

1. Create the bucket and CDN/public read path manually.
2. Add credentials to Vercel; do not create a store from application code.
3. Confirm the endpoint supports path-style SigV4 and conditional create.
4. Apply migration `0009_media_manager` manually.
5. Deploy and upload a non-sensitive test image.
6. Confirm public delivery, metadata update, archive/restore, and audit entries.
7. Remove the test asset through the safe archive/delete flow.

## Limits and security

The default upload limit is 10 MiB and the maximum dimension is 8000 pixels. Keep reverse-proxy and platform request limits at or below an operationally acceptable value. The application does not support direct browser-to-bucket uploads, remote URL import, SVG, video, documents, or signed URL persistence.

Object keys are generated from validated ownership, type, and SHA-256. User filenames never become storage paths. Create-if-absent behavior prevents concurrent duplicate upload compensation from deleting another request's object.

## Cleanup and CDN behavior

Do not configure a lifecycle rule that expires active objects. A future reconciliation process should compare database keys with storage inventory and quarantine confirmed orphans before deletion. Public CDN caches should use immutable keys; replacing image content under an existing key is prohibited. Archive does not immediately delete bytes because previews, revisions, or rollback analysis may still require them.

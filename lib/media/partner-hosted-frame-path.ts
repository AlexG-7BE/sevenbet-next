const uuidPathSegment = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const publicFramePath = new RegExp(`^/partner-creatives/${uuidPathSegment}/frame$`, "i");
const adminFramePath = new RegExp(`^/api/admin/media-operations/hosted-creatives/${uuidPathSegment}/preview$`, "i");

export function ownsPartnerHostedFramePolicy(pathname: string) {
  return publicFramePath.test(pathname) || adminFramePath.test(pathname);
}

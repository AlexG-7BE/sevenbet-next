type PreviewHostEnvironment = {
  [key: string]: string | undefined;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

export type PreviewCanonicalHostDecision =
  | { kind: "next" }
  | { kind: "redirect"; location: string }
  | { kind: "reject"; reason: "metadata" | "host" };

const VERCEL_HOST =
  /^(?=.{1,63}\.vercel\.app$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/;

export const VERCEL_BRANCH_HOST =
  /^(?=.{1,63}\.vercel\.app$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?-git-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.vercel\.app$/;

export function isValidVercelBranchHost(value: string | undefined): value is string {
  return Boolean(value && VERCEL_BRANCH_HOST.test(value));
}

function isValidVercelDeploymentHost(value: string | undefined): value is string {
  return Boolean(value && VERCEL_HOST.test(value) && !value.includes("-git-"));
}

export function resolvePreviewCanonicalHost(
  requestUrl: string,
  environment: PreviewHostEnvironment = process.env,
): PreviewCanonicalHostDecision {
  if (environment.VERCEL_ENV !== "preview") return { kind: "next" };

  const deploymentHost = environment.VERCEL_URL;
  const branchHost = environment.VERCEL_BRANCH_URL;
  if (
    !isValidVercelDeploymentHost(deploymentHost)
    || !isValidVercelBranchHost(branchHost)
    || deploymentHost === branchHost
  ) {
    return { kind: "reject", reason: "metadata" };
  }

  let requested: URL;
  try {
    requested = new URL(requestUrl);
  } catch {
    return { kind: "reject", reason: "host" };
  }

  if (requested.hostname === branchHost) return { kind: "next" };
  if (requested.hostname !== deploymentHost) return { kind: "reject", reason: "host" };

  requested.protocol = "https:";
  requested.hostname = branchHost;
  requested.port = "";
  return { kind: "redirect", location: requested.toString() };
}

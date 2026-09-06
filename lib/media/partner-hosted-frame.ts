import { randomBytes } from "node:crypto";

import { bannerflowScriptUrl } from "@/lib/media-operations/partner-hosted";

export function bannerflowFrameContentSecurityPolicy(nonce?: string) {
  return [
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
  `script-src ${nonce ? `'nonce-${nonce}' ` : ""}https://c.bannerflow.net blob: 'unsafe-eval'`,
  "style-src 'unsafe-inline'",
  "img-src https://c.bannerflow.net data: blob:",
  "font-src https://c.bannerflow.net data:",
  "connect-src https://c.bannerflow.net",
  "frame-src 'self' blob:",
  "object-src 'none'",
  ].join("; ");
}

export function partnerHostedFrameHeaders(contentSecurityPolicy = bannerflowFrameContentSecurityPolicy()) {
  return {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": contentSecurityPolicy,
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  } as const;
}

function attribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function buildBannerflowFrameDocument(input: {
  providerEmbedPath: string;
  providerEmbedParameters: Record<string, string>;
  governedRedirectUrl: string;
  publicOrigin: string;
  width: number;
  height: number;
  creativeId: string;
}) {
  const nonce = randomBytes(18).toString("base64");
  const src = bannerflowScriptUrl({
    provider: "BANNERFLOW",
    providerEmbedPath: input.providerEmbedPath,
    providerEmbedParameters: input.providerEmbedParameters,
  }, input.governedRedirectUrl, input.publicOrigin);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}body{display:grid;place-items:center}#creative{width:${input.width}px;height:${input.height}px;max-width:100%;max-height:100%;overflow:hidden}</style></head>
<body><div id="creative"><script nonce="${attribute(nonce)}">(()=>{const id=${JSON.stringify(input.creativeId)};let done=false;const send=state=>{if(done)return;done=true;parent.postMessage({type:"b4-partner-creative-frame",creativeId:id,state},"*")};addEventListener("error",event=>{if(event.target&&event.target.tagName==="SCRIPT")send("failed")},true);const rendered=()=>document.querySelector("#creative>:not(script),#creative iframe,#creative canvas,#creative svg,#creative img,#creative video");const observer=new MutationObserver(()=>{if(rendered()){observer.disconnect();send("ready")}});observer.observe(document.getElementById("creative"),{childList:true,subtree:true});setTimeout(()=>send("failed"),8000)})();</script><script src="${attribute(src)}" async></script></div></body></html>`;
  return { html, contentSecurityPolicy: bannerflowFrameContentSecurityPolicy(nonce) };
}

export function noPartnerHostedFrame(status = 404) {
  return new Response("<!doctype html><title>Creative unavailable</title>", {
    status,
    headers: { ...partnerHostedFrameHeaders(), "Cache-Control": "private, no-store" },
  });
}

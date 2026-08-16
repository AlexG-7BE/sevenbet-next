function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buttonToLink(html: string, label: string, href: string) {
  const pattern = new RegExp(`<button([^>]*)>${escapePattern(label)}</button>`, "g");
  return html.replace(pattern, `<a href="${href}"$1>${label}</a>`);
}

export function transformCommonHandoff(html: string) {
  return buttonToLink(html, "Start Programme", "/program?entry=start");
}

export function transformTenStepsHandoff(html: string) {
  return buttonToLink(html, "Start Mission 01", "/program?entry=start");
}

export function transformResponsibleGamblingHandoff(html: string) {
  return [
    ["Get support", "/help"],
    ["Read the guides", "/learn/responsible-gambling"],
    ["Open Help", "/help"],
  ].reduce((output, [label, href]) => buttonToLink(output, label, href), html);
}

export function transformHelpHandoff(html: string) {
  let output = html.replace(
    /<div([^>]*)>Independent support — free, confidential, not affiliated with us<\/div>/,
    '<div id="independent-support"$1>Independent support — free, confidential, not affiliated with us</div>',
  );
  output = [
    ["Pause now", "#independent-support"],
    ["See the steps", "#independent-support"],
    ["Set up blocks", "/learn/responsible-gambling/responsible-gambling-tools"],
    ["Write to us", "/contact"],
  ].reduce((result, [label, href]) => buttonToLink(result, label, href), output);
  output = output
    .replace(
      /<span style="font-size: 15px; color: rgb\(250, 250, 247\); border-bottom: 1px solid rgba\(250, 250, 247, 0\.4\); padding-bottom: 3px; white-space: nowrap; cursor: pointer;">About the Programme →<\/span>/,
      '<a href="/10-steps" style="font-size: 15px; color: rgb(250, 250, 247); border-bottom: 1px solid rgba(250, 250, 247, 0.4); padding-bottom: 3px; white-space: nowrap; cursor: pointer;">About the Programme →</a>',
    )
    .replace(
      /<span style="cursor: pointer; border-bottom: 1px solid rgba\(250, 250, 247, 0\.3\); padding-bottom: 1px;">Privacy<\/span>/,
      '<a href="/privacy" style="cursor: pointer; border-bottom: 1px solid rgba(250, 250, 247, 0.3); padding-bottom: 1px;">Privacy</a>',
    )
    .replace(
      /<span style="cursor: pointer; border-bottom: 1px solid rgba\(250, 250, 247, 0\.3\); padding-bottom: 1px;">Terms<\/span>/,
      '<a href="/terms" style="cursor: pointer; border-bottom: 1px solid rgba(250, 250, 247, 0.3); padding-bottom: 1px;">Terms</a>',
    )
    .replace(
      /<div style="display: flex; justify-content: space-between; gap: 16px; padding: 18px 0px; border-bottom: 1px solid rgba\(250, 250, 247, 0\.12\); font-size: 15px;"><span style="font-weight: 600;">GamCare<\/span><span style="color: rgba\(250, 250, 247, 0\.7\); white-space: nowrap;">0808 8020 133<\/span><\/div>/,
      '<a aria-label="GamCare — independent support (opens an external site in a new tab)" href="https://www.gamcare.org.uk/get-support/" rel="noopener noreferrer" target="_blank" style="display: flex; justify-content: space-between; gap: 16px; padding: 18px 0px; border-bottom: 1px solid rgba(250, 250, 247, 0.12); font-size: 15px; color: inherit; text-decoration: none;"><span style="font-weight: 600;">GamCare</span><span style="color: rgba(250, 250, 247, 0.7); white-space: nowrap;">0808 8020 133</span></a>',
    );
  return output;
}

export function transformNotFoundHandoff(html: string) {
  return html.replace(
    /<div style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp\(120px, 18vw, 240px\); line-height: 0\.9; letter-spacing: -0\.02em;">404<\/div>/,
    '<h1 style="font-family: Archivo, sans-serif; font-weight: 800; text-transform: uppercase; font-size: clamp(120px, 18vw, 240px); line-height: 0.9; letter-spacing: -0.02em; margin: 0px;">404</h1>',
  );
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const definitions = [
  ["demo-northstar", "NORTHSTAR", "#d8ff3e", "#17211b", "N"],
  ["demo-harbour", "HARBOUR", "#78d7ff", "#102332", "H"],
  ["demo-atlas", "ATLAS", "#ffb15a", "#2c1c15", "A"],
  ["demo-meadow", "MEADOW", "#a9e5b2", "#183022", "M"],
  ["demo-lantern", "LANTERN", "#ff8e9d", "#311a22", "L"],
];
const root = path.join(process.cwd(), "public", "demo-casinos");
await mkdir(root, { recursive: true });

for (const [slug, name, accent, dark, initial] of definitions) {
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="240" viewBox="0 0 560 240" role="img" aria-labelledby="title"><title>Demo ${name} Casino fictional logo</title><rect width="560" height="240" rx="28" fill="${dark}"/><circle cx="104" cy="120" r="62" fill="${accent}"/><text x="104" y="140" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="900" fill="${dark}">${initial}</text><text x="190" y="102" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="5" fill="${accent}">DEMO</text><text x="190" y="145" font-family="Arial,sans-serif" font-size="38" font-weight="900" letter-spacing="1" fill="#fff">${name}</text><text x="190" y="177" font-family="Arial,sans-serif" font-size="14" fill="#c7c9c3">FICTIONAL CASINO PROFILE</text></svg>`;
  const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title"><title>Demo ${name} Casino synthetic editorial artwork</title><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="#070b09"/></linearGradient><pattern id="p" width="96" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><path d="M0 48h96M48 0v96" stroke="${accent}" stroke-opacity=".12" stroke-width="2"/></pattern></defs><rect width="1600" height="900" fill="url(#g)"/><rect width="1600" height="900" fill="url(#p)"/><circle cx="1300" cy="170" r="260" fill="${accent}" fill-opacity=".92"/><circle cx="1340" cy="700" r="390" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="96"/><rect x="120" y="118" width="210" height="54" rx="27" fill="${accent}"/><text x="225" y="154" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${dark}">SYNTHETIC DEMO</text><text x="120" y="380" font-family="Arial,sans-serif" font-size="132" font-weight="900" fill="#fff">${name}</text><text x="120" y="470" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="${accent}">A fictional SevenBet profile</text><text x="120" y="690" font-family="Arial,sans-serif" font-size="28" fill="#d4d7d1">No real operator · No real licence · No live offer</text></svg>`;
  const screen = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-labelledby="title"><title>Demo ${name} Casino fictional mobile presentation</title><rect width="900" height="1200" fill="#f4f3ec"/><rect x="78" y="52" width="744" height="1096" rx="68" fill="${dark}"/><rect x="112" y="128" width="676" height="350" rx="28" fill="${accent}"/><text x="156" y="196" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${dark}">DEMO CASINO PROFILE</text><text x="156" y="310" font-family="Arial,sans-serif" font-size="74" font-weight="900" fill="${dark}">${name}</text><text x="156" y="390" font-family="Arial,sans-serif" font-size="28" fill="${dark}">Fictional product presentation</text><rect x="112" y="526" width="676" height="174" rx="24" fill="#fff" fill-opacity=".09"/><rect x="112" y="734" width="322" height="250" rx="24" fill="#fff" fill-opacity=".09"/><rect x="466" y="734" width="322" height="250" rx="24" fill="#fff" fill-opacity=".09"/><rect x="112" y="1022" width="300" height="68" rx="34" fill="${accent}"/><text x="262" y="1066" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="900" fill="${dark}">READ REVIEW</text></svg>`;
  await Promise.all([
    writeFile(path.join(root, `${slug}-logo.svg`), logo),
    writeFile(path.join(root, `${slug}-hero.svg`), hero),
    writeFile(path.join(root, `${slug}-screen.svg`), screen),
  ]);
}

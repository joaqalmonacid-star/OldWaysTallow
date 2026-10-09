// Genera las ilustraciones SVG (productos, hero, logo, favicon).
// Uso: node scripts/generate-assets.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "img");
mkdirSync(outDir, { recursive: true });

const products = [
  { file: "sebo-res", label: "#7a3b1d", cap: "#c98b3f", accent: "#f3dfc0", name: ["SEBO DE", "RES"], weight: "500 g", emoji: "BEEF" },
  { file: "manteca-cerdo", label: "#8a4a2b", cap: "#d6a25a", accent: "#f7e6c6", name: ["MANTECA", "DE CERDO"], weight: "500 g", emoji: "PORK" },
  { file: "grasa-pato", label: "#4a3524", cap: "#e0b25f", accent: "#f6e2bd", name: ["GRASA DE", "PATO"], weight: "300 g", emoji: "DUCK" },
  { file: "sebo-cordero", label: "#6b4a2f", cap: "#caa15c", accent: "#f0dcc0", name: ["SEBO DE", "CORDERO"], weight: "500 g", emoji: "LAMB" },
  { file: "manteca-iberico", label: "#5c2f2a", cap: "#d8a24e", accent: "#f6dfc2", name: ["MANTECA", "IBÉRICA"], weight: "400 g", emoji: "BELLOTA" },
  { file: "sebo-ahumado", label: "#3f3230", cap: "#b98a4c", accent: "#ecd9bd", name: ["SEBO DE RES", "AHUMADO"], weight: "500 g", emoji: "SMOKED" },
];

function jarSvg({ label, cap, accent, name, weight, emoji }) {
  const nameLines = name
    .map(
      (line, i) =>
        `<text x="300" y="${330 + i * 40}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" fill="#fff8ec" letter-spacing="1">${line}</text>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${name.join(" ")} ${weight}">
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="0.25" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="0.75" stop-color="#000000" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.14"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cap}"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${cap}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <circle cx="300" cy="300" r="250" fill="url(#glow)"/>

  <!-- sombra -->
  <ellipse cx="300" cy="536" rx="150" ry="22" fill="#2a1c10" opacity="0.18"/>

  <!-- tapa -->
  <rect x="196" y="92" width="208" height="66" rx="16" fill="url(#metal)"/>
  <rect x="206" y="100" width="188" height="50" rx="11" fill="#000000" opacity="0.06"/>
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${216 + i * 20}" y="100" width="5" height="50" rx="2.5" fill="#000000" opacity="0.10"/>`).join("")}

  <!-- cuello -->
  <rect x="212" y="156" width="176" height="34" rx="8" fill="${accent}"/>
  <rect x="212" y="156" width="176" height="34" rx="8" fill="url(#glass)"/>

  <!-- cuerpo -->
  <rect x="150" y="184" width="300" height="336" rx="30" fill="${accent}"/>
  <rect x="150" y="184" width="300" height="336" rx="30" fill="url(#glass)"/>

  <!-- brillo -->
  <rect x="172" y="212" width="26" height="270" rx="13" fill="#ffffff" opacity="0.35"/>

  <!-- etiqueta -->
  <rect x="168" y="256" width="264" height="196" rx="16" fill="${label}"/>
  <rect x="168" y="256" width="264" height="196" rx="16" fill="#000000" opacity="0.05"/>
  <rect x="186" y="274" width="228" height="0.5" fill="#ffffff" opacity="0.4"/>
  <text x="300" y="302" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="6" fill="${accent}">OLDWAYS</text>
  ${nameLines}
  <text x="300" y="432" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="3" fill="${accent}" opacity="0.9">${weight} · ${emoji}</text>
  <rect x="186" y="446" width="228" height="0.5" fill="#ffffff" opacity="0.4"/>
</svg>
`;
}

for (const p of products) {
  writeFileSync(join(outDir, `${p.file}.svg`), jarSvg(p), "utf8");
}

// Hero: jar + acompañamientos
function heroSvg() {
  const jar = jarSvg({ label: "#7a3b1d", cap: "#c98b3f", accent: "#f3dfc0", name: ["SEBO DE", "RES"], weight: "500 g", emoji: "BEEF" });
  const inner = jar.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="Tarro de sebo de res OldWays">
  <g>${inner}</g>
</svg>
`;
}
writeFileSync(join(outDir, "hero.svg"), heroSvg(), "utf8");

// Logo / favicon
function logoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="OldWays Tallow">
  <rect width="64" height="64" rx="14" fill="#3a2417"/>
  <path d="M32 12c7 10 13 16.5 13 24a13 13 0 1 1-26 0c0-7.5 6-14 13-24z" fill="#e6b25c"/>
  <circle cx="32" cy="37" r="6.5" fill="#fff8ec"/>
</svg>
`;
}
// Logo: si existe el PNG del usuario se incrusta en un SVG; si no, se usa el ícono vectorial.
const pngLogoPath = join(outDir, "logo_OldWays.png");
if (existsSync(pngLogoPath)) {
  const dataUri = "data:image/png;base64," + readFileSync(pngLogoPath).toString("base64");
  const embedded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 141" width="150" height="141" role="img" aria-label="OldWays Tallow"><image width="150" height="141" href="${dataUri}"/></svg>\n`;
  writeFileSync(join(outDir, "logo_OldWays.svg"), embedded, "utf8");
  writeFileSync(join(outDir, "logo.svg"), embedded, "utf8");
  writeFileSync(join(outDir, "favicon.svg"), embedded, "utf8");
} else {
  writeFileSync(join(outDir, "logo.svg"), logoSvg(), "utf8");
  writeFileSync(join(outDir, "favicon.svg"), logoSvg(), "utf8");
}

// Patrón / textura sutil para fondo
writeFileSync(
  join(outDir, "grain.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter><rect width="140" height="140" filter="url(#n)" opacity="0.05"/></svg>`,
  "utf8"
);

console.log("Recursos generados en", outDir);

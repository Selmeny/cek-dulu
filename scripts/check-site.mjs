import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url);

function read(relativePath) {
  return readFileSync(new URL(relativePath, dist), "utf8");
}

function walk(relativeDir) {
  const dir = new URL(relativeDir, dist);
  const found = [];
  for (const name of readdirSync(dir)) {
    const child = join(relativeDir, name);
    const info = statSync(new URL(child, dist));
    if (info.isDirectory()) {
      found.push(...walk(`${child}/`));
    } else if (name.endsWith(".html") || name.endsWith(".css") || name.endsWith(".js")) {
      found.push(child);
    }
  }
  return found;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const titles = [
  "Ada yang minta kode WhatsApp",
  "Nomor baru mengaku keluarga",
  "Tautan hadiah, paket, atau tagihan",
  "Transfer, QRIS, atau investasi yang mendesak",
  "Belanja daring yang aneh",
  "Anda menyimpan data orang lain",
  "Kata sandi akun penting",
  "Akun sekolah dan jejak yang orang lain lihat",
];

const checks = [
  "Saya tidak memberikan kode WhatsApp kepada siapa pun.",
  "Saya menghubungi nomor lama sebelum percaya pada nomor baru yang mengaku keluarga.",
  "Saya membuka aplikasi resmi sendiri, bukan tautan dari chat.",
  "Saya memeriksa nama penerima di aplikasi resmi sebelum transfer yang terasa terburu.",
  "Saya membayar belanja daring di dalam aplikasi pasar bila barang ada di sana.",
  "Saya tidak meminta foto KTP atau PIN di chat.",
  "Kata sandi akun penting saya panjang dan berbeda, dan saya tidak menggantinya hanya karena jadwal.",
  "Akun media sosial saya tidak terbuka untuk semua orang, dan pemulihannya milik saya.",
];

const headings = [
  "Lakukan ini sekarang",
  "Mengapa ini berbahaya",
  "Kalau ini sudah terjadi",
  "Dari mana saran ini",
];

const home = read("index.html");
for (const title of titles) {
  if (!home.includes(title)) fail(`Home is missing: ${title}`);
}

const cek = read("cek/index.html");
for (const line of checks) {
  if (!cek.includes(line)) fail(`Check is missing: ${line}`);
}
if (cek.includes("fetch(")) fail("Check page asks the network.");

const situationIds = [
  "kode-whatsapp",
  "nomor-keluarga",
  "tautan-hadiah",
  "transfer-mendesak",
  "belanja-daring",
  "data-orang-lain",
  "kata-sandi",
  "jejak-akun",
];

for (const id of situationIds) {
  const html = read(`situasi/${id}/index.html`);
  for (const heading of headings) {
    if (!html.includes(heading)) fail(`${id} is missing heading: ${heading}`);
  }
  if (!html.includes('id="wa-share"')) fail(`${id} has no WhatsApp share link.`);
  if (!html.includes("https://")) fail(`${id} has no https link.`);
}

for (const id of ["ponsel", "uang", "penjual", "pelajar", "ortu"]) {
  read(`peran/${id}/index.html`);
}

const sources = read("sumber/index.html");
for (const host of [
  "pages.nist.gov",
  "www.nist.gov/cyberframework",
  "www.iso.org/standard/75652.html",
  "peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022",
  "iasc.ojk.go.id",
  "sipasti.ojk.go.id",
]) {
  if (!sources.includes(host)) fail(`Source page is missing ${host}`);
}

const files = walk("./");
const bundled = [home, ...files.map((file) => read(file))].join("\n");
if (bundled.includes("fonts.googleapis") || bundled.includes("googletagmanager") || bundled.includes("google-analytics")) {
  fail("Third-party tracker or font host is present.");
}

function linkedStyle(html) {
  const names = [...html.matchAll(/href="[^"]*\/([^"/]+\.css)"/g)].map((match) => match[1]);
  return names.map((name) => read(`_astro/${name}`)).join("\n");
}

const css = `${home}\n${linkedStyle(home)}`;
const oneColumn = /grid-template-columns:\s*1fr/.test(css);
const fourColumns = /repeat\(\s*4\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/.test(css);
const wideGrid = /(?:min-width:\s*72rem|\(width\s*>=\s*72rem\))/.test(css);
const readingMeasure = /max-width:\s*40rem/.test(css);
if (!oneColumn || !fourColumns || !wideGrid || !readingMeasure) {
  fail(
    `Adaptive grid or the 40rem reading measure is missing. one=${oneColumn} four=${fourColumns} wide=${wideGrid} measure=${readingMeasure}`,
  );
}
if (!css.includes("Plus Jakarta Sans") || !css.includes("Fraunces")) {
  fail("Font pairing is missing.");
}
if (!css.includes(".woff2")) fail("Fonts are not self-hosted.");
if (bundled.includes("IBM Plex")) fail("IBM Plex is not part of this pairing.");

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`Checked ${situationIds.length} situations, 5 roles, the short check, and the source page.`);

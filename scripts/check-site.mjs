import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  STORAGE_KEY,
  parseStore,
  markDone,
  markUndone,
  chooseRole,
  clearRole,
  isComplete,
} from "../src/lib/checklist.mjs";

const dist = new URL("../dist/", import.meta.url);
const repo = new URL("../", import.meta.url);

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

function assertStore(name, condition) {
  if (!condition) fail(`Store: ${name}`);
}

function checkStore() {
  const empty = parseStore(null);
  assertStore("missing is empty", empty.role === null && Object.keys(empty.done).length === 0);
  assertStore("bad json", parseStore("{").role === null);
  assertStore("array", parseStore("[]").role === null);
  const unknown = parseStore(JSON.stringify({ role: "nope", done: { pelajar: ["kata-sandi", "old-topic", 3], nope: ["x"] } }));
  assertStore("unknown role shows the role list", unknown.role === null);
  assertStore("keeps known topic ids", unknown.done.pelajar[0] === "kata-sandi" && unknown.done.pelajar[1] === "old-topic");
  assertStore("drops non-strings", unknown.done.pelajar.length === 2);
  assertStore("drops unknown role key", unknown.done.nope === undefined);
  const badDone = parseStore(JSON.stringify({ role: "pelajar", done: "x" }));
  assertStore("bad done becomes empty", badDone.role === "pelajar" && Object.keys(badDone.done).length === 0);
  const marked = markDone(empty, "pelajar", "kata-sandi");
  assertStore("mark", marked.done.pelajar.includes("kata-sandi"));
  const again = markDone(marked, "pelajar", "kata-sandi");
  assertStore("no duplicate", again.done.pelajar.length === 1);
  const cleared = markUndone(again, "pelajar", "kata-sandi");
  assertStore("unmark", cleared.done.pelajar.length === 0);
  const chosen = chooseRole(marked, "ortu");
  assertStore("choose keeps marks", chosen.role === "ortu" && chosen.done.pelajar.includes("kata-sandi"));
  const back = clearRole(chosen);
  assertStore("clear role keeps marks", back.role === null && back.done.pelajar.includes("kata-sandi"));
  assertStore("complete", isComplete(marked, "pelajar", ["kata-sandi"]) === true);
  assertStore("extra id does not block", isComplete({ role: "pelajar", done: { pelajar: ["kata-sandi", "old"] } }, "pelajar", ["kata-sandi"]) === true);
  assertStore("missing id blocks", isComplete(marked, "pelajar", ["kata-sandi", "jejak-akun"]) === false);
  assertStore("key", STORAGE_KEY === "cek-dulu-checklist-v1");
}

checkStore();

const BASELINE = "Ini daftar minimum yang perlu kamu lakukan untuk jaga diri. Ini bukan jaminan aman dari semua serangan.";
const DONE = "Kamu selesai untuk peran ini.";
const SCRIPT_NOTE = "Tanda centang butuh skrip. Kamu tetap bisa baca setiap daftar.";

function quoted(block, key, file) {
  const match = block.match(new RegExp(`^${key}: "(.*)"$`, "m"));
  if (!match) fail(`Missing ${key} in ${file}`);
  return match ? match[1] : "";
}

function yamlList(block, key, file) {
  const match = block.match(new RegExp(`^${key}:\\n((?:  - .*(?:\\n|$))*)`, "m"));
  if (!match) fail(`Missing ${key} in ${file}`);
  const lines = [];
  for (const line of (match ? match[1] : "").split("\n")) {
    const item = line.match(/^  - "(.*)"$/);
    if (item) lines.push(item[1]);
  }
  return lines;
}

function loadTopics() {
  const dir = new URL("src/content/situations/", repo);
  const topics = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(new URL(name, dir), "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---/)[1];
    const roleBlock = fm.match(/^roles:\n((?:  - .*\n)*)/m);
    const roles = [];
    for (const line of roleBlock[1].split("\n")) {
      const item = line.match(/^  - (\w+)$/);
      if (item) roles.push(item[1]);
    }
    topics.push({
      id: name.replace(/\.md$/, ""),
      order: Number(fm.match(/^order: (\d+)$/m)[1]),
      roles,
      title: quoted(fm, "title", name),
      lead: quoted(fm, "lead", name),
      why: quoted(fm, "why", name),
      law: quoted(fm, "law", name),
      check: quoted(fm, "check", name),
      action: yamlList(fm, "action", name),
      already: yamlList(fm, "already", name),
      labels: [...fm.matchAll(/^  - label: "(.*)"$/gm)].map((match) => match[1]),
    });
  }
  return topics.sort((a, b) => a.order - b.order);
}

const topics = loadTopics();
const roleIds = ["ponsel", "uang", "penjual", "pelajar", "ortu"];
const roleSrc = readFileSync(new URL("src/data/roles.ts", repo), "utf8");
const roleTitles = [...roleSrc.matchAll(/title: "([^"]+)"/g)].map((match) => match[1]);

const home = read("index.html");
const body = home.slice(home.indexOf("<body"));
const baselineCount = body.split(BASELINE).length - 1;
if (baselineCount < 11) fail(`Baseline sentence appears ${baselineCount} times in the body.`);
if (!body.includes(DONE)) fail("Home is missing the done sentence.");
if (!body.includes(SCRIPT_NOTE)) fail("Home is missing the script note.");
if (!body.includes('role="checkbox"') || !body.includes("Saya mengerti")) {
  fail("Home is missing the checklist mark.");
}
if (body.includes('data-label-done="Belum"') || body.includes(">Sudah</button>")) {
  fail("Home still has the Sudah or Belum button.");
}
if (!body.includes("Ganti peran")) fail("Home is missing Ganti peran.");
for (const title of roleTitles) {
  if (!body.includes(title)) fail(`Home is missing role: ${title}`);
}
for (const topic of topics) {
  if (body.includes(topic.check)) fail(`Home shows a short-check question: ${topic.title}`);
}
for (const path of ["/cek-dulu/sedang-terjadi/", "/cek-dulu/lakukan-sekali/", "/cek-dulu/cek/", "/cek-dulu/peran/", "/cek-dulu/situasi/"]) {
  if (body.includes(path)) fail(`Home still links to ${path}`);
}
if (body.includes('id="wa-share"')) fail("Home still has a WhatsApp share link.");

function roleHtml(id) {
  const start = body.indexOf(`data-role-list="${id}"`);
  if (start < 0) {
    fail(`Missing role list ${id}`);
    return "";
  }
  const next = body.indexOf("data-role-list=", start + 20);
  return body.slice(start, next === -1 ? body.length : next);
}

for (const id of roleIds) {
  const section = roleHtml(id);
  const mine = topics.filter((topic) => topic.roles.includes(id));
  let cursor = 0;
  for (let index = 0; index < mine.length; index += 1) {
    const topic = mine[index];
    const at = section.indexOf(topic.title, cursor);
    if (at < 0) {
      fail(`${id} is missing ${topic.title}`);
      continue;
    }
    const nextTitle = mine[index + 1] ? section.indexOf(mine[index + 1].title, at + topic.title.length) : section.length;
    const chunk = section.slice(at, nextTitle === -1 ? section.length : nextTitle);
    cursor = at + topic.title.length;
    if (!chunk.includes(topic.lead)) fail(`${id} ${topic.id} is missing its lead`);
    if (!chunk.includes("Lakukan ini sekarang")) fail(`${id} ${topic.id} is missing the action heading`);
    for (const step of topic.action) {
      if (!chunk.includes(step)) fail(`${id} ${topic.id} is missing an action step`);
    }
    if (!chunk.includes(topic.why)) fail(`${id} ${topic.id} is missing why`);
    if (!chunk.includes(topic.law)) fail(`${id} ${topic.id} is missing law`);
    if (!chunk.includes("Kalau sudah terlanjur")) fail(`${id} ${topic.id} is missing the report heading`);
    for (const step of topic.already) {
      if (!chunk.includes(step)) fail(`${id} ${topic.id} is missing an already step`);
    }
    for (const label of topic.labels) {
      if (!chunk.includes(label)) fail(`${id} ${topic.id} is missing report label ${label}`);
    }
  }
  if (!section.includes("Ganti peran")) fail(`${id} is missing Ganti peran`);
  if (!section.includes(DONE)) fail(`${id} is missing the done sentence`);
  if (section.split(BASELINE).length - 1 < 2) fail(`${id} is missing the baseline sentence`);
}

for (const dir of ["sedang-terjadi", "lakukan-sekali", "cek", "peran", "situasi"]) {
  if (existsSync(new URL(dir, dist))) fail(`${dir} is still built`);
}

const missing = read("404.html");
if (!missing.includes("Halaman ini tidak ketemu")) fail("Missing page text is gone.");
if (!missing.includes("/cek-dulu/")) fail("Missing page does not link home.");

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

const sitemap = read("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedLocs = [
  "https://selmeny.github.io/cek-dulu/",
  "https://selmeny.github.io/cek-dulu/tentang/",
  "https://selmeny.github.io/cek-dulu/sumber/",
];
if (locs.length !== 3 || expectedLocs.some((url) => !locs.includes(url))) {
  fail(`Sitemap URLs are ${locs.join(", ")}`);
}

const files = walk("./");
const bundled = [home, ...files.map((file) => read(file))].join("\n");
const tentang = read("tentang/index.html");
if (!tentang.includes(BASELINE)) fail("Tentang is missing the baseline sentence.");
for (const oldLine of ["Sedang terjadi", "Lakukan sekali", "Cek singkat", "Menurut peran"]) {
  if (tentang.includes(oldLine)) fail(`Tentang still explains ${oldLine}.`);
}
const readme = readFileSync(new URL("README.md", repo), "utf8");
if (!readme.includes("minimum baseline")) fail("README does not call the list a minimum baseline.");
if (readme.includes("short check")) fail("README still describes the short check.");
const agents = readFileSync(new URL("AGENTS.md", repo), "utf8");
if (!agents.includes("minimum baseline")) fail("AGENTS.md does not call the list a minimum baseline.");
if (!agents.includes("Marks stay in the browser.")) fail("AGENTS.md does not keep marks on the phone.");
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
if (!css.includes("Plus Jakarta Sans") || !css.includes("Fraunces")) fail("Font pairing is missing.");
if (!css.includes(".woff2")) fail("Fonts are not self-hosted.");
if (bundled.includes("IBM Plex")) fail("IBM Plex is not part of this pairing.");
if (!css.includes("html[data-checklist]")) fail("Checklist visibility CSS is missing.");

if (process.exitCode) process.exit(process.exitCode);
console.log("Checked 5 role checklists, the source page, and the store.");

# Single-page baseline checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-section site with one home page where the reader picks a role, marks that role's existing steps, and sees a baseline limit that is not a guarantee.

**Architecture:** The home page renders every role checklist in HTML. A small pure module decides which marks are valid. A page script shows one role, writes `localStorage` key `cek-dulu-checklist-v1`, and never reads the old `cek-dulu-v1` key. `npm run check` builds the site and checks both the module and the HTML. No new test tool.

**Tech Stack:** Astro 7 static site, plain JavaScript module, existing `scripts/check-site.mjs`, browser check on `http://localhost:4321/cek-dulu/`.

**Branch:** `feat/single-page-checklist` from `origin/main`. Do not commit on `main`.

**Spec:** `docs/superpowers/specs/2026-11-23-single-page-checklist-design.md`

---

## File structure

- `src/lib/checklist.mjs` — parse, mark, clear, and complete rules. No DOM.
- `src/components/ChecklistItem.astro` — one closed topic and its open steps.
- `src/pages/index.astro` — role list, five checklists, script.
- `src/layouts/Base.astro` — site name only. No section nav.
- `src/pages/sitemap.xml.ts` — home, Tentang, Sumber.
- `src/content.config.ts` — keep the `group` enum without `functions.ts`.
- `src/lib/situations.ts` — keep `forRole`. Remove `forGroup`.
- `src/styles/global.css` — show every list until script runs. Keep the existing grid, 40rem measure, and self-hosted fonts.
- `scripts/check-site.mjs` — store tests plus the new HTML checks.
- `src/pages/tentang.astro`, `README.md`, `AGENTS.md` — describe the one checklist.
- Delete pages and components that only the old sections use.

## Task 1: Store rules

**Files:**
- Create: `src/lib/checklist.mjs`
- Modify: `scripts/check-site.mjs`

- [ ] **Step 1: Write the failing store test**

Add this import at the top of `scripts/check-site.mjs`:

```javascript
import {
  STORAGE_KEY,
  parseStore,
  markDone,
  markUndone,
  chooseRole,
  clearRole,
  isComplete,
} from "../src/lib/checklist.mjs";
```

Add this function immediately after `function fail`:

```javascript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-site.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/checklist.mjs`.

- [ ] **Step 3: Write the store module**

Create `src/lib/checklist.mjs`:

```javascript
export const STORAGE_KEY = "cek-dulu-checklist-v1";

export const ROLE_IDS = ["ponsel", "uang", "penjual", "pelajar", "ortu"];

export function emptyStore() {
  return { role: null, done: {} };
}

export function parseStore(raw, roleIds = ROLE_IDS) {
  if (typeof raw !== "string" || raw === "") return emptyStore();
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return emptyStore();
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStore();
  const done = {};
  if (value.done && typeof value.done === "object" && !Array.isArray(value.done)) {
    for (const id of roleIds) {
      const marks = value.done[id];
      if (!Array.isArray(marks)) continue;
      done[id] = marks.filter((item) => typeof item === "string");
    }
  }
  const role = roleIds.includes(value.role) ? value.role : null;
  return { role, done };
}

export function markDone(store, role, topicId) {
  const current = store.done[role] ?? [];
  const next = current.includes(topicId) ? current : [...current, topicId];
  return { role: store.role, done: { ...store.done, [role]: next } };
}

export function markUndone(store, role, topicId) {
  const current = store.done[role] ?? [];
  return {
    role: store.role,
    done: { ...store.done, [role]: current.filter((id) => id !== topicId) },
  };
}

export function chooseRole(store, role) {
  return { role, done: { ...store.done } };
}

export function clearRole(store) {
  return { role: null, done: { ...store.done } };
}

export function isComplete(store, role, topicIds) {
  const marks = new Set(store.done[role] ?? []);
  return topicIds.every((id) => marks.has(id));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run check`

Expected: the store assertions pass, and the existing page checks still pass. Exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/checklist.mjs scripts/check-site.mjs
git commit -m "Add checklist store rules."
```

## Task 2: Home checklist

**Files:**
- Create: `src/components/ChecklistItem.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/Base.astro`
- Modify: `src/pages/sitemap.xml.ts`
- Modify: `src/content.config.ts`
- Modify: `src/lib/situations.ts`
- Modify: `src/styles/global.css`
- Modify: `scripts/check-site.mjs`
- Delete: `src/pages/sedang-terjadi.astro`
- Delete: `src/pages/lakukan-sekali.astro`
- Delete: `src/pages/cek.astro`
- Delete: `src/pages/peran/index.astro`
- Delete: `src/pages/peran/[id].astro`
- Delete: `src/pages/situasi/[id].astro`
- Delete: `src/components/SituationCard.astro`
- Delete: `src/components/SituationIndex.astro`
- Delete: `src/components/ShareLink.astro`
- Delete: `src/components/Mark.astro`
- Delete: `src/data/functions.ts`

- [ ] **Step 1: Replace the page checks**

Replace `scripts/check-site.mjs` with this complete file. It keeps the store tests from Task 1.

```javascript
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
const SCRIPT_NOTE = 'Tanda "Sudah" butuh skrip. Kamu tetap bisa baca setiap daftar.';

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
if (!body.includes("Sudah") || !body.includes('data-label-done="Belum"')) fail("Home is missing Sudah and Belum.");
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
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check`

Expected: FAIL because the home page does not contain the baseline sentence. The build still succeeds.

- [ ] **Step 3: Keep the group field without the function list**

In `src/content.config.ts`, delete the `groupIds` import. Set the group field to:

```typescript
group: z.enum(["sedang", "sekali"]),
```

Replace `src/lib/situations.ts` with:

```typescript
import { getCollection, type CollectionEntry } from "astro:content";
import type { RoleId } from "../data/roles";

export type Situation = CollectionEntry<"situations">;

export async function loadSituations(): Promise<Situation[]> {
  const items = await getCollection("situations");
  return items.sort((a, b) => a.data.order - b.data.order);
}

export function forRole(items: Situation[], role: RoleId): Situation[] {
  return items.filter((item) => item.data.roles.includes(role));
}
```

Do not change topic markdown. Do not use a role's `start` array as the checklist.

- [ ] **Step 4: Add the topic component**

Create `src/components/ChecklistItem.astro`:

```astro
---
interface Report {
  label: string;
  href?: string;
  note: string;
}

interface Props {
  item: {
    id: string;
    data: {
      title: string;
      lead: string;
      action: string[];
      why: string;
      law: string;
      already: string[];
      report: Report[];
    };
  };
}

const { item } = Astro.props;
const { title, lead, action, why, law, already, report } = item.data;
---

<details data-topic={item.id}>
  <summary>
    <span>{title}</span>
    <span data-done-flag hidden>Sudah</span>
  </summary>
  <p>{lead}</p>
  <h3>Lakukan ini sekarang</h3>
  <ul>
    {action.map((step) => <li>{step}</li>)}
  </ul>
  <p>{why}</p>
  <p>{law}</p>
  <h3>Kalau sudah terlanjur</h3>
  <ul>
    {already.map((step) => <li>{step}</li>)}
  </ul>
  <ul>
    {
      report.map((entry) => (
        <li>
          {entry.href ? <a href={entry.href}>{entry.label}</a> : <strong>{entry.label}</strong>}
          <span>{entry.note}</span>
        </li>
      ))
    }
  </ul>
  <button type="button" data-mark data-label-open="Sudah" data-label-done="Belum">Sudah</button>
</details>
```

The button is outside `summary`, so a click does not open or close the item. More than one `details` may stay open. Do not set the `open` attribute from script.

- [ ] **Step 5: Replace the home page**

Replace `src/pages/index.astro` with:

```astro
---
import Base from "../layouts/Base.astro";
import ChecklistItem from "../components/ChecklistItem.astro";
import { roles } from "../data/roles";
import { forRole, loadSituations } from "../lib/situations";

const situations = await loadSituations();
const baseline = "Ini daftar minimum yang perlu kamu lakukan untuk jaga diri. Ini bukan jaminan aman dari semua serangan.";
const doneLine = "Kamu selesai untuk peran ini.";
---

<Base title="Cek Dulu" description={baseline}>
  <div data-checklist-root>
    <section data-role-picker>
      <h1>Kamu yang mana hari ini?</h1>
      <p class="lead">{baseline}</p>
      <ul class="role-grid">
        {
          roles.map((role) => (
            <li>
              <button type="button" class="role-card" data-choose-role={role.id}>
                <strong>{role.title}</strong>
                <span>{role.line}</span>
              </button>
            </li>
          ))
        }
      </ul>
    </section>
    {
      roles.map((role) => (
        <section data-role-list={role.id} aria-labelledby={`role-${role.id}`}>
          <h2 id={`role-${role.id}`}>{role.title}</h2>
          <p class="lead">{baseline}</p>
          <button type="button" data-role-switch>Ganti peran</button>
          {forRole(situations, role.id).map((item) => (
            <ChecklistItem item={item} />
          ))}
          <div class="done-line" data-done-line>
            <p>{doneLine}</p>
            <p>{baseline}</p>
          </div>
        </section>
      ))
    }
    <noscript>
      <p>Tanda "Sudah" butuh skrip. Kamu tetap bisa baca setiap daftar.</p>
    </noscript>
  </div>
  <script>
    import {
      STORAGE_KEY,
      parseStore,
      markDone,
      markUndone,
      chooseRole,
      clearRole,
      isComplete,
    } from "../lib/checklist.mjs";

    const root = document.querySelector("[data-checklist-root]");
    const picker = document.querySelector("[data-role-picker]");
    const lists = [...document.querySelectorAll("[data-role-list]")];
    const choosers = picker ? [...picker.querySelectorAll("[data-choose-role]")] : [];

    function ready() {
      if (!root || !picker || lists.length !== 5 || choosers.length !== 5) return false;
      for (const list of lists) {
        const topics = [...list.querySelectorAll("[data-topic]")];
        if (topics.length < 1) return false;
        if (!list.querySelector("[data-role-switch]")) return false;
        if (!list.querySelector("[data-done-line]")) return false;
        for (const topic of topics) {
          if (!topic.querySelector("[data-mark]")) return false;
          if (!topic.querySelector("[data-done-flag]")) return false;
        }
      }
      return true;
    }

    if (ready()) {
      document.documentElement.dataset.checklist = "on";

      function readRaw() {
        try {
          return localStorage.getItem(STORAGE_KEY);
        } catch {
          return null;
        }
      }

      function writeStore(value) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch {
          /* Private mode can block storage. The mark still shows for this visit. */
        }
      }

      let store = parseStore(readRaw());

      function apply(next) {
        store = next;
        for (const list of lists) {
          const role = list.dataset.roleList;
          const topics = [...list.querySelectorAll("[data-topic]")];
          const ids = topics.map((topic) => topic.dataset.topic);
          const marks = new Set(store.done[role] ?? []);
          for (const topic of topics) {
            const done = marks.has(topic.dataset.topic);
            const flag = topic.querySelector("[data-done-flag]");
            flag.hidden = !done;
            const button = topic.querySelector("[data-mark]");
            button.textContent = done ? button.dataset.labelDone : button.dataset.labelOpen;
          }
          list.querySelector("[data-done-line]").classList.toggle("is-shown", isComplete(store, role, ids));
          list.classList.toggle("is-shown", store.role === role);
        }
        picker.classList.toggle("is-shown", store.role === null);
      }

      for (const button of choosers) {
        button.addEventListener("click", () => {
          const next = chooseRole(store, button.dataset.chooseRole);
          writeStore(next);
          apply(next);
        });
      }

      for (const list of lists) {
        list.querySelector("[data-role-switch]").addEventListener("click", () => {
          const next = clearRole(store);
          writeStore(next);
          apply(next);
        });
        for (const button of list.querySelectorAll("[data-mark]")) {
          button.addEventListener("click", () => {
            const role = list.dataset.roleList;
            const topic = button.closest("[data-topic]").dataset.topic;
            const done = (store.done[role] ?? []).includes(topic);
            const next = done ? markUndone(store, role, topic) : markDone(store, role, topic);
            writeStore(next);
            apply(next);
          });
        }
      }

      apply(store);
    }
  </script>
</Base>
```

Do not read `cek-dulu-v1`. Do not call `fetch`. If `ready()` is false, the script returns before it sets `data-checklist`.

- [ ] **Step 6: Add the visibility CSS**

Append this to `src/styles/global.css`. Do not delete the `1fr` grid, the `72rem` four-column rule, the `40rem` measure, or the font faces.

```css
button.role-card {
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

html[data-checklist] [data-role-picker],
html[data-checklist] [data-role-list] {
  display: none;
}

html[data-checklist] [data-role-picker].is-shown,
html[data-checklist] [data-role-list].is-shown {
  display: block;
}

.done-line {
  display: none;
}

html[data-checklist] .done-line.is-shown {
  display: block;
}

details[data-topic] {
  margin: 0.75rem 0;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 0.9rem 1rem;
}

details[data-topic] summary {
  cursor: pointer;
  font-weight: 750;
}

[data-mark],
[data-role-switch] {
  min-height: 44px;
  margin-top: 0.75rem;
}
```

The hide rule is stronger than a plain `.is-shown` class, so the shown state repeats the attribute selector.

- [ ] **Step 7: Remove the old navigation**

Replace the header in `src/layouts/Base.astro` so the props and the bar are:

```astro
---
import { href } from "../lib/href";
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const pageTitle = title === "Cek Dulu" ? title : `${title} — Cek Dulu`;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
```

```astro
      <div class="shell bar">
        <a class="brand" href={href("/")}>Cek Dulu</a>
      </div>
```

Delete the `doors` import and the `<nav>`. Keep the footer text and the Sumber and Tentang links.

Replace `src/pages/sitemap.xml.ts` with:

```typescript
import type { APIRoute } from "astro";
import { href } from "../lib/href";

export const GET: APIRoute = async () => {
  const paths = ["/", "/tentang", "/sumber"];
  const origin = import.meta.env.SITE ?? "https://selmeny.github.io";
  const urls = paths
    .map((path) => {
      const loc = new URL(href(path), origin).href;
      return `<url><loc>${loc}</loc></url>`;
    })
    .join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
```

- [ ] **Step 8: Delete the old pages and components**

```bash
git rm src/pages/sedang-terjadi.astro src/pages/lakukan-sekali.astro src/pages/cek.astro src/pages/peran/index.astro src/pages/peran/\[id\].astro src/pages/situasi/\[id\].astro src/components/SituationCard.astro src/components/SituationIndex.astro src/components/ShareLink.astro src/components/Mark.astro src/data/functions.ts
```

- [ ] **Step 9: Run the check to verify it passes**

Run: `npm run check`

Expected: exit 0 and `Checked 5 role checklists, the source page, and the store.`

- [ ] **Step 10: Commit**

```bash
git add -u src scripts
git add src/components/ChecklistItem.astro src/pages/index.astro src/lib/situations.ts src/content.config.ts src/layouts/Base.astro src/pages/sitemap.xml.ts src/styles/global.css scripts/check-site.mjs
git commit -m "Replace the home page with the role checklist."
```

## Task 3: Describe the one checklist

**Files:**
- Modify: `scripts/check-site.mjs`
- Modify: `src/pages/tentang.astro`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write the failing copy check**

Insert this before the tracker check in `scripts/check-site.mjs`:

```javascript
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
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check`

Expected: FAIL with `Tentang is missing the baseline sentence.`

- [ ] **Step 3: Rewrite the copy**

Replace the prose in `src/pages/tentang.astro` with:

```astro
<Base
  title="Tentang"
  description="Daftar minimum untuk satu peran. Bukan jaminan aman dari semua serangan."
>
  <div class="prose">
  <h1>Tentang situs ini</h1>
  <p class="lead">
    Cek Dulu dibuat supaya orang yang bukan kerja di bidang IT bisa lakukan daftar minimum untuk jaga diri.
  </p>
  <p>
    Halaman depan minta kamu pilih satu peran. Contohnya pelajar, orang tua, atau orang yang pegang uang digital.
  </p>
  <p>
    Kamu buka satu baris, baca langkahnya, lalu tekan Sudah kalau langkah itu sudah kamu lakukan. Tanda itu tinggal di ponsel ini.
  </p>
  <p>
    Ini daftar minimum yang perlu kamu lakukan untuk jaga diri. Ini bukan jaminan aman dari semua serangan.
  </p>
  <p>
    Situs ini berdiri sendiri. Situs ini bukan Badan Siber dan Sandi Negara, bukan Kementerian Komunikasi dan Digital, dan bukan Otoritas Jasa Keuangan.
  </p>
  <p>
    Info di sini umum. Ini bukan nasihat hukum untuk kasus kamu. Dasar tiap langkah ada di <a href={href("/sumber")}>halaman sumber</a>.
  </p>
  </div>
</Base>
```

Replace `README.md` with:

```markdown
# Cek Dulu

Static site in Bahasa Indonesia. A person who is not an IT worker picks one role and marks the minimum baseline for that role.

The list is not a guarantee against every attack. Marks stay in the browser.

## Commands

```sh
npm install
npm run dev
npm run check
```

`npm run check` builds the site and checks the role checklists, the source links, and the store rules.

## Publish

GitHub Pages serves the site from `main` at `https://selmeny.github.io/cek-dulu/`.

The site does not use an account, a stored form, or third-party analytics.
```

Replace the Product section of `AGENTS.md` with:

```markdown
## Product

Cek Dulu is a static Bahasa Indonesia site. The home page asks the reader to pick one role and shows that role's checklist. The checklist is the minimum baseline for the role. It is not a guarantee against every attack. Each open item starts with the action. NIST, ISO, and Indonesian law notes stay under that action. Marks stay in the browser. Do not add accounts, stored forms, or third-party analytics.
```

Leave the Development and Documentation sections unchanged.

- [ ] **Step 4: Run the check to verify it passes**

Run: `npm run check`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-site.mjs src/pages/tentang.astro README.md AGENTS.md
git commit -m "Describe the checklist as a minimum baseline."
```

## Task 4: Browser check

**Files:** none unless a check fails.

- [ ] **Step 1: Start the site**

Run: `npx astro dev --background`

Open `http://localhost:4321/cek-dulu/`.

- [ ] **Step 2: Exercise the student list**

Confirm these behaviors:

- The baseline sentence is visible above the five roles.
- Tap "Pelajar atau mahasiswa". The five student topics show, in this order: "Ada yang minta kode WhatsApp", "Link hadiah, paket, atau tagihan", "Kamu simpan data orang lain", "Kata sandi akun penting", "Akun sekolah dan yang orang lain lihat". The other role lists stay hidden. The baseline sentence stays visible.
- Open one item. The steps under "Lakukan ini sekarang" are readable. Open a second item. The first stays open.
- Tap "Sudah". Reload. The mark is still there, and the closed row shows "Sudah".
- Tap "Belum". Reload. The mark is gone.
- Mark every student topic "Sudah". The page shows "Kamu selesai untuk peran ini." The baseline sentence stays beside it. The five topics stay on the page.
- Tap "Ganti peran". The role list returns. Tap "Pelajar atau mahasiswa" again. The five marks remain.
- In the console, run `localStorage.setItem("cek-dulu-checklist-v1", "{")` and reload. The role list shows, and the page still renders.
- Sumber and Tentang still open from the footer. An old path such as `http://localhost:4321/cek-dulu/cek/` shows "Halaman ini tidak ketemu".

- [ ] **Step 3: Check script off**

Disable JavaScript and reload the home page. Every role checklist is readable. The script note is visible. The done sentence is not visible. Enable JavaScript again.

If the browser tool cannot disable JavaScript, say so. The HTML check already requires every list and the `<noscript>` note in the built page.

- [ ] **Step 4: Stop the server and commit any fix**

Run: `npx astro dev stop`

If a behavior failed, fix it and run `npm run check` again. Commit the fix:

```bash
git add src scripts
git commit -m "Fix the checklist behavior found in the browser."
```

If nothing failed, do not create an empty commit.

## Task 5: Land the branch

- [ ] **Step 1: Push and open the pull request**

```bash
git push -u origin feat/single-page-checklist
gh pr create --base main --head feat/single-page-checklist --title "Replace the home page with one role checklist" --body-file /tmp/cek-dulu-pr.txt
```

The pull request body states that `npm run check` passed and lists the browser behaviors that were exercised. This is not a bug fix. Do not open an issue. Do not put `Fixes #` in the body.

- [ ] **Step 2: Merge**

```bash
gh pr merge --rebase
git switch main
git pull --ff-only origin main
```

Do not merge while `npm run check` is failing.

## Spec coverage

- Role picker, change role, and per-role marks: Tasks 1 and 2.
- Existing topics in `order`, not the `start` array: Task 2 uses `forRole`.
- Open item order, law under the steps, report path: `ChecklistItem.astro`.
- Baseline sentence in the three places, and the modest done sentence: Task 2.
- `cek-dulu-checklist-v1`, ignore `cek-dulu-v1`: Task 1 and the page script.
- Unreadable storage, blocked write, missing nodes, script off: Task 1, the `ready()` guard, and the CSS.
- Old paths 404, sitemap has three URLs: Task 2.
- Tentang, README, and AGENTS.md: Task 3.
- Browser behaviors: Task 4.
- No new test tool, no account, no analytics, no topic-field deletion: no task adds those.

# Single-page baseline checklist

Date: 2026-11-23

## Problem

A reader who knows nothing about security opens Cek Dulu and faces four sections. The reader has to choose a kind of page before choosing a role.

The site becomes one page with one job. The reader picks a role, works that role's existing steps, and marks each step done. The list is the minimum baseline for that role. It is not a guarantee against every attack.

## Decisions

- The reader marks a step done. The page does not test the reader and does not open the reader's accounts.
- The first screen shows the five existing roles. The reader taps one. "Ganti peran" returns to that list.
- A role's checklist is every existing topic whose `roles` field includes that role, sorted by the topic `order` field. The `start` array on a role is not the checklist.
- The open topic shows the text that already exists. No new security steps are written.
- When every topic for the open role is marked done, the page says the reader is done for that role. The baseline limit stays visible.
- Sumber and Tentang stay as footer links. The four old sections, the role pages, and the topic pages go away.
- Marks stay on the phone. The site still has no account, no stored form, and no third-party analytics.

## Exact sentences

Baseline sentence, used everywhere this spec says "the baseline sentence":

> Ini daftar minimum yang perlu kamu lakukan untuk jaga diri. Ini bukan jaminan aman dari semua serangan.

Done sentence:

> Kamu selesai untuk peran ini.

Script note:

> Tanda "Sudah" butuh skrip. Kamu tetap bisa baca setiap daftar.

## Current checklists

The page derives these lists from topic frontmatter. This is the set at the time of this spec, sorted by `order`.

| Role id | Topics in order |
| --- | --- |
| ponsel | kode-whatsapp, nomor-keluarga, tautan-hadiah, kata-sandi |
| uang | kode-whatsapp, tautan-hadiah, transfer-mendesak, belanja-daring, kata-sandi |
| penjual | belanja-daring, data-orang-lain, kata-sandi |
| pelajar | kode-whatsapp, tautan-hadiah, data-orang-lain, kata-sandi, jejak-akun |
| ortu | kode-whatsapp, nomor-keluarga, kata-sandi, jejak-akun |

## Page

The header shows the site name only. It does not link to Sedang terjadi, Lakukan sekali, Cek singkat, or Menurut peran.

The footer keeps the current general-information line, plus links to Sumber and Tentang.

The home page has six parts.

1. **Limit note.** The baseline sentence appears above the role list, at the top of each role checklist, and beside that checklist's done line.
2. **Role list.** Each role shows its `title` and `line` from `src/data/roles.ts`. This list is the first choice on the page. While a checklist is shown, the role list and the baseline sentence above it are hidden. "Ganti peran" shows them again.
3. **Checklist.** One block per role. The block contains that role's topics in `order`.
4. **Checklist item.** A closed item shows the topic title. When the topic is done, the closed item also shows the word "Sudah". An open item shows, from top to bottom:
   - `lead`
   - the `action` steps, under the heading "Lakukan ini sekarang"
   - `why`
   - `law`
   - the heading "Kalau sudah terlanjur", then the `already` steps and the `report` links
   - a button labeled "Sudah" when the topic is not done, or "Belum" when it is done
5. **Done line.** The done sentence. It is shown only when every current topic id for the open role is marked done. The baseline sentence stays beside it. The checklist stays on the page so the reader can mark an item "Belum".
6. **Role switch.** The button "Ganti peran" is on the checklist view. It returns to the role list.

The short-check `check` sentence is not shown. The `group` field stays in the topic files and is not used by this page. Topic markdown stays.

Opening one item does not close the others. A reload closes every item. The page does not store which items are open.

## Data

The HTML contains every role checklist. Script shows one checklist at a time.

Storage key: `cek-dulu-checklist-v1`. The old key `cek-dulu-v1` is ignored. Old short-check answers are not migrated.

Stored value:

```json
{
  "role": "pelajar",
  "done": {
    "pelajar": ["kata-sandi"]
  }
}
```

`role` is a role id or `null`. `done` maps a role id to topic ids. A missing key means `{ "role": null, "done": {} }`.

1. On load, the script reads storage. `role: null` shows the role list. A saved role shows that checklist and its marks.
2. Choosing a role saves `role` and shows that list. Other roles' marks stay.
3. "Sudah" adds that topic id to `done[role]` and saves.
4. "Belum" removes that topic id and saves.
5. The done line appears when every current topic id for the open role is in `done[role]`. Extra ids do not count, and they do not block the done line.
6. "Ganti peran" sets `role` to `null`. It does not change `done`.

## Failures

**Unreadable storage.** Invalid JSON, a non-object value, or a `role` that is not a current role id shows the role list. Valid `done` entries for known roles are kept. A `done` value that is not an object is replaced with `{}`. Unknown topic ids inside a valid array are kept and do not count.

**Storage refuses the write.** The button still changes for this visit. The next visit does not have that mark. The script shows no error dialog.

**Script is off.** CSS shows every checklist under its role name until script runs. The role buttons do not filter the lists. The baseline sentence is visible. Done lines stay hidden. "Sudah" and "Belum" do nothing. The script note is inside `<noscript>`, so it is visible only when script is off. The HTML check still finds that note in the page source.

**Script finds a broken page.** If a required list or button is missing, the script returns before it hides any checklist. It does not throw, and it does not clear the page.

**Old links.** These paths are not built, under the site base `/cek-dulu/`: `/sedang-terjadi/`, `/lakukan-sekali/`, `/cek/`, `/peran/`, `/peran/<id>/`, and `/situasi/<id>/`. The build output does not contain those directories. A request for one of them shows the existing missing page, which links to the home page. The site does not open a topic from an old URL. The sitemap contains exactly three URLs: the home page, Tentang, and Sumber, each with the site base `/cek-dulu/`.

## Pages and copy that change

- Replace the home page with the checklist.
- Remove the four section pages, `src/pages/cek.astro`, `src/pages/peran/`, and `src/pages/situasi/`.
- Remove components that only those pages use.
- Remove `src/data/functions.ts` when the header no longer uses it.
- Keep `src/pages/sumber.astro`, `src/pages/404.astro`, the topic files, `roles.ts`, and `sources.ts`.
- Rewrite Tentang so it describes this one checklist, the baseline limit, and marks that stay on the phone. Remove the four-function explanation.
- Update `README.md` and the Product section of `AGENTS.md` to describe the same product. Law notes stay under the steps inside the open item.

## Checks

`npm run check` stays the automated check. It builds the site and runs `scripts/check-site.mjs`. Do not add a new test tool.

The HTML check must find all of these:

- The baseline sentence, the five role titles, "Sudah", "Belum", "Ganti peran", the done sentence, and the script note on the home page.
- Each role block contains the topic titles in the table above, and each topic contains its `action` steps, `why`, `law`, and "Kalau sudah terlanjur".
- Sumber and Tentang still exist.
- The built output has none of the removed paths.
- The missing-page text still exists.
- The sitemap contains exactly three URLs: the home page, Tentang, and Sumber. Each URL includes the site base `/cek-dulu/`.

The implementer also checks the browser. These behaviors are not a second automated runner:

- Tap "Pelajar atau mahasiswa". The five student topics show. The other lists stay hidden. The baseline sentence stays visible.
- Open one item. The steps are readable.
- Tap "Sudah", reload, and the mark remains. Tap "Belum", reload, and the mark is gone.
- Mark every student topic "Sudah". The done sentence shows, and the baseline sentence stays beside it.
- Tap "Ganti peran", then tap the student role again. The marks remain.
- A broken storage value shows the role list, and the page still renders.
- With script off, every checklist is readable.

## Out of scope

- New security steps, a score, or a certificate.
- An account, a server save, or analytics.
- Migrating `cek-dulu-v1` answers.
- Opening the matching topic from an old shared URL.
- Removing the unused `group` or `check` fields from topic files.

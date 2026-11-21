import type { APIRoute } from "astro";
import { doors } from "../data/functions";
import { roles } from "../data/roles";
import { href } from "../lib/href";
import { loadSituations } from "../lib/situations";

export const GET: APIRoute = async () => {
  const situations = await loadSituations();
  const paths = [
    "/",
    "/tentang",
    "/sumber",
    ...doors.map((door) => door.href),
    ...situations.map((item) => `/situasi/${item.id}`),
    ...roles.map((role) => `/peran/${role.id}`),
  ];
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

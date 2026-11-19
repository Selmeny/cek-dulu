/** Build a site path that keeps the Astro `base` prefix. */
export function href(path = "/"): string {
  const base = import.meta.env.BASE_URL;
  if (path === "/" || path === "") {
    return base;
  }
  const clean = path.replace(/^\//, "");
  if (/\.[a-z0-9]+$/i.test(clean)) {
    return `${base}${clean}`;
  }
  return `${base}${clean.replace(/\/$/, "")}/`;
}

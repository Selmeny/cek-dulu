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

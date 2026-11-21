import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { groupIds } from "./data/functions";
import { sourceIds } from "./data/sources";

const role = z.enum(["ponsel", "uang", "penjual", "pelajar", "ortu"]);

const situations = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/situations",
  }),
  schema: z.object({
    title: z.string().min(8),
    lead: z.string().min(20),
    order: z.number().int().min(1),
    group: z.enum(groupIds),
    roles: z.array(role).min(1),
    action: z.array(z.string().min(8)).min(1).max(6),
    why: z.string().min(20),
    already: z.array(z.string().min(8)).min(1),
    report: z
      .array(
        z.object({
          label: z.string().min(3),
          href: z.url().optional(),
          note: z.string().min(8),
        }),
      )
      .min(1),
    sources: z
      .array(z.string())
      .min(1)
      .refine((ids) => ids.every((id) => sourceIds.includes(id)), {
        message: "Unknown source id",
      }),
    check: z.string().min(10),
    law: z.string().min(20),
  }),
});

export const collections = { situations };

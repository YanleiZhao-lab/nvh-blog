import { defineCollection, z } from "astro:content";

const contentItem = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()),
    status: z.enum(["可发布", "准备中", "规划中", "后续接入"]),
    author: z.string(),
    discussionUrl: z.string().optional()
  })
});

export const collections = {
  blog: contentItem,
  channel: contentItem,
  docs: contentItem
};

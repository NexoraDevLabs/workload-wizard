import { defineField, defineType } from "sanity";

export const authorType = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Alt text", type: "string" }],
    }),
    defineField({
      name: "bio",
      title: "Short bio",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "social",
      title: "Social links",
      type: "object",
      fields: [
        { name: "twitter", title: "X/Twitter", type: "url" },
        { name: "linkedin", title: "LinkedIn", type: "url" },
        { name: "website", title: "Website", type: "url" },
      ],
    }),
  ],
  preview: {
    select: { title: "name", media: "avatar" },
  },
});

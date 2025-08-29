import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    // Core
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(10).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'datetime',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),

    // Media
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (r) => r.required(),
        },
        { name: 'caption', title: 'Caption', type: 'string' },
      ],
      validation: (rule) => rule.required(),
    }),

    // Content
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Used in previews, SEO, and social cards',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (r) => r.required(),
            },
          ],
        },
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Code block',
          fields: [
            { name: 'language', title: 'Language', type: 'string' },
            { name: 'code', title: 'Code', type: 'text' },
          ],
        },
      ],
    }),

    // Relationships
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),

    // SEO object
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),

    // UX helpers
    defineField({
      name: 'readingTime',
      title: 'Estimated reading time (mins)',
      type: 'number',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      media: 'coverImage',
      date: 'publishedAt',
    },
    prepare({ title, media, date }) {
      return {
        title,
        subtitle: date ? new Date(date).toLocaleDateString() : 'Draft',
        media,
      };
    },
  },
});

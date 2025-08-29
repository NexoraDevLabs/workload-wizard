import { defineField, defineType } from 'sanity';

export const seoObject = defineType({
  name: 'seo',
  title: 'SEO & Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: '50–60 chars recommended',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: '150–160 chars recommended',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'openGraphImage',
      title: 'Open Graph image',
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
      description: 'Used for social sharing previews',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'If cross-posted elsewhere',
    }),
    defineField({
      name: 'noIndex',
      title: 'No index',
      type: 'boolean',
      description: 'If true, ask front-end to set robots noindex.',
      initialValue: false,
    }),
  ],
});

import { type SchemaTypeDefinition } from 'sanity';
import { post } from './post';
import { authorType } from './author';
import { categoryType } from './category';
import { seoObject } from './objects/seo';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [post, authorType, categoryType, seoObject],
};

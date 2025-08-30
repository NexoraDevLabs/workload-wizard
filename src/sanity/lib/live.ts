// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from 'next-sanity';
import { client } from './client';
import type { SanityClient } from 'next-sanity';

const liveConfig = defineLive({
  client: client as SanityClient,
});

export const { sanityFetch, SanityLive } = liveConfig;

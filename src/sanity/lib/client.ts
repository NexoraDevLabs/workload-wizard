import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId, sanityEnabled } from '../env';

// Define proper types for the mock client
interface MockSanityClient {
  fetch: () => Promise<never[]>;
}

export const client = sanityEnabled
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  : ({
      fetch: async (): Promise<never[]> => {
        return [];
      },
    } as MockSanityClient);

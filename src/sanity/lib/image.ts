import createImageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

import { dataset, projectId, sanityEnabled } from '../env';

// Define proper types for the mock image builder
interface MockImageBuilder {
  width: () => MockImageBuilder;
  height: () => MockImageBuilder;
  fit: () => MockImageBuilder;
  url: () => string;
}

// https://www.sanity.io/docs/image-url
const builder = sanityEnabled
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export const urlFor = (source: SanityImageSource) => {
  if (!builder) {
    const mockBuilder: MockImageBuilder = {
      width: () => mockBuilder,
      height: () => mockBuilder,
      fit: () => mockBuilder,
      url: () => '',
    };
    return mockBuilder;
  }
  return builder.image(source);
};

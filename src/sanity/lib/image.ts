import createImageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, projectId, sanityEnabled } from "../env";

// https://www.sanity.io/docs/image-url
const builder = sanityEnabled
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export const urlFor = (source: SanityImageSource) => {
  if (!builder) {
    return {
      width: () => ({ height: () => ({ fit: () => ({ url: () => "" }) }) }),
      height: () => ({ fit: () => ({ url: () => "" }) }),
      fit: () => ({ url: () => "" }),
      url: () => "",
    } as any;
  }
  return builder.image(source);
};

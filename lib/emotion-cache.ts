import createCache from "@emotion/cache";

// Create emotion cache for MUI
export default function createEmotionCache() {
  return createCache({ key: "css", prepend: true });
}


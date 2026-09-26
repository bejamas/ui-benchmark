// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  build: {
    inlineStylesheets: process.env.BENCHMARK_INLINE_CSS === '1' ? 'always' : 'auto',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});

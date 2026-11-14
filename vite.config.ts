import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const single = process.env.SINGLE_FILE === '1';

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /<repo>/
  base: './',
  // SINGLE_FILE=1 inlines JS, CSS and fonts into one index.html that opens via file://
  plugins: single ? [viteSingleFile()] : [],
  build: single
    ? { outDir: 'dist-single', assetsInlineLimit: 100_000_000, cssCodeSplit: false }
    : {},
});

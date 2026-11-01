import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../../static/cad-review',
    emptyOutDir: true,
    sourcemap: false
  }
});

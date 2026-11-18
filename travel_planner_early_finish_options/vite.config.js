import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: false,
    build: {
    outDir: 'www',
    emptyOutDir: true,
    assetsInlineLimit: 0
}
});
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',
    build: {
        outDir: 'dist',
        target: 'es2017',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/phaser')) return 'phaser';
                }
            }
        }
    }
});
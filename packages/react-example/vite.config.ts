import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const workspacePackage = (name: string) => fileURLToPath(new URL(`../${name}/src/index.ts${name === 'react' ? 'x' : ''}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');

          if (normalizedId.includes('/node_modules/three/')) {
            return 'three';
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: '@shezw/cube3d/core', replacement: workspacePackage('core') },
      { find: '@shezw/cube3d', replacement: workspacePackage('react') },
    ],
  },
  test: {
    exclude: ['test/browser/**', 'node_modules/**', 'dist/**'],
  },
});

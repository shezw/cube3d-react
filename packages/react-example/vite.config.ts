import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const workspacePackage = (name: string) => fileURLToPath(new URL(`../${name}/src/index.ts${name === 'react' ? 'x' : ''}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cube3d/core': workspacePackage('core'),
      '@cube3d/css-renderer': workspacePackage('css-renderer'),
      '@cube3d/react': workspacePackage('react'),
    },
  },
});

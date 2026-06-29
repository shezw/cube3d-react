/*
    Cube3D React
    packages/react/vite.config.ts

    @link    : https://shezw.com
    @author  : shezw
    @email   : hello@shezw.com
*/

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const workspacePackage = (name: string) => fileURLToPath(new URL(`../${name}/src/index.ts${name === 'react' ? 'x' : ''}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@cube3d/core': workspacePackage('core'),
      '@cube3d/css-renderer': workspacePackage('css-renderer'),
    },
  },
});

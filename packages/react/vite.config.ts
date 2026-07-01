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
    alias: [
      { find: '@shezw/cube3d/core', replacement: workspacePackage('core') },
      { find: '@shezw/cube3d', replacement: workspacePackage('react') },
    ],
  },
});

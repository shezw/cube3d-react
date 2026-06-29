/*
    cube3d-react
    packages/react/vite.config.ts    2026-06-29

    @link    : local
    @author  : Codex
    @email   : local
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

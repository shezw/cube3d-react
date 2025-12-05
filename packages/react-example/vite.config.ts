import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cube3d/css-renderer': '/Volumes/disk-ultra/dev/react/cube3d-react/cube3d/react-lib/packages/css-renderer/src/index.ts',
      '@cube3d/react': '/Volumes/disk-ultra/dev/react/cube3d-react/cube3d/react-lib/packages/react/dist/index.js'
    }
  }
});

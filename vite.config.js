import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function copyRuntimeConfig() {
  return {
    name: 'copy-runtime-config',
    closeBundle() {
      const source = resolve(__dirname, 'config.js');
      const target = resolve(__dirname, 'dist', 'config.js');

      if (existsSync(source)) {
        copyFileSync(source, target);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyRuntimeConfig()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  }
});

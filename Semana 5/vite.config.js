import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pages = process.env.GITHUB_PAGES === 'true';
const repo = process.env.GITHUB_REPOSITORY?.split('/').at(-1) || 'SoarLodge';

export default defineConfig({
  plugins: [react()],
  // En local se mantiene el mismo host y puertos. En Pages, recursos bajo /SoarLodge/.
  base: pages ? `/${repo}/` : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4174', changeOrigin: true },
      '/graphql': { target: 'http://127.0.0.1:4174', changeOrigin: true },
    },
  },
});

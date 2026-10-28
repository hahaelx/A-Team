import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // 本機開發時把 /api 轉到已部署的預覽環境：VITE_API_PROXY=https://xxxx.cloudfront.net npm run dev
    proxy: process.env.VITE_API_PROXY ? { '/api': { target: process.env.VITE_API_PROXY, changeOrigin: true } } : undefined,
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});

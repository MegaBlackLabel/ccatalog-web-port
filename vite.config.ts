/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @megablacklabel/react98retro は GitHub Packages (`@megablacklabel:registry`) から
// 普通の依存として入れる。認証は環境ごとに用意する (`.npmrc` のコメント参照)。
export default defineConfig({
  plugins: [react()],
  resolve: {
    // ライブラリが別の React を掴むとフックが二重になって落ちるので 1 コピーに固定する。
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 5173 },
  // 依存の事前バンドルは index.html から辿る。既定の `**/*.html` だと `tmp/` に置いた
  // 使い捨てのブラウザ プロファイル (拡張の html) まで拾ってスキャンが失敗する。
  optimizeDeps: { entries: ['index.html'] },
  // 98.css の `@media (not(hover))` はライブラリ 0.2.4 で `@media not (hover)` に正規化され、
  // Vite 既定の lightningcss で弾かれなくなったため cssMinify の上書きは不要。
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});

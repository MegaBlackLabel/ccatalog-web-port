/// <reference types="vitest/config" />
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

// @megablacklabel/react98retro (https://github.com/MegaBlackLabel/react98retro) は
// node_modules ではなくローカルの作業ツリーから直接読む (file:/link: 依存は Windows で
// ツリー全体のコピー/リンクに失敗するため)。ライブラリは開発中で dist が
// アプリ用ビルドに置き換わっていることがあるので、
//   dist のライブラリバンドルがあればそれを使い、無ければ src を直接コンパイルする。
//
// CI (GitHub Actions) にはローカルツリーが無いので、その場合は vendor/react98retro
// (tools/sync-vendor-lib.mjs が作る dist の固定コピー) を使う。
const localLibRoot = resolve(root, '../../react/react98retro');
const libRoot = existsSync(localLibRoot) ? localLibRoot : join(root, 'vendor', 'react98retro');
const libDist = join(libRoot, 'dist');
const hasLibBuild = existsSync(join(libDist, 'react98retro.js'));

const libEntry = hasLibBuild ? join(libDist, 'react98retro.js') : join(libRoot, 'src', 'index.ts');
const libCss = hasLibBuild
  ? join(libDist, existsSync(join(libDist, 'style.css')) ? 'style.css' : 'react98retro.css')
  : join(libRoot, 'node_modules', '98.css', 'dist', '98.css');

// ライブラリのビルドは 98.css のセレクタを `.win98` 配下にスコープする。
// src から直接コンパイルするときは同じ変換をこちらで適用する。
const libPostcss = {
  postcss: {
    plugins: [
      prefixSelector({
        prefix: '.win98',
        transform(_prefix: string, selector: string, prefixedSelector: string, filePath?: string) {
          if (!filePath?.includes('98.css')) return selector;
          if ([':root', 'html', 'body'].includes(selector)) return selector;
          return prefixedSelector;
        },
      }),
    ],
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The library may be compiled from source outside this project, so its bare
    // `react` import would otherwise resolve to its own node_modules/react
    // (two React copies -> hook crash).
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^@megablacklabel\/react98retro$/, replacement: libEntry },
      { find: /^@megablacklabel\/react98retro\/style\.css$/, replacement: libCss },
    ],
  },
  css: hasLibBuild ? undefined : libPostcss,
  server: { port: 5173, fs: { allow: [root, libRoot] } },
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

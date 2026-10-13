#!/usr/bin/env node
/**
 * react98retro のビルド済み dist を vendor/react98retro/dist に固定コピーする。
 *
 * このアプリはライブラリをローカルの作業ツリー (../../react/react98retro) から
 * vite alias / tsconfig paths で直接読む。ただし GitHub Actions にはそのツリーが無いので、
 * ビルド用の固定コピーを vendor/ に置いて CI からはそちらを使う
 * (vite.config.ts のフォールバックを参照)。
 *
 * ライブラリの dist を作り直したら:
 *   cd ../../react/react98retro && mise exec -- bun run build:lib
 *   cd - && mise exec -- bun run sync:lib
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = process.env.REACT98RETRO_ROOT ?? resolve(root, '..', '..', 'react', 'react98retro');
const libDist = join(libRoot, 'dist');
const vendorRoot = join(root, 'vendor', 'react98retro');
const vendorDist = join(vendorRoot, 'dist');

if (!existsSync(join(libDist, 'react98retro.js'))) {
  console.error(
    `ライブラリの dist がありません: ${libDist}\n` +
      `先に ${libRoot} で "mise exec -- bun run build:lib" を実行してください。`,
  );
  process.exit(1);
}

const { name, version } = JSON.parse(readFileSync(join(libRoot, 'package.json'), 'utf8'));

rmSync(vendorRoot, { recursive: true, force: true });
mkdirSync(vendorRoot, { recursive: true });
cpSync(libDist, vendorDist, { recursive: true });
writeFileSync(
  join(vendorRoot, 'VERSION.txt'),
  `${name} ${version}\nこのディレクトリは tools/sync-vendor-lib.mjs が生成する (手で編集しない)。\n`,
);

console.log(`${name} ${version} の dist を vendor/react98retro/dist にコピーしました。`);

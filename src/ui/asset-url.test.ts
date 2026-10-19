import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetUrl } from './asset-url';

/**
 * public/ の画像は元実装と同じく絶対パス ('/cuts/1.png') で書く。
 * GitHub Pages のプロジェクトページ (https://<user>.github.io/<repo>/) では
 * アプリのルートがサブパスになるので、Vite の base (import.meta.env.BASE_URL) を前置きする。
 */
describe('assetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('BASE_URL が / (開発 / テスト) のときは絶対パスのまま', () => {
    expect(assetUrl('/cuts/1.png')).toBe('/cuts/1.png');
    expect(assetUrl('/maps/W12.svg')).toBe('/maps/W12.svg');
  });

  it('BASE_URL がサブパスのときは前置きする (GitHub Pages のプロジェクトページ)', () => {
    vi.stubEnv('BASE_URL', '/ccatalog-web-port/');
    expect(assetUrl('/cuts/1.png')).toBe('/ccatalog-web-port/cuts/1.png');
    expect(assetUrl('/maps/W12.svg')).toBe('/ccatalog-web-port/maps/W12.svg');
  });
});

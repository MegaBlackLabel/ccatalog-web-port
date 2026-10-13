/**
 * public/ 配下の画像 (元実装と同じ絶対パス `/cuts/1.png` / `/maps/W12.svg` で書く) を、
 * Vite の base (`import.meta.env.BASE_URL`) 配下に向け直す。
 *
 * GitHub Pages のプロジェクトページはアプリのルートが
 * `https://<user>.github.io/<repo>/` のサブパスになるため、絶対パスのままだと
 * ドメイン直下 (`https://<user>.github.io/cuts/1.png`) を指して全部 404 になる。
 * base が `/` (開発サーバ / テスト) のときは何も変えない。
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return base === '/' ? path : `${base.replace(/\/+$/, '')}${path}`;
}

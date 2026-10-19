import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import App from '../App';
import dummy from '../data/fixtures/dummy-catalog.json';

/** 同梱のダミーカタログの件数 (生成: tools/gen-dummy-data.py)。 */
export const SAMPLE_COUNT = dummy.circles.length;

/**
 * a のサークル (スペース番号ボックスを持つセル) をクリックして選択する。
 * 実物は a のサークルだけがボックスを持ち、b のサークルには枠も番号も無い。
 */
export async function selectASpaceCircle(user: UserEvent): Promise<void> {
  const cell = [...screen.getByTestId('cut-view').querySelectorAll('.cut-cell')].find((node) =>
    node.querySelector('.cut-cell__space'),
  ) as HTMLElement;
  await user.click(cell);
}

/**
 * チェック済みの件数。実物のステータスバーは通常は空なので、件数はチェックリストの
 * ステータスバー (「全 N 件中 M 件を表示」) から確かめる。
 */
export function checkedCount(): number {
  const text = screen.getByTestId('checklist-window').textContent ?? '';
  const match = /全 (\d+) 件中/.exec(text);
  return match ? Number(match[1]) : -1;
}

/** ステータスバーのページ番号欄の値 (実物のステータスバーは通常は空なので番号欄で確認する)。 */
export function pageNumberOf(): string {
  return (screen.getByRole('textbox', { name: 'ページ番号' }) as HTMLInputElement).value;
}

/** サークル詳細ウィンドウの「サークル名」行の値 (実物は読み取り専用テキスト)。 */
export function detailCircleName(): string {
  const row = within(screen.getByTestId('detail-window'))
    .queryAllByTestId('detail-info-row')
    .find((node) => node.getAttribute('data-label') === 'サークル名');
  return row?.lastElementChild?.textContent ?? '';
}

/** ページ指定で移動する (メニュー ページ移動(J) → ページ指定で移動)。 */
export async function gotoPage(user: UserEvent, pageNo: number) {
  await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
  const input = await screen.findByTestId('goto-page-input');
  await user.clear(input);
  await user.type(input, String(pageNo));
  await user.click(screen.getByTestId('goto-page-submit'));
  await waitFor(() => expect(pageNumberOf()).toBe(String(pageNo)));
}

/** チェックリスト メニューを開き、出ている項目 (区切りを除く) を並び順で返す。 */
export async function openChecklistMenu(user: UserEvent): Promise<HTMLElement[]> {
  const menus = screen.getAllByRole('menubar');
  await user.click(
    within(menus[menus.length - 1]).getByRole('menuitem', { name: 'チェックリスト(A)' }),
  );
  const opened = screen.getAllByRole('menu');
  return within(opened[opened.length - 1]).getAllByRole('menuitem');
}

/**
 * App 統合テスト用のカタログ。サークルは本物のダミーをそのまま使う (件数・ページ番号・
 * ダミー登録 65 件などの期待値を保つ) が、**会場マップの机 (layouts) は空にする**。
 * 机 600 件 x 2 席の SVG は App のマウント時間の約 3 割を占める一方、App のテストは
 * 座席を 1 つも見ない (MapWindow.test.tsx が座席のレンダリングを持つ)。
 */
export const APP_TEST_SOURCE = {
  label: 'App 統合テスト用',
  load: () => Promise.resolve({ ...dummy, layouts: [] }),
};

export async function renderApp() {
  const user = userEvent.setup({ delay: null });
  // 起動シーケンス (起動確認 → シリアル → 情報送信) は専用のテストで確認する
  render(<App startup={false} source={APP_TEST_SOURCE} />);
  await screen.findByTestId('main-window');
  // 初回のデータ読み込み (Promise) と effect を流してから操作させる。
  await waitFor(() => expect(screen.getByTestId('main-window')).toBeInTheDocument());
  return { user };
}

/** メニューを開いて項目を選ぶ。ドロップダウンはライブラリが body へ portal する。 */
export async function chooseMenu(user: UserEvent, topLabel: string, itemName: RegExp) {
  const menus = screen.getAllByRole('menubar');
  await user.click(within(menus[menus.length - 1]).getByRole('menuitem', { name: topLabel }));
  const opened = screen.getAllByRole('menu');
  await user.click(within(opened[opened.length - 1]).getByRole('menuitem', { name: itemName }));
}

export async function openSearch(user: UserEvent) {
  await chooseMenu(user, '検索(S)', /^検索\(S\)\.\.\./);
  return screen.findByTestId('search-window');
}

/**
 * サブメニュー (標準のチェック色 / ツールバー) を開いて項目を選ぶ。
 * ライブラリのサブメニューはホバーで開く (role="menu" が入れ子で出る)。
 */
export async function chooseSubmenu(user: UserEvent, topLabel: string, subLabel: RegExp, itemName: RegExp) {
  const menus = screen.getAllByRole('menubar');
  await user.click(within(menus[menus.length - 1]).getByRole('menuitem', { name: topLabel }));
  const opened = screen.getAllByRole('menu');
  await user.hover(within(opened[opened.length - 1]).getByRole('menuitem', { name: subLabel }));
  // サブメニューはホバーして 150ms 後に開く (ライブラリ側の遅延)。
  await waitFor(() =>
    expect(screen.getAllByRole('menuitem', { name: itemName }).length).toBeGreaterThan(0),
  );
  await user.click(screen.getAllByRole('menuitem', { name: itemName })[0]);
}

/** 各テストのスパイ (window.open / clipboard / 計測) と保存内容を戻す。 */
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

/**
 * 動作設定ダイアログ (ダイアログ 150) で 1 項目だけ切り替えて閉じる。
 * ラベルは実物のニーモニック付き (「…する (S)」) なので、先頭一致で引く
 * (ラベルそのものはダイアログのテストで見る)。
 */
export async function toggleSetting(user: UserEvent, label: string) {
  await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
  const dialog = await screen.findByTestId('preferences-dialog');
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await user.click(within(dialog).getByLabelText(new RegExp(`^${escaped}`)));
  await user.click(within(dialog).getByTestId('preferences-ok'));
}


// テスト本体から使う値・ヘルパーを 1 か所に集める (各ファイルはここから必要な分だけ import する)。
export { App, dummy, screen, waitFor, within, fireEvent, render, cleanup, userEvent };
export type { UserEvent };

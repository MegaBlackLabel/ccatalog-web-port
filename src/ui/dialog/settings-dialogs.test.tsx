import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CHECK_COLOR_SETTINGS,
  DEFAULT_GOOGLE_SEARCH_SETTINGS,
  DEFAULT_IMAGE_PATH_SETTINGS,
  DEFAULT_LIST_DISPLAY_SETTINGS,
  DEFAULT_PAGE_SETUP,
  LIST_COLUMN_LABELS,
} from '../../domain/app-settings';
import type { ListColumnKey } from '../../domain/app-settings';
import type { PageSetup } from '../../domain/app-settings';
import { GoogleSearchDialog } from './GoogleSearchDialog';
import type { GoogleSearchDialogProps } from './GoogleSearchDialog';
import { ListDialog } from './ListDialog';
import type { ListDialogProps } from './ListDialog';
import { PageSetupDialog } from './PageSetupDialog';
import type { PageSetupDialogProps } from './PageSetupDialog';
import { PreferencesDialog } from './PreferencesDialog';
import type { PreferencesDialogProps } from './PreferencesDialog';

/** 元実装のコントロール ID (data-ctrl-id) で要素を引く。 */
function byControlId(root: HTMLElement, controlId: number): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-ctrl-id="${controlId}"]`);
  if (element === null) throw new Error(`control ${controlId} が見つからない`);
  return element;
}

function renderPreferences(overrides: Partial<PreferencesDialogProps> = {}) {
  const props: PreferencesDialogProps = {
    settings: DEFAULT_APP_SETTINGS,
    imagePath: DEFAULT_IMAGE_PATH_SETTINGS,
    listDisplay: DEFAULT_LIST_DISPLAY_SETTINGS,
    checkColors: DEFAULT_CHECK_COLOR_SETTINGS,
    onChange: vi.fn(),
    onImagePathChange: vi.fn(),
    onListDisplayChange: vi.fn(),
    onCheckColorsChange: vi.fn(),
    onReset: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<PreferencesDialog {...props} />);
  return { user, props, dialog: view.getByTestId('preferences-dialog') };
}

function renderGoogleSearch(overrides: Partial<GoogleSearchDialogProps> = {}) {
  const props: GoogleSearchDialogProps = {
    settings: DEFAULT_GOOGLE_SEARCH_SETTINGS,
    onChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<GoogleSearchDialog {...props} />);
  return { user, props, dialog: view.getByTestId('google-search-dialog') };
}

const PAGE_SETUP: PageSetup = {
  paper: 'B5',
  paperWidth: 182,
  paperHeight: 257,
  marginLeft: 10,
  marginRight: 15,
  marginTop: 12,
  marginBottom: 8,
  keepAspect: false,
};

function renderPageSetup(overrides: Partial<PageSetupDialogProps> = {}) {
  const props: PageSetupDialogProps = {
    setup: DEFAULT_PAGE_SETUP,
    onChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<PageSetupDialog {...props} />);
  return { user, props, dialog: view.getByTestId('page-setup-dialog') };
}

function renderListDialog(overrides: Partial<ListDialogProps> = {}) {
  const props: ListDialogProps = {
    title: 'リスト表示',
    items: [
      { id: 'page-1', label: '1ページ目' },
      { id: 'page-2', label: '2ページ目', detail: '東A-01' },
      { id: 'page-3', label: '3ページ目' },
    ],
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<ListDialog {...props} />);
  return { user, props, dialog: view.getByTestId('list-dialog') };
}

describe('PreferencesDialog — 列の表示項目の並べ替え (1694〜1699)', () => {
  /** 押した結果が表示に反映されるか見るので、状態を持つラッパで描く。 */
  function StatefulPreferences() {
    const [listDisplay, setListDisplay] = useState(DEFAULT_LIST_DISPLAY_SETTINGS);
    return (
      <PreferencesDialog
        settings={DEFAULT_APP_SETTINGS}
        imagePath={DEFAULT_IMAGE_PATH_SETTINGS}
        listDisplay={listDisplay}
        checkColors={DEFAULT_CHECK_COLOR_SETTINGS}
        onChange={vi.fn()}
        onImagePathChange={vi.fn()}
        onListDisplayChange={(patch) => setListDisplay((value) => ({ ...value, ...patch }))}
        onCheckColorsChange={vi.fn()}
        onReset={vi.fn()}
        onClose={vi.fn()}
      />
    );
  }

  it('行を選んで「前へ移動」すると、一覧の並びがその場で変わる', async () => {
    const user = userEvent.setup({ delay: null });
    render(<StatefulPreferences />);
    const dialog = screen.getByTestId('preferences-dialog');
    // ライブラリのタブは li[role=tab] の中の a を押すと切り替わる。
    const listTab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(listTab.querySelector('a') ?? listTab);
    const box = byControlId(dialog, 1694);
    const order = () =>
      [...box.querySelectorAll('[data-testid^="column-row-"]')].map((element) =>
        (element.getAttribute('data-testid') ?? '').replace('column-row-', ''),
      );

    const before = order();
    expect(before.length).toBeGreaterThan(1);

    // 2 番目の行をクリックして選ぶ (チェックの状態は変えない)。
    await user.click(within(box).getByTestId(`column-row-${before[1]}`));
    expect(within(dialog).getAllByRole('button', { name: '前へ移動(F)' })[0]).toBeEnabled();

    await user.click(within(dialog).getAllByRole('button', { name: '前へ移動(F)' })[0]);
    expect(order().slice(0, 2)).toEqual([before[1], before[0]]);

    // 元に戻せる (後へ移動)。
    await user.click(within(dialog).getAllByRole('button', { name: '後へ移動(B)' })[0]);
    expect(order().slice(0, 2)).toEqual([before[0], before[1]]);
  });

  it('チェックを外した列は一覧の後ろへ回る (チェックした列が先)', async () => {
    const user = userEvent.setup({ delay: null });
    render(<StatefulPreferences />);
    const dialog = screen.getByTestId('preferences-dialog');
    // ライブラリのタブは li[role=tab] の中の a を押すと切り替わる。
    const listTab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(listTab.querySelector('a') ?? listTab);
    const box = byControlId(dialog, 1694);
    const rows = () => [...box.querySelectorAll('[data-testid^="column-row-"]')];

    // 「サークル名」は外せない (5LIST.HTM) ので、外せる 1 件目を選ぶ。
    const target = rows().find(
      (row) => (within(row as HTMLElement).getByRole('checkbox') as HTMLInputElement).disabled === false,
    ) as HTMLElement;
    const key = (target.getAttribute('data-testid') ?? '').replace('column-row-', '') as ListColumnKey;
    const before = rows().indexOf(target);
    expect(before).toBeGreaterThanOrEqual(0);

    await user.click(within(box).getByLabelText(LIST_COLUMN_LABELS[key]));

    // チェックを外した列は一覧の後ろ (表示中の列の後ろ) へ回る。
    const after = rows();
    const movedIndex = after.findIndex(
      (row) => row.getAttribute('data-testid') === `column-row-${key}`,
    );
    expect(movedIndex).toBeGreaterThanOrEqual(0);
    const states = after.map(
      (row) => (within(row as HTMLElement).getByRole('checkbox') as HTMLInputElement).checked,
    );
    expect(states[movedIndex]).toBe(false);
    // チェックの付いた行が先、外れた行が後ろに並ぶ。
    expect(states).toEqual([...states].sort((left, right) => Number(right) - Number(left)));
  });
});

describe('PreferencesDialog', () => {
  it('ダイアログ 150 のコントロールをすべて表示する', () => {
    const { dialog } = renderPreferences();

    expect(screen.getByText('動作オプション')).toBeInTheDocument();
    for (const legend of ['画面の掴みスクロールの方式', 'カーソル移動', 'データ読み込み', 'その他']) {
      expect(within(dialog).getByText(legend)).toBeInTheDocument();
    }

    const controlIds = [
      1023, 1025, 1027, 1021, 1029, 1710, 1024, 1022, 1664, 1028, 1712, 1713, 1714, 1026, 1711,
      1720,
    ];
    for (const controlId of controlIds) {
      expect(dialog.querySelector(`[data-ctrl-id="${controlId}"]`), `control ${controlId}`).not.toBeNull();
    }

    // 元実装のラベルをそのまま使っている (抜粋)。
    expect(within(dialog).getByLabelText('シングルクリックでチェックする (S)')).toBe(
      byControlId(dialog, 1026),
    );
    expect(within(dialog).getByLabelText('読み込み時にサークルメモを上書きする(O)')).toBe(
      byControlId(dialog, 1712),
    );
    expect(within(dialog).getByLabelText('個別窓のアイコン化を連動する(I)')).toBe(
      byControlId(dialog, 1714),
    );
    expect(within(dialog).getByRole('button', { name: '設定を初期化(D)' })).toBe(
      byControlId(dialog, 1720),
    );
  });

  it('実物と同じ体裁 (タブ名 / 下部ボタン)', () => {
    const { dialog } = renderPreferences();

    // 実物のタブは「動作オプション / パス設定 / リスト表示 / チェック色」。
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '動作オプション',
      'パス設定',
      'リスト表示',
      'チェック色',
    ]);
    // 実物の下部は OK / キャンセル / 適用(A) (「閉じる」ではない)。
    expect(within(dialog).getByTestId('preferences-ok')).toHaveTextContent('OK');
    expect(within(dialog).getByTestId('preferences-cancel')).toHaveTextContent('キャンセル');
    expect(within(dialog).getByTestId('preferences-apply')).toHaveTextContent('適用(A)');
    // 変更が無い間は「適用」を使えない。
    expect(within(dialog).getByTestId('preferences-apply')).toBeDisabled();
    // 実物のボタンは右端揃え (中央寄せではない)。
    expect(within(dialog).getByTestId('preferences-actions')).toHaveStyle({
      justifyContent: 'flex-end',
    });
  });

  it('編集は適用(A)を押すまで onChange に出ない', async () => {
    const { user, props, dialog } = renderPreferences({
      settings: { ...DEFAULT_APP_SETTINGS, enterMovesCursor: false },
    });

    await user.click(byControlId(dialog, 1021));
    expect(props.onChange).not.toHaveBeenCalled();

    await user.click(within(dialog).getByTestId('preferences-apply'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ enterMovesCursor: true });
  });

  it('適用(A) は複数の編集をまとめて、そのキーだけの patch で出す', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(byControlId(dialog, 1025));
    await user.click(byControlId(dialog, 1712));

    await user.click(within(dialog).getByTestId('preferences-apply'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ scrollMode: 'ie', overwriteMemoOnLoad: true });
  });

  it('OK は編集を出して閉じる', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(byControlId(dialog, 1025));
    await user.click(within(dialog).getByTestId('preferences-ok'));

    expect(props.onChange).toHaveBeenCalledWith({ scrollMode: 'ie' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('キャンセルは編集を捨てて閉じる', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(byControlId(dialog, 1025));
    await user.click(within(dialog).getByTestId('preferences-cancel'));

    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('設定を初期化は onReset を呼ぶ', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(within(dialog).getByTestId('preferences-reset'));

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('編集が無くても OK で閉じる (onChange は呼ばない)', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(within(dialog).getByTestId('preferences-ok'));

    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onReset).not.toHaveBeenCalled();
  });

  it('動作オプションのラベルは実物のニーモニック付き (実測のグループ寸法)', async () => {
    const { user, dialog } = renderPreferences();

    // 実測: 425x92 / 133 / 117 / 107 (4,7,225,50 などの DLU を x1.75 / y1.85 で換算)。
    const groupOf = (legend: string) =>
      [...dialog.querySelectorAll('fieldset')].find(
        (field) => field.querySelector(':scope > legend')?.textContent === legend,
      ) as HTMLElement;
    for (const [legend, height] of [
      ['画面の掴みスクロールの方式', '92px'],
      ['カーソル移動', '133px'],
      ['データ読み込み', '117px'],
      ['その他', '107px'],
    ] as const) {
      expect(groupOf(legend).style.height).toBe(height);
    }

    for (const label of [
      'Adobe方式(A) （スペースキーを押しながらマウスドラッグ）',
      'IE方式(E) （ホイールクリックでスクロールロック）',
      'マウスドラッグのみで掴みスクロール(R)',
      'リターンキーでチェック時、カーソルを自動で次のサークルに移動 (N)',
      'テンキーでチェック時、カーソルを自動で次のサークルに移動 (M)',
      'ページ変更時に常に左上のサークルカットにカーソルを合わせる (U)',
      '選択カーソルをマウスカーソルに追従する (T)',
      '選択サークルのブロックが変わった際にサークル一覧の表示も追従する (L)',
      '起動時に前回使用したチェックリストを自動的に読み込む (P)',
      '過去のチェックリスト読み込み時、サークル名チェックを厳密に行う (C)',
      '個別窓のアイコン化を連動する(I)',
      'シングルクリックでチェックする (S)',
      '起動時に表紙画像を表示する (B)',
    ]) {
      expect(within(dialog).getByText(label)).toBeInTheDocument();
    }

    // パス設定はニーモニック付きで、参照(C)... は入力欄の下 (実物どおり)。
    const tabs = within(dialog);
    await user.click(tabs.getByRole('tab', { name: 'パス設定' }).querySelector('a') ?? tabs.getByRole('tab', { name: 'パス設定' }));
    expect(within(dialog).getByText('自動検索する(F)')).toBeInTheDocument();
    expect(within(dialog).getByText('指定場所から読み込む(R)')).toBeInTheDocument();
    expect(within(dialog).getByText('場所(D) :')).toBeInTheDocument();
    expect(within(dialog).getByText('ブラウザを指定(B)')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: '参照(C)...' })).toHaveLength(2);
    // Web 版だけの注記は実物に無いので出さない。
    expect(within(dialog).queryByText(/Web 版は画像データと/)).toBeNull();

    // 参照(C)... は入力欄の下の行にあり、右寄せ。
    const edit = byControlId(dialog, 1614);
    const browseRow = byControlId(dialog, 1616).parentElement as HTMLElement;
    expect(browseRow.contains(edit)).toBe(false);
    expect(
      edit.compareDocumentPosition(byControlId(dialog, 1616)) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(browseRow.style.justifyContent).toBe('flex-end');
  });

  it('リスト表示の項目は実物の 18 項目 (この順) で、ボタンと注記も実物どおり', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(tab.querySelector('a') ?? tab);

    const rows = [...byControlId(dialog, 1694).querySelectorAll('[data-testid^="column-row-"]')].map(
      (row) => (row.getAttribute('data-testid') ?? '').replace('column-row-', ''),
    );
    // 1694 はチェックリスト側のリスト。既定の 8 項目が先、非表示の 10 項目が末尾
    // (並びはダイアログ 210 の項目順)。
    expect(rows.slice(0, 8)).toEqual([
      'space',
      'cut',
      'name',
      'book',
      'description',
      'memo',
      'updateInfo',
      'updateStatus',
    ]);
    expect(rows.slice(8)).toEqual([
      'day',
      'genre',
      'kana',
      'pen',
      'url',
      'mail',
      'twitter',
      'pixiv',
      'webCatalog',
      'circleMs',
    ]);
    // ラベルは実物の項目名。
    for (const label of [
      '参加日',
      'スペース',
      'ジャンル',
      'サークルカット',
      'サークル名',
      '読みがな',
      '執筆者',
      '発行誌',
      'URL',
      'Mail',
      'Twitter',
      'Pixiv',
      '補足',
      'メモ',
      '更新情報',
      'WebCatalog',
      '更新状態',
      'Circle.ms',
    ]) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
    // ボタンは実物の文言。
    for (const name of ['前へ移動(F)', '後へ移動(B)', '前へ移動(P)', '後へ移動(N)', 'デフォルトに戻す(D)']) {
      expect(within(dialog).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(within(dialog).getByTestId('preferences-list-note')).toHaveTextContent(
      '※「サークル名」を非表示にすることは',
    );
    // 「サークル名」は外せない (5LIST.HTM)。
    expect(within(dialog).getByLabelText('サークル名')).toBeDisabled();
  });

  it('チェック色は表示色と印刷色の 2 段 (9 色ずつ) を出し、ボタンは実物の文言', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'チェック色' });
    await user.click(tab.querySelector('a') ?? tab);

    expect(within(dialog).getByText('編集するチェック色(S) :')).toBeInTheDocument();
    expect(within(dialog).getByText('色の編集(C)')).toBeInTheDocument();
    expect(within(dialog).getByText('表示色 :')).toBeInTheDocument();
    expect(within(dialog).getByText('印刷色 :')).toBeInTheDocument();
    expect(within(dialog).getByText('チェック色名の編集(E)')).toBeInTheDocument();
    expect(within(dialog).getByText('名称(N) :')).toBeInTheDocument();

    for (const color of [1, 9]) {
      expect(within(dialog).getByTestId(`display-color-${color}`)).toBeInTheDocument();
      expect(within(dialog).getByTestId(`print-color-${color}`)).toBeInTheDocument();
    }
    expect(within(dialog).getAllByTestId(/^(display|print)-color-\d$/)).toHaveLength(18);
    expect(within(dialog).getByTestId('preferences-color-reset')).toHaveTextContent(
      'デフォルト色に戻す(R)',
    );
    expect(within(dialog).getByTestId('preferences-color-mac-reset')).toHaveTextContent(
      'Macデフォルト色に戻す(M)',
    );
  });

  it('ボタン行 (OK / キャンセル / 適用(A)) はタブ ページの下に 8px の余白を空ける', () => {
    const { dialog } = renderPreferences();

    // 実測: プロパティシートのボタン行はタブ ページの下端から 8px。
    expect(within(dialog).getByTestId('preferences-actions')).toHaveStyle({
      paddingTop: '8px',
    });
    // 変更が無い間は「適用(A)」を使えない (編集すると押せるようになる)。
    expect(within(dialog).getByTestId('preferences-apply')).toBeDisabled();
  });

  it('リスト表示のリストは実物の 154x170 で、入りきらない分はスクロールする', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(tab.querySelector('a') ?? tab);

    const box = byControlId(dialog, 1694);
    // 実測: リスト領域は 88x92 DLU = 154x170 (項目が増えるとスクロールバーが出る)。
    expect(box.style.width).toBe('154px');
    expect(box.style.height).toBe('170px');
    expect(box.style.overflow).toBe('auto');
    expect(within(dialog).getByTestId('preferences-list-note')).toHaveTextContent('できません.');
  });

  it('前へ移動 / 後へ移動 は選択位置に応じて端でだけ無効になる', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(tab.querySelector('a') ?? tab);
    const prev = () =>
      within(dialog).getAllByRole('button', { name: '前へ移動(F)' })[0] as HTMLButtonElement;
    const next = () =>
      within(dialog).getAllByRole('button', { name: '後へ移動(B)' })[0] as HTMLButtonElement;

    // 実物のリストは最初の項目が選ばれている (先頭なので「前へ移動」だけ無効)。
    expect(within(dialog).getAllByTestId('column-row-space')[0]).toHaveStyle({
      background: '#000080',
    });
    expect(prev()).toBeDisabled();
    expect(next()).toBeEnabled();

    // 途中の項目を選ぶと両方押せる。
    await user.click(within(dialog).getAllByTestId('column-row-cut')[0]);
    expect(prev()).toBeEnabled();
    expect(next()).toBeEnabled();

    // 末尾まで移すと「後へ移動」が無効になる (端では該当する側だけ無効)。
    for (let step = 0; step < 20 && !next().disabled; step += 1) await user.click(next());
    expect(next()).toBeDisabled();
    expect(prev()).toBeEnabled();
  });

  it('移動ボタンは実物の 74x26 で、文字がはみ出さない', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'リスト表示' });
    await user.click(tab.querySelector('a') ?? tab);

    for (const name of ['前へ移動(F)', '後へ移動(B)', '前へ移動(P)', '後へ移動(N)']) {
      const button = within(dialog).getByRole('button', { name });
      expect(button).toHaveStyle({ width: '74px', padding: '0 2px' });
    }
  });

  it('チェック色のグループはダイアログの内側幅いっぱい (固定幅を付けない)', async () => {
    const { user, dialog } = renderPreferences();
    const tab = within(dialog).getByRole('tab', { name: 'チェック色' });
    await user.click(tab.querySelector('a') ?? tab);

    const groupOf = (legend: string) =>
      [...dialog.querySelectorAll('fieldset')].find(
        (field) => field.querySelector(':scope > legend')?.textContent === legend,
      ) as HTMLElement;
    // 実測: 色の編集 109 高 / チェック色名の編集 67 高で、幅は内側いっぱい。
    expect(groupOf('色の編集(C)').style.height).toBe('109px');
    expect(groupOf('色の編集(C)').style.width).toBe('');
    expect(groupOf('チェック色名の編集(E)').style.height).toBe('67px');
    expect(groupOf('チェック色名の編集(E)').style.width).toBe('');
    // 表示色 / 印刷色の段はどちらも 9 色 (見出しのスペーサ + 9 列)。
    expect(within(dialog).getByTestId('check-color-display-row').children).toHaveLength(10);
    expect(within(dialog).getByTestId('check-color-print-row').children).toHaveLength(10);
    // 9 列が残り幅を等分し (flex は実ブラウザで確認)、スウォッチは実物の比率で
    // 大きくなる (36x26)。jsdom は flex 短縮形を解釈しないので長辺側だけ見る。
    const cell = within(dialog).getByTestId('display-color-1').parentElement as HTMLElement;
    expect(cell.style.minWidth).toBe('0px');
    expect(within(dialog).getByTestId('display-color-1')).toHaveStyle({
      maxWidth: '36px',
      height: '26px',
    });
    // 見出し (色1〜色9) の行はスウォッチの真上、2 段の間隔は実物どおり 8px。
    expect(within(dialog).getByTestId('check-color-labels')).toHaveStyle({
      height: '16px',
      paddingBottom: '3px',
    });
    expect(within(dialog).getByTestId('check-color-print-row').parentElement).toHaveStyle({
      gap: '8px',
    });
    // チェック色名の編集の行は上下中央 (上 11px / 下 21px + 凡例 10px)。
    expect(groupOf('チェック色名の編集(E)').style.padding).toBe('11px 8px 21px 10px');
  });

  it('本文はスクロールさせず、リサイズ ハンドルとサイズ グリップを出さない', () => {
    const { dialog } = renderPreferences();
    const body = dialog.querySelector('.window-body') as HTMLElement;
    const content = body.firstElementChild as HTMLElement;

    // 実測 (439x670) のうち高さはそのまま、幅は日本語ラベルが折り返さない 510。
    expect(content.style.overflow).toBe('hidden');
    expect(body.style.overflow).toBe('hidden');
    expect(dialog.querySelector('[class*="sizeGrip"]')).toBeNull();
    expect(dialog.querySelector('[class*="resizeHandle"]')).toBeNull();
    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);
    expect(root.style.width).toBe('510px');
    expect(root.style.height).toBe('670px');
  });
});

describe('GoogleSearchDialog', () => {
  it('実物と同じ体裁 (ラジオ / OK・キャンセル) で、既定は「両方を含む」', () => {
    const { dialog } = renderGoogleSearch();

    expect(screen.getByText('Google検索設定')).toBeInTheDocument();
    expect(within(dialog).getByText('検索条件')).toBeInTheDocument();
    expect(byControlId(dialog, 1690)).not.toBeChecked();
    expect(byControlId(dialog, 1691)).toBeChecked();
    expect(byControlId(dialog, 1692)).not.toBeChecked();
    expect(within(dialog).getByTestId('google-search-ok')).toHaveTextContent('OK');
    expect(within(dialog).getByTestId('google-search-cancel')).toHaveTextContent('キャンセル');
  });

  it('ラベルが折り返さないギリギリの幅にする (自然幅 351 + 余白 42)', () => {
    const { dialog } = renderGoogleSearch();
    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);

    // 一番長いラベルの自然幅は実測 351px。groupbox の内側余白 10px x2 と
    // ウィンドウ枠・本文余白 22px を足した 393px まで詰める (これ以上狭めると折り返す)。
    expect(Number.parseFloat(root.style.width)).toBeGreaterThanOrEqual(390);
    expect(Number.parseFloat(root.style.width)).toBeLessThanOrEqual(400);
  });

  it('カスタムのコンボは常に出て、カスタム以外では非活性', () => {
    const { dialog } = renderGoogleSearch();

    // カスタム以外でも 3 つを出したまま、押せない状態にする。
    expect(within(dialog).getByTestId('google-search-field-1')).toBeDisabled();
    expect(within(dialog).getByTestId('google-search-field-2')).toBeDisabled();
    expect(within(dialog).getByTestId('google-search-condition')).toBeDisabled();
  });

  it('カスタムを選ぶとコンボが活性になる (元のコントロール ID)', async () => {
    const { user, dialog } = renderGoogleSearch();

    await user.click(byControlId(dialog, 1692));

    const field1 = within(dialog).getByTestId('google-search-field-1');
    expect(field1).toBeEnabled();
    expect(field1).toHaveValue('circleName');
    expect([...field1.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'サークル名',
      '読みがな',
      '執筆者名',
      '発行誌名',
    ]);
    expect(within(dialog).getByTestId('google-search-field-2')).toHaveValue('penName');
    expect(within(dialog).getByTestId('google-search-condition')).toHaveValue('and');
    // 元のコントロール ID (1693 / 1694 / 1695) を保つ。
    for (const controlId of [1693, 1694, 1695]) {
      expect(dialog.querySelector(`[data-ctrl-id="${controlId}"]`), String(controlId)).not.toBeNull();
    }
  });

  it('ボタンは右配置にする (実物は右端に寄る)', () => {
    const { dialog } = renderGoogleSearch();

    const ok = within(dialog).getByTestId('google-search-ok');
    const row = ok.parentElement as HTMLElement;
    expect(row.style.justifyContent).toBe('flex-end');
    // OK とキャンセルが同じ行に並ぶ。
    expect(within(row).getByTestId('google-search-cancel')).toBeInTheDocument();
  });

  it('カスタムでも下部の OK / キャンセルが見える高さを確保する', async () => {
    const { user, dialog } = renderGoogleSearch();
    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);

    // コンボ 3 つぶんの高さを最初から確保しておく (カスタムにしてもボタンが押せる)。
    expect(Number.parseFloat(root.style.height)).toBeGreaterThanOrEqual(240);
    expect(within(dialog).getByTestId('google-search-ok')).toBeInTheDocument();
    await user.click(byControlId(dialog, 1692));
    expect(within(dialog).getByTestId('google-search-ok')).toBeInTheDocument();
    expect(within(dialog).getByTestId('google-search-cancel')).toBeInTheDocument();
  });

  it('OK は編集をまとめて親に出して閉じる', async () => {
    const { user, props, dialog } = renderGoogleSearch();

    await user.click(byControlId(dialog, 1692));
    await user.selectOptions(within(dialog).getByTestId('google-search-field-1'), 'bookName');
    await user.selectOptions(within(dialog).getByTestId('google-search-condition'), 'or');
    await user.click(within(dialog).getByTestId('google-search-ok'));

    expect(props.onChange).toHaveBeenCalledWith({
      mode: 'custom',
      field1: 'bookName',
      field2: 'penName',
      andMode: false,
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('キャンセルは編集を捨てて閉じる', async () => {
    const { user, props, dialog } = renderGoogleSearch();

    await user.click(byControlId(dialog, 1692));
    await user.click(within(dialog).getByTestId('google-search-cancel'));

    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('OK まで親に出さない (その場では設定が変わらない)', async () => {
    const { user, props, dialog } = renderGoogleSearch();

    await user.click(byControlId(dialog, 1690));

    expect(props.onChange).not.toHaveBeenCalled();
  });
});

describe('PageSetupDialog', () => {
  it('実物の項目 (用紙 / 高さ / 幅 / 余白 4 つ / 縦横比を保つ) とプレビューを出す', () => {
    const { dialog } = renderPageSetup({ setup: PAGE_SETUP });

    expect(screen.getByText('用紙サイズ・余白の設定')).toBeInTheDocument();
    expect(within(dialog).getByText('用紙サイズ')).toBeInTheDocument();
    expect(within(dialog).getByText('余白')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('用紙(P)')).toHaveValue('B5');
    expect(within(dialog).getByLabelText('高さ(H)')).toHaveValue('257.0');
    expect(within(dialog).getByLabelText('幅(W)')).toHaveValue('182.0');
    expect(within(dialog).getByLabelText('左(L)')).toHaveValue('10.0');
    expect(within(dialog).getByLabelText('右(R)')).toHaveValue('15.0');
    expect(within(dialog).getByLabelText('上(T)')).toHaveValue('12.0');
    expect(within(dialog).getByLabelText('下(B)')).toHaveValue('8.0');
    expect(within(dialog).getByLabelText('縦横比を保つ(K)')).not.toBeChecked();
    expect(within(dialog).getAllByText('mm')).toHaveLength(6);
    expect(within(dialog).getByTestId('page-setup-preview')).toBeInTheDocument();
    // 実物に無い項目 (DPI / オフセット) は出さない。
    expect(within(dialog).queryByLabelText('DPI')).toBeNull();
    expect(within(dialog).queryByText(/オフセット/)).toBeNull();
    expect(within(dialog).queryByTestId('page-setup-reset')).toBeNull();
  });

  it('元リソース 203 のコントロール ID を残す', () => {
    const { dialog } = renderPageSetup();

    for (const [controlId, tag] of [
      [1643, 'SELECT'],
      [1644, 'INPUT'],
      [1638, 'INPUT'],
      [1653, 'INPUT'],
      [1654, 'INPUT'],
      [1651, 'INPUT'],
      [1652, 'INPUT'],
      [1650, 'INPUT'],
      [1655, 'DIV'],
      [1, 'BUTTON'],
      [2, 'BUTTON'],
    ] as const) {
      expect(byControlId(dialog, controlId).tagName).toBe(tag);
    }
    // 閉じるボタンではなく OK / キャンセル。
    expect(byControlId(dialog, 1)).toHaveTextContent('OK');
    expect(byControlId(dialog, 2)).toHaveTextContent('キャンセル');
  });

  it('用紙を選ぶと幅と高さがその用紙の寸法になる', async () => {
    const { user, props, dialog } = renderPageSetup();

    await user.selectOptions(within(dialog).getByLabelText('用紙(P)'), 'A3');

    expect(within(dialog).getByLabelText('幅(W)')).toHaveValue('297.0');
    expect(within(dialog).getByLabelText('高さ(H)')).toHaveValue('420.0');

    await user.click(within(dialog).getByTestId('page-setup-ok'));

    expect(props.onChange).toHaveBeenCalledWith({
      ...DEFAULT_PAGE_SETUP,
      paper: 'A3',
      paperWidth: 297,
      paperHeight: 420,
    });
  });

  it('縦横比を保つと、幅の変更に高さが追随する', async () => {
    const { user, dialog } = renderPageSetup(); // 既定: A4 210x297 / 縦横比を保つ = ON

    const width = within(dialog).getByLabelText('幅(W)');
    await user.clear(width);
    await user.type(width, '105');

    // 105 * (297 / 210) = 148.5
    expect(within(dialog).getByLabelText('高さ(H)')).toHaveValue('148.5');

    const height = within(dialog).getByLabelText('高さ(H)');
    await user.clear(height);
    await user.type(height, '594');

    // 594 * (210 / 297) = 420
    expect(within(dialog).getByLabelText('幅(W)')).toHaveValue('420.0');
  });

  it('縦横比を保つが OFF なら幅と高さは独立する', async () => {
    const { user, dialog } = renderPageSetup({ setup: PAGE_SETUP });

    const width = within(dialog).getByLabelText('幅(W)');
    await user.clear(width);
    await user.type(width, '105');

    expect(within(dialog).getByLabelText('高さ(H)')).toHaveValue('257.0');
  });

  it('プレビューの破線は余白と同じ倍率で紙の内側に寄る', async () => {
    const { user, dialog } = renderPageSetup(); // 既定: A4 210x297 / 左 20 上 28.3
    const paper = within(dialog).getByTestId('page-setup-preview-paper');
    const margins = within(dialog).getByTestId('page-setup-preview-margins');
    const paperX = Number(paper.getAttribute('x'));
    const paperY = Number(paper.getAttribute('y'));
    const scale = Number(paper.getAttribute('width')) / DEFAULT_PAGE_SETUP.paperWidth;

    // 紙は白、破線は青の 1px 破線。
    expect(paper.getAttribute('fill')).toBe('#ffffff');
    expect(margins.getAttribute('stroke')).toBe('#0000ff');
    expect(margins.getAttribute('stroke-width')).toBe('1');
    expect(margins.getAttribute('stroke-dasharray')).toBe('3 3');

    expect(Number(margins.getAttribute('x')) - paperX).toBeCloseTo(20 * scale, 1);
    expect(Number(margins.getAttribute('y')) - paperY).toBeCloseTo(28.3 * scale, 1);

    // 左の余白を 60mm にすると、破線の内側は 3 倍に広がる。
    const left = within(dialog).getByLabelText('左(L)');
    await user.clear(left);
    await user.type(left, '60');

    expect(Number(margins.getAttribute('x')) - paperX).toBeCloseTo(60 * scale, 1);
    expect(Number(margins.getAttribute('y')) - paperY).toBeCloseTo(28.3 * scale, 1);
  });

  it('数値でない入力では設定を変えない (OK では元の値のまま)', async () => {
    const { user, props, dialog } = renderPageSetup();

    const width = within(dialog).getByLabelText('幅(W)');
    await user.clear(width);
    await user.type(width, 'abc');
    await user.type(width, 'x');
    expect(width).toHaveValue('abcx');

    await user.click(within(dialog).getByTestId('page-setup-ok'));

    expect(props.onChange).toHaveBeenCalledWith(DEFAULT_PAGE_SETUP);
  });

  it('OK は編集した設定を渡して閉じる', async () => {
    const { user, props, dialog } = renderPageSetup({ setup: PAGE_SETUP });

    const left = within(dialog).getByLabelText('左(L)');
    await user.clear(left);
    await user.type(left, '25');
    await user.click(within(dialog).getByLabelText('縦横比を保つ(K)'));
    await user.click(within(dialog).getByTestId('page-setup-ok'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ ...PAGE_SETUP, marginLeft: 25, keepAspect: true });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('キャンセルは編集を捨てて閉じる', async () => {
    const { user, props, dialog } = renderPageSetup({ setup: PAGE_SETUP });

    const left = within(dialog).getByLabelText('左(L)');
    await user.clear(left);
    await user.type(left, '25');
    await user.click(within(dialog).getByTestId('page-setup-cancel'));

    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ListDialog', () => {
  it('渡された項目を 1 行ずつ表示する', () => {
    const { dialog } = renderListDialog();

    expect(screen.getByText('リスト表示')).toBeInTheDocument();

    const rows = within(dialog).getAllByTestId('list-dialog-item');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('1ページ目');
    expect(rows[1]).toHaveTextContent('東A-01');
    expect(rows[2]).toHaveTextContent('3ページ目');
  });

  it('selectedId があればその行が選択されている', () => {
    const { dialog } = renderListDialog({ selectedId: 'page-3' });

    const rows = within(dialog).getAllByTestId('list-dialog-item');
    expect(rows[2]).toHaveAttribute('data-selected', 'true');
    expect(rows[2]).toHaveAttribute('data-item-id', 'page-3');
    expect(rows[0]).not.toHaveAttribute('data-selected');
  });

  it('行を選んで「選択」を押すと onSelect に id を渡す', async () => {
    const { user, props, dialog } = renderListDialog();

    const rows = within(dialog).getAllByTestId('list-dialog-item');
    await user.click(rows[1]);

    expect(rows[1]).toHaveAttribute('data-selected', 'true');
    expect(rows[1]).toHaveAttribute('data-item-id', 'page-2');
    expect(rows[0]).not.toHaveAttribute('data-selected');
    expect(props.onSelect).not.toHaveBeenCalled();

    await user.click(within(dialog).getByTestId('list-dialog-ok'));

    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith('page-2');
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('行のダブルクリックでも onSelect を呼ぶ', async () => {
    const { user, props, dialog } = renderListDialog();

    const rows = within(dialog).getAllByTestId('list-dialog-item');
    await user.dblClick(rows[0]);

    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith('page-1');
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderListDialog();

    await user.click(within(dialog).getByTestId('list-dialog-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});

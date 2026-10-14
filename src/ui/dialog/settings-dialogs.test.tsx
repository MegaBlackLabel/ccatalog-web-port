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
import type { GoogleSearchSettings, PageSetup } from '../../domain/app-settings';
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
  const user = userEvent.setup();
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
  const user = userEvent.setup();
  const view = render(<GoogleSearchDialog {...props} />);
  return { user, props, dialog: view.getByTestId('google-search-dialog') };
}

const PAGE_SETUP: PageSetup = {
  dpi: 600,
  paperWidth: 210,
  paperHeight: 297,
  marginX: 10,
  marginY: 12,
  offsetX: -2,
  offsetY: 3,
};

function renderPageSetup(overrides: Partial<PageSetupDialogProps> = {}) {
  const props: PageSetupDialogProps = {
    setup: DEFAULT_PAGE_SETUP,
    onChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
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
  const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    expect(within(dialog).getAllByRole('button', { name: '前へ移動' })[0]).toBeEnabled();

    await user.click(within(dialog).getAllByRole('button', { name: '前へ移動' })[0]);
    expect(order().slice(0, 2)).toEqual([before[1], before[0]]);

    // 元に戻せる (後へ移動)。
    await user.click(within(dialog).getAllByRole('button', { name: '後へ移動' })[0]);
    expect(order().slice(0, 2)).toEqual([before[0], before[1]]);
  });

  it('チェックを外した列は一覧の後ろへ回る (チェックした列が先)', async () => {
    const user = userEvent.setup();
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

    // チェックを外した列は一覧の後ろへ回る。
    expect(rows()[0].getAttribute('data-testid')).not.toBe(`column-row-${key}`);
    expect(rows()[rows().length - 1].getAttribute('data-testid')).toBe(`column-row-${key}`);
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
    expect(within(dialog).getByLabelText('シングルクリックでチェックする')).toBe(
      byControlId(dialog, 1026),
    );
    expect(within(dialog).getByLabelText('読み込み時にサークルメモを上書きする')).toBe(
      byControlId(dialog, 1712),
    );
    expect(within(dialog).getByLabelText('個別窓のアイコン化を連動する')).toBe(
      byControlId(dialog, 1714),
    );
    expect(within(dialog).getByRole('button', { name: '設定を初期化' })).toBe(
      byControlId(dialog, 1720),
    );
  });

  it('チェックボックスの変更はそのキーだけの patch で onChange を呼ぶ', async () => {
    const { user, props, dialog } = renderPreferences({
      settings: { ...DEFAULT_APP_SETTINGS, enterMovesCursor: false },
    });

    await user.click(byControlId(dialog, 1021));
    expect(props.onChange).toHaveBeenNthCalledWith(1, { enterMovesCursor: true });

    await user.click(byControlId(dialog, 1712));
    expect(props.onChange).toHaveBeenNthCalledWith(2, { overwriteMemoOnLoad: true });

    expect(props.onChange).toHaveBeenCalledTimes(2);
  });

  it('スクロール方式のラジオは scrollMode だけの patch で onChange を呼ぶ', async () => {
    const { user, props, dialog } = renderPreferences();

    expect(byControlId(dialog, 1023)).toBeChecked();

    await user.click(byControlId(dialog, 1025));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ scrollMode: 'ie' });
  });

  it('設定を初期化は onReset を呼ぶ', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(within(dialog).getByTestId('preferences-reset'));

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderPreferences();

    await user.click(within(dialog).getByTestId('preferences-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onReset).not.toHaveBeenCalled();
  });
});

describe('GoogleSearchDialog', () => {
  it('既定では「両方を含む」が選択されている', () => {
    const { dialog } = renderGoogleSearch();

    expect(screen.getByText('Google検索設定')).toBeInTheDocument();
    expect(within(dialog).getByText('検索条件')).toBeInTheDocument();
    expect(byControlId(dialog, 1690)).not.toBeChecked();
    expect(byControlId(dialog, 1691)).toBeChecked();
    expect(byControlId(dialog, 1692)).not.toBeChecked();
    expect(within(dialog).getByLabelText('カスタム設定')).toBe(byControlId(dialog, 1692));
  });

  it('カスタム設定以外では項目と条件のコントロールを出さない', () => {
    const { dialog } = renderGoogleSearch();

    expect(within(dialog).queryByLabelText('発行誌名')).toBeNull();
    expect(within(dialog).queryByLabelText('両方を含む')).toBeNull();
  });

  it('カスタム設定を選ぶと mode の patch で onChange を呼ぶ', async () => {
    const { user, props, dialog } = renderGoogleSearch();

    await user.click(byControlId(dialog, 1692));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ mode: 'custom' });
  });

  it('カスタム設定の項目チェックは fields の patch で onChange を呼ぶ', async () => {
    const settings: GoogleSearchSettings = {
      mode: 'custom',
      fields: { circleName: true, penName: true, bookName: false, circleKana: false },
      andMode: true,
    };
    const { user, props, dialog } = renderGoogleSearch({ settings });

    expect(within(dialog).getByLabelText('サークル名')).toBeChecked();
    expect(within(dialog).getByLabelText('発行誌名')).not.toBeChecked();

    await user.click(within(dialog).getByLabelText('発行誌名'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({
      fields: { circleName: true, penName: true, bookName: true, circleKana: false },
    });
  });

  it('カスタム設定の条件ラジオは andMode の patch で onChange を呼ぶ', async () => {
    const settings: GoogleSearchSettings = {
      mode: 'custom',
      fields: { circleName: true, penName: true, bookName: false, circleKana: false },
      andMode: true,
    };
    const { user, props, dialog } = renderGoogleSearch({ settings });

    await user.click(within(dialog).getByLabelText('いずれかを含む'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ andMode: false });
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderGoogleSearch();

    await user.click(within(dialog).getByTestId('google-search-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });
});

describe('PageSetupDialog', () => {
  it('ダイアログ 203 の入力に渡された設定値を表示する', () => {
    const { dialog } = renderPageSetup({ setup: PAGE_SETUP });

    expect(screen.getByText('用紙サイズ・余白の設定')).toBeInTheDocument();
    expect(within(dialog).getByText('用紙サイズ')).toBeInTheDocument();
    expect(within(dialog).getByText('余白')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('DPI')).toHaveValue('600');
    expect(within(dialog).getByLabelText('用紙幅(mm)')).toHaveValue('210');
    expect(within(dialog).getByLabelText('用紙高さ(mm)')).toHaveValue('297');
    expect(within(dialog).getByLabelText('左右余白(mm)')).toHaveValue('10');
    expect(within(dialog).getByLabelText('上下余白(mm)')).toHaveValue('12');
    expect(within(dialog).getByLabelText('オフセットX(mm)')).toHaveValue('-2');
    expect(within(dialog).getByLabelText('オフセットY(mm)')).toHaveValue('3');
  });

  it('DPI を編集すると dpi の patch で onChange を呼ぶ', async () => {
    const { user, props, dialog } = renderPageSetup();

    const input = within(dialog).getByLabelText('DPI');
    await user.clear(input);
    await user.type(input, '600');

    expect(props.onChange).toHaveBeenLastCalledWith({ dpi: 600 });
    expect(input).toHaveValue('600');
  });

  it('数値でない入力では onChange を呼ばない', async () => {
    const { user, props, dialog } = renderPageSetup();

    const input = within(dialog).getByLabelText('用紙幅(mm)');
    await user.clear(input);
    await user.type(input, 'abc');

    expect(props.onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('abc');
  });

  it('既定値に戻すは DEFAULT_PAGE_SETUP を渡し、表示も既定値に戻す', async () => {
    const { user, props, dialog } = renderPageSetup({ setup: PAGE_SETUP });

    const input = within(dialog).getByLabelText('DPI');
    await user.click(within(dialog).getByTestId('page-setup-reset'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ ...DEFAULT_PAGE_SETUP });
    expect(input).toHaveValue(String(DEFAULT_PAGE_SETUP.dpi));
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderPageSetup();

    await user.click(within(dialog).getByTestId('page-setup-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
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

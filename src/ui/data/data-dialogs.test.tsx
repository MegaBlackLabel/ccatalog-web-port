import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CircleDataDialog } from './CircleDataDialog';
import type { CircleDataDialogProps } from './CircleDataDialog';
import { DatabaseMergeDialog } from './DatabaseMergeDialog';
import type { DatabaseMergeDialogProps } from './DatabaseMergeDialog';
import { DuplicateCheckDialog } from './DuplicateCheckDialog';
import type { DuplicateCheckDialogProps } from './DuplicateCheckDialog';
import { ImageDataDialog } from './ImageDataDialog';
import type { ImageDataDialogProps } from './ImageDataDialog';
import { LoadCircleConfirmDialog } from './LoadCircleConfirmDialog';
import type { LoadCircleConfirmDialogProps, LoadCircleConfirmItem } from './LoadCircleConfirmDialog';
import { MemoMergeDialog } from './MemoMergeDialog';
import type { MemoMergeDialogProps } from './MemoMergeDialog';
import { RoundSwitchDialog } from './RoundSwitchDialog';
import type { RoundInfo, RoundSwitchDialogProps } from './RoundSwitchDialog';

const INSTALLED: readonly RoundInfo[] = [
  { comiketNo: 96, name: 'コミックマーケット96', installed: true },
  { comiketNo: 95, name: 'コミックマーケット95', installed: true },
];

const AVAILABLE: readonly RoundInfo[] = [
  { comiketNo: 94, name: 'コミックマーケット94', installed: false },
  { comiketNo: 93, name: 'コミックマーケット93', installed: false },
];

const DATABASE_CANDIDATES = [
  { comiketNo: 95, name: 'コミックマーケット95', circleCount: 120 },
  { comiketNo: 94, name: 'コミックマーケット94', circleCount: 80 },
];

const MEMO_CANDIDATES = [
  { comiketNo: 95, memoCount: 12, sourceLabel: '古いデータベース95' },
  { comiketNo: 94, memoCount: 3, sourceLabel: '古いデータベース94' },
];

const LOAD_ITEMS: readonly LoadCircleConfirmItem[] = [
  {
    id: 'a',
    importedName: 'サークルA',
    importedPenName: 'ペンA',
    importedColor: '色3',
    importedMemo: 'メモA',
    currentCandidates: [{ id: 1, name: 'サークルA（現在）', penName: 'ペンA（現在）' }],
    action: 'do',
  },
  {
    id: 'b',
    importedName: 'サークルB',
    importedPenName: 'ペンB',
    importedColor: '標準色',
    importedMemo: '',
    currentCandidates: [],
    action: 'skip',
  },
];

const DUPLICATES = [
  { name: 'サークルA', penName: 'ペンA', count: 2 },
  { name: 'サークルB', penName: 'ペンB', count: 1 },
];

/** グループボックスの中の行だけを取り出す。 */
function groupRows(dialog: HTMLElement, groupName: string): HTMLElement[] {
  return within(within(dialog).getByRole('group', { name: groupName })).getAllByTestId('dialog-row');
}

function renderRoundSwitch(overrides: Partial<RoundSwitchDialogProps> = {}) {
  const props: RoundSwitchDialogProps = {
    rounds: INSTALLED,
    currentComiketNo: 96,
    onSwitch: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<RoundSwitchDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('round-switch-dialog') };
}

function renderCircleData(overrides: Partial<CircleDataDialogProps> = {}) {
  const props: CircleDataDialogProps = {
    installed: INSTALLED,
    available: AVAILABLE,
    progress: null,
    onInstall: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<CircleDataDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('circle-data-dialog') };
}

function renderImageData(overrides: Partial<ImageDataDialogProps> = {}) {
  const props: ImageDataDialogProps = {
    installed: INSTALLED,
    available: AVAILABLE,
    installedImages: [96, 95],
    progress: null,
    onInstall: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<ImageDataDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('image-data-dialog') };
}

function renderDatabaseMerge(overrides: Partial<DatabaseMergeDialogProps> = {}) {
  const props: DatabaseMergeDialogProps = {
    candidates: DATABASE_CANDIDATES,
    onMerge: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<DatabaseMergeDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('database-merge-dialog') };
}

function renderMemoMerge(overrides: Partial<MemoMergeDialogProps> = {}) {
  const props: MemoMergeDialogProps = {
    candidates: MEMO_CANDIDATES,
    onMerge: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<MemoMergeDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('memo-merge-dialog') };
}

function renderLoadCircle(overrides: Partial<LoadCircleConfirmDialogProps> = {}) {
  const props: LoadCircleConfirmDialogProps = {
    items: LOAD_ITEMS,
    onChange: vi.fn(),
    onApply: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<LoadCircleConfirmDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('load-circle-confirm-dialog') };
}

function renderDuplicateCheck(overrides: Partial<DuplicateCheckDialogProps> = {}) {
  const props: DuplicateCheckDialogProps = {
    duplicates: DUPLICATES,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<DuplicateCheckDialog {...props} />);
  return { user, props, view, dialog: within(view.container).getByTestId('duplicate-check-dialog') };
}

describe('RoundSwitchDialog', () => {
  it('参照中の回に印を付けて一覧表示する', () => {
    const { dialog } = renderRoundSwitch();

    expect(screen.getByText('コミックマーケット回数切り替え')).toBeInTheDocument();
    const rows = within(dialog).getAllByTestId('dialog-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('コミックマーケット96 (96) (参照中)');
    expect(rows[0]).toHaveAttribute('data-row-id', '96');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    expect(rows[1]).toHaveTextContent('コミックマーケット95 (95)');
    expect(rows[1]).toHaveAttribute('data-selected', 'false');
  });

  it('参照中以外を選んで切り替えると onSwitch を呼ぶ', async () => {
    const { user, props, dialog } = renderRoundSwitch();
    const rows = within(dialog).getAllByTestId('dialog-row');

    await user.click(rows[1]);
    expect(rows[1]).toHaveAttribute('data-selected', 'true');
    expect(rows[0]).toHaveAttribute('data-selected', 'false');

    await user.click(within(dialog).getByTestId('round-switch-submit'));
    expect(props.onSwitch).toHaveBeenCalledWith(95);
  });

  it('参照中の回しか選べないときは切り替えボタンが無効', async () => {
    const { user, props, dialog } = renderRoundSwitch();
    const submit = within(dialog).getByTestId('round-switch-submit');
    expect(submit).toBeDisabled();

    // 参照中の回を選び直しても切り替えられない。
    await user.click(within(dialog).getAllByTestId('dialog-row')[0]);
    expect(submit).toBeDisabled();

    // 追加されているデータが無ければ選択もできない。
    const empty = renderRoundSwitch({ rounds: [] });
    expect(within(empty.dialog).queryAllByTestId('dialog-row')).toHaveLength(0);
    expect(within(empty.dialog).getByTestId('round-switch-submit')).toBeDisabled();
    expect(props.onSwitch).not.toHaveBeenCalled();
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderRoundSwitch();

    await user.click(within(dialog).getByTestId('round-switch-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CircleDataDialog', () => {
  it('追加できる回と追加済みの回を表示し、閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderCircleData();

    expect(screen.getByText('サークルデータの追加インストールと削除')).toBeInTheDocument();
    expect(groupRows(dialog, 'インストールするデータ').map((row) => row.textContent)).toEqual([
      'コミックマーケット94 (94)',
      'コミックマーケット93 (93)',
    ]);
    const installedRows = groupRows(dialog, '追加済みのデータ');
    expect(installedRows[0]).toHaveTextContent('コミックマーケット96 (96) (参照中)');
    expect(installedRows[1]).toHaveTextContent('コミックマーケット95 (95)');
    expect(within(dialog).getByText('現在参照中のデータは削除できません。')).toBeInTheDocument();

    await user.click(within(dialog).getByTestId('circle-data-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('回を選ぶまでインストールできず、選ぶと onInstall を呼ぶ', async () => {
    const { user, props, dialog } = renderCircleData();
    const install = within(dialog).getByTestId('circle-data-install');
    expect(install).toBeDisabled();

    const rows = groupRows(dialog, 'インストールするデータ');
    await user.click(rows[1]);
    expect(rows[1]).toHaveAttribute('data-selected', 'true');

    await user.click(install);
    expect(props.onInstall).toHaveBeenCalledWith(93);
  });

  it('参照中の回は削除できない', async () => {
    const { user, props, dialog } = renderCircleData();
    const remove = within(dialog).getByTestId('circle-data-remove');
    expect(remove).toBeDisabled();

    const rows = groupRows(dialog, '追加済みのデータ');
    await user.click(rows[0]);
    expect(remove).toBeDisabled();

    await user.click(rows[1]);
    expect(remove).toBeEnabled();
    await user.click(remove);
    expect(props.onRemove).toHaveBeenCalledWith(95);

    // 参照中の回を指定すれば、その回が削除できなくなる。
    const custom = renderCircleData({ currentComiketNo: 95 });
    await custom.user.click(groupRows(custom.dialog, '追加済みのデータ')[1]);
    expect(within(custom.dialog).getByTestId('circle-data-remove')).toBeDisabled();
  });

  it('実行中のときだけ進捗を表示する', () => {
    const running = renderCircleData({ progress: 40 });
    const bar = within(running.dialog).getByRole('progressbar');
    expect(bar).toHaveAttribute('max', '100');
    expect(bar).toHaveAttribute('value', '40');
    expect(within(running.dialog).getByText('40%')).toBeInTheDocument();

    const idle = renderCircleData();
    expect(within(idle.dialog).queryByRole('progressbar')).toBeNull();
    expect(within(idle.dialog).queryByText('40%')).toBeNull();
  });
});

describe('ImageDataDialog', () => {
  it('追加できる画像データとインストール済み画像を表示し、閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderImageData();

    expect(screen.getByText('画像データの追加インストールと削除')).toBeInTheDocument();
    expect(groupRows(dialog, 'インストールする画像データ').map((row) => row.textContent)).toEqual([
      'コミックマーケット94 (94)',
      'コミックマーケット93 (93)',
    ]);
    expect(groupRows(dialog, 'インストール済み画像').map((row) => row.textContent)).toEqual([
      'コミックマーケット96 (96)',
      'コミックマーケット95 (95)',
    ]);

    await user.click(within(dialog).getByTestId('image-data-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('画像データを選ぶまでインストールできず、選ぶと onInstall を呼ぶ', async () => {
    const { user, props, dialog } = renderImageData();
    const install = within(dialog).getByTestId('image-data-install');
    expect(install).toBeDisabled();

    const rows = groupRows(dialog, 'インストールする画像データ');
    await user.click(rows[0]);
    expect(rows[0]).toHaveAttribute('data-selected', 'true');

    await user.click(install);
    expect(props.onInstall).toHaveBeenCalledWith(94);
  });

  it('インストール済み画像を選んで削除すると onRemove を呼ぶ', async () => {
    const { user, props, dialog } = renderImageData();
    const remove = within(dialog).getByTestId('image-data-remove');
    expect(remove).toBeDisabled();

    const rows = groupRows(dialog, 'インストール済み画像');
    await user.click(rows[0]);
    await user.click(remove);
    expect(props.onRemove).toHaveBeenCalledWith(96);

    // 回数の一覧に無い画像データでも回数だけは表示する。
    const unknown = renderImageData({ installedImages: [90] });
    expect(groupRows(unknown.dialog, 'インストール済み画像')[0]).toHaveTextContent('コミックマーケット90 (90)');
  });

  it('実行中のときだけ進捗を表示する', () => {
    const running = renderImageData({ progress: 60 });
    const bar = within(running.dialog).getByRole('progressbar');
    expect(bar).toHaveAttribute('value', '60');
    expect(within(running.dialog).getByText('60%')).toBeInTheDocument();

    const idle = renderImageData();
    expect(within(idle.dialog).queryByRole('progressbar')).toBeNull();
  });
});

describe('DatabaseMergeDialog', () => {
  it('統合できる古いデータベースと件数を表示する', () => {
    const { dialog } = renderDatabaseMerge();

    expect(screen.getByText('古いデータベースの統合')).toBeInTheDocument();
    const rows = within(dialog).getAllByTestId('dialog-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('コミックマーケット95 (95) 120 件');
    expect(rows[0]).toHaveAttribute('data-row-id', '95');
    expect(within(rows[0]).getByText('コミックマーケット95 (95)')).toBeInTheDocument();
    expect(within(rows[0]).getByText('120 件')).toBeInTheDocument();
    expect(within(rows[1]).getByText('80 件')).toBeInTheDocument();
  });

  it('選ぶまで統合できず、選ぶと onMerge を呼ぶ', async () => {
    const { user, props, dialog } = renderDatabaseMerge();
    const submit = within(dialog).getByTestId('database-merge-submit');
    expect(submit).toBeDisabled();

    const rows = within(dialog).getAllByTestId('dialog-row');
    await user.click(rows[1]);
    expect(rows[1]).toHaveAttribute('data-selected', 'true');

    await user.click(submit);
    expect(props.onMerge).toHaveBeenCalledWith(94);
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderDatabaseMerge();

    await user.click(within(dialog).getByTestId('database-merge-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MemoMergeDialog', () => {
  it('統合できるメモと件数を表示する', () => {
    const { dialog } = renderMemoMerge();

    expect(screen.getByText('サークルメモの統合')).toBeInTheDocument();
    const rows = within(dialog).getAllByTestId('dialog-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('古いデータベース95 12 件');
    expect(rows[0]).toHaveAttribute('data-row-id', '古いデータベース95');
    expect(within(rows[0]).getByText('古いデータベース95')).toBeInTheDocument();
    expect(within(rows[0]).getByText('12 件')).toBeInTheDocument();
  });

  it('選ぶまで統合できず、選ぶと onMerge を呼ぶ', async () => {
    const { user, props, dialog } = renderMemoMerge();
    const submit = within(dialog).getByTestId('memo-merge-submit');
    expect(submit).toBeDisabled();

    const rows = within(dialog).getAllByTestId('dialog-row');
    await user.click(rows[0]);
    await user.click(submit);
    expect(props.onMerge).toHaveBeenCalledWith('古いデータベース95');

    const empty = renderMemoMerge({ candidates: [] });
    expect(within(empty.dialog).getByTestId('memo-merge-submit')).toBeDisabled();
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderMemoMerge();

    await user.click(within(dialog).getByTestId('memo-merge-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('LoadCircleConfirmDialog', () => {
  it('読み込む側・現在のサークルデータ・追加方法を表示する', () => {
    const { dialog } = renderLoadCircle();

    expect(screen.getByText('読み込みサークル確認')).toBeInTheDocument();
    expect(within(dialog).getByText('読み込むチェックリスト')).toBeInTheDocument();
    expect(within(dialog).getByText('現在のサークルデータ')).toBeInTheDocument();
    expect(within(dialog).getByText('追加方法')).toBeInTheDocument();

    const rows = within(dialog).getAllByTestId('dialog-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('data-row-id', 'a');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    expect(within(rows[0]).getByText('サークルA')).toBeInTheDocument();
    expect(within(rows[0]).getByText('ペンA')).toBeInTheDocument();
    expect(within(rows[0]).getByText('色3')).toBeInTheDocument();
    expect(within(rows[0]).getByText('メモA')).toBeInTheDocument();
    expect(within(rows[0]).getByText('サークルA（現在）')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('radio', { name: 'する' })).toBeChecked();

    expect(within(rows[1]).getByText('(該当なし)')).toBeInTheDocument();
    expect(within(rows[1]).getByRole('radio', { name: 'しない' })).toBeChecked();
    expect(rows[1]).toHaveAttribute('data-selected', 'false');
  });

  it('追加方法を変えると onChange を呼ぶ', async () => {
    const { user, props, dialog } = renderLoadCircle();
    const rows = within(dialog).getAllByTestId('dialog-row');

    await user.click(within(rows[1]).getByRole('radio', { name: '未登録' }));
    expect(props.onChange).toHaveBeenCalledWith('b', 'unregistered');

    await user.click(within(rows[0]).getByRole('radio', { name: 'しない' }));
    expect(props.onChange).toHaveBeenCalledWith('a', 'skip');
  });

  it('適用で onApply を呼ぶ', async () => {
    const { user, props, dialog } = renderLoadCircle();

    await user.click(within(dialog).getByTestId('load-circle-apply'));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  it('一致するサークルが無いときは空メッセージを出し、閉じるで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderLoadCircle({ items: [] });

    expect(within(dialog).queryAllByTestId('dialog-row')).toHaveLength(0);
    expect(within(dialog).getByText('一致しないサークルはありません')).toBeInTheDocument();

    await user.click(within(dialog).getByTestId('load-circle-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('DuplicateCheckDialog', () => {
  it('確認メッセージと重複しているサークルを表示する', () => {
    const { dialog } = renderDuplicateCheck();

    expect(screen.getByText('チェックリストへの重複登録の確認')).toBeInTheDocument();
    expect(
      within(dialog).getByText('既に登録されているサークルがあります。重複して登録しますか？'),
    ).toBeInTheDocument();

    const rows = within(dialog).getAllByTestId('dialog-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('サークルA / ペンA (2 件)');
    expect(rows[0]).toHaveAttribute('data-row-id', 'サークルA / ペンA');
    expect(rows[0]).toHaveAttribute('data-selected', 'false');
    expect(rows[1]).toHaveTextContent('サークルB / ペンB (1 件)');
  });

  it('はいで onConfirm を呼ぶ', async () => {
    const { user, props, dialog } = renderDuplicateCheck();

    await user.click(within(dialog).getByTestId('duplicate-confirm'));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('いいえで onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderDuplicateCheck();

    await user.click(within(dialog).getByTestId('duplicate-cancel'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});

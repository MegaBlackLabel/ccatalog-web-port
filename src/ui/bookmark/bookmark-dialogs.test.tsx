import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Bookmark } from '../../domain/app-settings';
import { BookmarkAddDialog } from './BookmarkAddDialog';
import type { BookmarkAddDialogProps } from './BookmarkAddDialog';
import { BookmarkOrganizeDialog } from './BookmarkOrganizeDialog';
import type { BookmarkOrganizeDialogProps } from './BookmarkOrganizeDialog';

const BOOKMARKS: readonly Bookmark[] = [
  { id: 11, name: '104 ページ', pageNo: 104, group: '1日目' },
  { id: 12, name: 'サークルA', pageNo: 210, group: '1日目' },
  { id: 13, name: 'メモ', pageNo: 330, group: '' },
];

function renderAdd(overrides: Partial<BookmarkAddDialogProps> = {}) {
  const props: BookmarkAddDialogProps = {
    defaultName: '104 ページ',
    pageNo: 104,
    onAdd: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  render(<BookmarkAddDialog {...props} />);
  return { user, props, dialog: screen.getByTestId('bookmark-add-dialog') };
}

function renderOrganize(overrides: Partial<BookmarkOrganizeDialogProps> = {}) {
  const props: BookmarkOrganizeDialogProps = {
    bookmarks: BOOKMARKS,
    onRename: vi.fn(),
    onRemove: vi.fn(),
    onSetGroup: vi.fn(),
    onJump: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  render(<BookmarkOrganizeDialog {...props} />);
  return { user, props, dialog: screen.getByTestId('bookmark-organize-dialog') };
}

/** ブックマーク id の行 (bookmark-row)。 */
function row(dialog: HTMLElement, id: number): HTMLElement {
  const found = within(dialog)
    .getAllByTestId('bookmark-row')
    .find((element) => element.getAttribute('data-bookmark-id') === String(id));
  if (found === undefined) throw new Error(`bookmark-row not found: ${id}`);
  return found;
}

describe('BookmarkAddDialog', () => {
  it('入力欄を defaultName と注記で初期化する', () => {
    renderAdd();

    expect(screen.getByTestId('bookmark-name-input')).toHaveValue('104 ページ');
    expect(screen.getByLabelText('ブックマーク名(N):')).toHaveAttribute('data-ctrl-id', '129');
    expect(screen.getByText('104 ページに追加します.')).toBeInTheDocument();
    expect(
      screen.getByText('ブックマーク名を半角127文字以内で入力してください.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-add-submit')).toHaveTextContent('OK');
    expect(screen.getByTestId('bookmark-add-cancel')).toHaveTextContent('キャンセル');
  });

  it('OK で入力した名前を onAdd に渡す', async () => {
    const { user, props } = renderAdd();

    const input = screen.getByTestId('bookmark-name-input');
    await user.clear(input);
    await user.type(input, '  表紙のページ  ');
    await user.click(screen.getByTestId('bookmark-add-submit'));

    expect(props.onAdd).toHaveBeenCalledExactlyOnceWith('表紙のページ');
  });

  it('入力が空 (空白のみ) なら onAdd を呼ばない', async () => {
    const { user, props } = renderAdd();

    const input = screen.getByTestId('bookmark-name-input');
    await user.clear(input);
    await user.type(input, '   ');
    await user.click(screen.getByTestId('bookmark-add-submit'));

    expect(props.onAdd).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('Enter でも登録する', async () => {
    const { user, props } = renderAdd();

    const input = screen.getByTestId('bookmark-name-input');
    await user.clear(input);
    await user.type(input, '新しいしおり{Enter}');

    expect(props.onAdd).toHaveBeenCalledExactlyOnceWith('新しいしおり');
  });

  it('キャンセルは onClose を呼び、登録しない', async () => {
    const { user, props } = renderAdd();

    await user.click(screen.getByTestId('bookmark-add-cancel'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onAdd).not.toHaveBeenCalled();
  });
});

describe('BookmarkOrganizeDialog', () => {
  it('ブックマーク 1 件につき 1 行をグループ見出し付きで出す', () => {
    const { dialog } = renderOrganize();

    const list = within(dialog).getByTestId('bookmark-list');
    expect(within(list).getAllByTestId('bookmark-row')).toHaveLength(BOOKMARKS.length);
    expect(within(list).getByText('1日目')).toBeInTheDocument();
    expect(within(list).getByText('(未分類)')).toBeInTheDocument();
    expect(within(list).getByText('サークルA')).toBeInTheDocument();
    expect(row(dialog, 11)).toHaveAttribute('data-selected', 'false');
  });

  it('行を選んで 変更 すると onRename に選択 id と新しい名前を渡す', async () => {
    const { user, props, dialog } = renderOrganize();

    await user.click(row(dialog, 12));
    expect(row(dialog, 12)).toHaveAttribute('data-selected', 'true');

    const input = within(dialog).getByTestId('bookmark-rename-input');
    expect(input).toHaveValue('サークルA');
    await user.clear(input);
    await user.type(input, 'サークルB');
    await user.click(within(dialog).getByTestId('bookmark-rename-submit'));

    expect(props.onRename).toHaveBeenCalledExactlyOnceWith(12, 'サークルB');
  });

  it('選択が無いと 削除 は押せず、選ぶと onRemove にその id を渡す', async () => {
    const { user, props, dialog } = renderOrganize();

    const removeButton = within(dialog).getByTestId('bookmark-remove');
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveTextContent('削除(D)');

    await user.click(row(dialog, 13));
    expect(removeButton).toBeEnabled();
    await user.click(removeButton);

    expect(props.onRemove).toHaveBeenCalledExactlyOnceWith([13]);
  });

  it('グループを入力して 設定 すると onSetGroup に選択 id とグループ名を渡す', async () => {
    const { user, props, dialog } = renderOrganize();

    await user.click(row(dialog, 11));
    await user.type(within(dialog).getByTestId('bookmark-group-input'), 'グループ');
    await user.click(within(dialog).getByTestId('bookmark-group-submit'));

    expect(props.onSetGroup).toHaveBeenCalledExactlyOnceWith([11], 'グループ');
  });

  it('行のダブルクリックで onJump にそのページ番号を渡す', async () => {
    const { user, props, dialog } = renderOrganize();

    await user.dblClick(row(dialog, 12));

    expect(props.onJump).toHaveBeenCalledExactlyOnceWith(210);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('ブックマークが無いときは案内を出す', () => {
    const { dialog } = renderOrganize({ bookmarks: [] });

    expect(within(dialog).getByTestId('bookmark-list')).toHaveTextContent(
      'ブックマークは登録されていません',
    );
    expect(within(dialog).queryAllByTestId('bookmark-row')).toHaveLength(0);
  });

  it('閉じる は onClose を呼ぶ', async () => {
    const { user, props } = renderOrganize();

    await user.click(screen.getByTestId('bookmark-organize-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

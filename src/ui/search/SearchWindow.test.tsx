import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SEARCH_CONDITION } from '../../domain/search';
import type { SearchCondition } from '../../domain/search';
import { ALL_FIELDS_MASK, SEARCH_FIELDS } from '../../domain/search-fields';
import type { Genre } from '../../domain/types';
import { SearchWindow } from './SearchWindow';
import type { SearchWindowProps } from './SearchWindow';

afterEach(cleanup);

const GENRES: Genre[] = [
  { id: 14, name: '創作(少女)', code: 112 },
  { id: 21, name: '評論', code: 201 },
];

function searchProps(overrides: Partial<SearchWindowProps> = {}): SearchWindowProps {
  return {
    condition: DEFAULT_SEARCH_CONDITION,
    genres: GENRES,
    canNarrow: false,
    canUndoNarrow: false,
    onConditionChange: vi.fn(),
    onSearch: vi.fn(),
    onNarrow: vi.fn(),
    onUndoNarrow: vi.fn(),
    onReset: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

function renderSearch(overrides: Partial<SearchWindowProps> = {}) {
  const props = searchProps(overrides);
  const user = userEvent.setup({ delay: null });
  render(<SearchWindow {...props} />);
  return { user, props, search: screen.getByTestId('search-window') };
}

/** 元実装のコントロール ID (data-ctrl-id) で要素を引く。 */
function control(container: HTMLElement, id: number): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-ctrl-id="${id}"]`);
  if (!element) throw new Error(`コントロール ${id} が見つかりません`);
  return element;
}

/** キーワード入力のような、条件が実際に更新されることを確かめるための足場。 */
function ControlledSearch({
  initial,
  onConditionChange,
}: {
  initial?: Partial<SearchCondition>;
  onConditionChange?: (patch: Partial<SearchCondition>) => void;
}) {
  const [condition, setCondition] = useState<SearchCondition>(() => ({
    ...DEFAULT_SEARCH_CONDITION,
    ...initial,
  }));

  return (
    <SearchWindow
      condition={condition}
      genres={GENRES}
      canNarrow
      canUndoNarrow
      onConditionChange={(patch) => {
        onConditionChange?.(patch);
        setCondition((previous) => ({ ...previous, ...patch }));
      }}
      onSearch={vi.fn()}
      onNarrow={vi.fn()}
      onUndoNarrow={vi.fn()}
      onReset={() => setCondition(DEFAULT_SEARCH_CONDITION)}
      onClose={vi.fn()}
    />
  );
}

describe('SearchWindow', () => {
  it('元実装どおりのグループボックスを表示する', () => {
    const { search } = renderSearch();

    expect(within(search).getByText('サークル検索')).toBeInTheDocument();
    expect(within(search).getByText('検索範囲')).toBeInTheDocument();
    expect(within(search).getByText('参加日')).toBeInTheDocument();
    expect(within(search).getByText('検索対象項目')).toBeInTheDocument();
    expect(within(search).getByText('検索対象ジャンル')).toBeInTheDocument();
    expect(
      within(search).getByText('検索キーワード（スペースで区切って複数入力できます）'),
    ).toBeInTheDocument();
    expect(search.querySelectorAll('fieldset')).toHaveLength(5);
  });

  it('検索対象項目の 14 項目が元のコントロール ID を持つ', () => {
    const { search } = renderSearch({ condition: { ...DEFAULT_SEARCH_CONDITION, fields: 0 } });

    for (const field of SEARCH_FIELDS) {
      const input = control(search, field.controlId);
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input).toHaveAttribute('type', 'checkbox');
      expect(input).not.toBeChecked();
    }

    // 検索対象項目 14 + 参加日 5 + メモのみ 1040 + 更新のみ 1047 + あいまい検索 1017
    // + 表示のまま 1704 = 23 個。
    expect(search.querySelectorAll('input[type="checkbox"][data-ctrl-id]')).toHaveLength(23);
  });

  it('既定の条件では検索対象項目がすべてチェックされる', () => {
    const { search } = renderSearch();

    for (const field of SEARCH_FIELDS) {
      expect(control(search, field.controlId)).toBeChecked();
    }
  });

  it('項目チェックを外すとそのビットだけが落ちる', async () => {
    const { user, props, search } = renderSearch({
      condition: { ...DEFAULT_SEARCH_CONDITION, fields: ALL_FIELDS_MASK },
    });

    await user.click(control(search, 1010)); // 執筆者 (0x0004)

    expect(props.onConditionChange).toHaveBeenCalledTimes(1);
    expect(props.onConditionChange).toHaveBeenCalledWith({ fields: ALL_FIELDS_MASK & ~0x0004 });
  });

  it('外れている項目をチェックするとそのビットだけが立つ', async () => {
    const { user, props, search } = renderSearch({
      condition: { ...DEFAULT_SEARCH_CONDITION, fields: 0 },
    });

    await user.click(control(search, 1010)); // 執筆者 (0x0004)

    expect(props.onConditionChange).toHaveBeenCalledWith({ fields: 0x0004 });
  });

  it('参加日のチェックで condition.days を更新する', async () => {
    const { user, props, search } = renderSearch({
      condition: { ...DEFAULT_SEARCH_CONDITION, days: [1] },
    });

    await user.click(control(search, 1005)); // 3日目
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ days: [1, 3] });

    await user.click(control(search, 1003)); // 1日目 (チェック済み)
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ days: [] });

    await user.click(control(search, 1007)); // 抽選漏れ (day 0)
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ days: [1, 0] });
  });

  it('ジャンル一覧に全ジャンルを並べ、選択で condition.genres を更新する', async () => {
    const { user, props, search } = renderSearch({
      condition: { ...DEFAULT_SEARCH_CONDITION, genres: [21] },
    });
    const list = control(search, 1015);

    expect(within(list).getAllByRole('checkbox')).toHaveLength(GENRES.length);
    expect(within(list).getByRole('checkbox', { name: '評論' })).toBeChecked();
    expect(within(list).getByRole('checkbox', { name: '創作(少女)' })).not.toBeChecked();

    await user.click(within(list).getByRole('checkbox', { name: '創作(少女)' }));
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ genres: [21, 14] });

    await user.click(screen.getByRole('button', { name: '全部選択' }));
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ genres: [14, 21] });

    await user.click(screen.getByRole('button', { name: '全部解除' }));
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ genres: [] });
  });

  it('あいまい検索・メモのみ・更新のみの条件を切り替える', async () => {
    const { user, props, search } = renderSearch();

    await user.click(control(search, 1017)); // あいまい検索 (既定で ON)
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ fuzzy: false });

    await user.click(control(search, 1040)); // メモが記入されているサークルのみ探す
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ memoOnly: true });

    await user.click(control(search, 1047)); // 更新されたサークルのみ探す
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ updatedOnly: true });
  });

  it('「いずれかの語を含む」で andMode を false にする', async () => {
    const { user, props, search } = renderSearch();

    await user.click(control(search, 1002));
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ andMode: false });
  });

  it('「全ての語を含む」で andMode を true にする', async () => {
    const { user, props, search } = renderSearch({
      condition: { ...DEFAULT_SEARCH_CONDITION, andMode: false },
    });

    await user.click(control(search, 1001));
    expect(props.onConditionChange).toHaveBeenLastCalledWith({ andMode: true });
  });

  it('キーワード入力に元実装のコントロール ID が付く', () => {
    renderSearch();

    const input = screen.getByTestId('search-keyword');
    expect(input).toHaveAttribute('data-ctrl-id', '1000');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('');
  });

  it('キーワード入力が condition.keywords を更新する', async () => {
    const user = userEvent.setup({ delay: null });
    const onConditionChange = vi.fn();
    render(<ControlledSearch onConditionChange={onConditionChange} />);

    const input = screen.getByTestId('search-keyword');
    await user.type(input, 'SMYSLE');

    expect(input).toHaveValue('SMYSLE');
    expect(onConditionChange).toHaveBeenLastCalledWith({ keywords: 'SMYSLE' });
  });

  it('検索・絞込み・やり直し・初期化・閉じるがコールバックを呼ぶ', async () => {
    const { user, props } = renderSearch({ canNarrow: true, canUndoNarrow: true });

    await user.click(screen.getByTestId('search-run'));
    expect(props.onSearch).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('search-narrow'));
    expect(props.onNarrow).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('search-undo'));
    expect(props.onUndoNarrow).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('search-reset'));
    expect(props.onReset).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('search-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('絞込みとやり直しは canNarrow / canUndoNarrow に従う', () => {
    const props = searchProps();
    const { rerender } = render(<SearchWindow {...props} />);
    expect(screen.getByTestId('search-narrow')).toBeDisabled();
    expect(screen.getByTestId('search-undo')).toBeDisabled();

    rerender(<SearchWindow {...props} canNarrow canUndoNarrow />);
    expect(screen.getByTestId('search-narrow')).toBeEnabled();
    expect(screen.getByTestId('search-undo')).toBeEnabled();
  });

  it('keepOpen を渡すと 1704 のチェック状態に反映する', async () => {
    const { user, props, search } = renderSearch({
      keepOpen: false,
      onKeepOpenChange: vi.fn(),
    });
    const keepOpen = control(search, 1704);
    expect(keepOpen).not.toBeChecked();

    await user.click(keepOpen);

    expect(props.onKeepOpenChange).toHaveBeenCalledWith(true);
  });

  it('keepOpen 未指定でも 1704 は既定でチェックされ、単独でも動く', async () => {
    const { user, props, search } = renderSearch({ onKeepOpenChange: vi.fn() });
    const keepOpen = control(search, 1704);
    expect(keepOpen).toBeChecked();

    await user.click(keepOpen);

    expect(keepOpen).not.toBeChecked();
    expect(props.onKeepOpenChange).toHaveBeenCalledWith(false);
  });
});

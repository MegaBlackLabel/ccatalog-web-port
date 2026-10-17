import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComiketInfo } from '../../domain/types';
import { AboutDialog } from './AboutDialog';
import type { AboutDialogProps } from './AboutDialog';
import { GotoPageDialog } from './GotoPageDialog';
import type { GotoPageDialogProps } from './GotoPageDialog';
import { MemoDialog } from './MemoDialog';
import type { MemoDialogProps } from './MemoDialog';

const INFO: ComiketInfo = {
  comiketNo: 96,
  comiketName: 'コミックマーケット96（ダミー）',
  cutSizeW: 178,
  cutSizeH: 253,
  cutOriginX: 8,
  cutOriginY: 64,
  cutOffsetX: 0,
  cutOffsetY: 0,
  mapSizeW: 110,
  mapSizeH: 60,
  mapOriginX: 0,
  mapOriginY: 0,
};

function renderMemo(overrides: Partial<MemoDialogProps> = {}) {
  const props: MemoDialogProps = {
    title: 'メモの編集',
    value: '既存のメモ',
    onSave: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<MemoDialog {...props} />);
  return { user, props, dialog: view.getByTestId('memo-dialog') };
}

function renderGoto(overrides: Partial<GotoPageDialogProps> = {}) {
  const props: GotoPageDialogProps = {
    pageNo: 104,
    minPage: 104,
    maxPage: 109,
    onGoto: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<GotoPageDialog {...props} />);
  return { user, props, dialog: view.getByTestId('goto-page-dialog') };
}

function renderAbout(overrides: Partial<AboutDialogProps> = {}) {
  const props: AboutDialogProps = {
    info: INFO,
    genreCount: 20,
    circleCount: 180,
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<AboutDialog {...props} />);
  return { user, props, dialog: view.getByTestId('about-dialog') };
}

describe('MemoDialog', () => {
  it('タイトルと value を初期値にしたテキストエリアを表示する', () => {
    const { dialog } = renderMemo();

    expect(screen.getByText('メモの編集')).toBeInTheDocument();
    expect(within(dialog).getByTestId('memo-input')).toHaveValue('既存のメモ');
  });

  it('入力して OK を押すと onSave に新しいメモを渡す', async () => {
    const { user, props } = renderMemo();

    const input = screen.getByTestId('memo-input');
    await user.clear(input);
    await user.type(input, '2日目は委託頒布のみ');
    await user.click(screen.getByTestId('memo-save'));

    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledWith('2日目は委託頒布のみ');
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('未編集のまま OK を押すと元のメモをそのまま渡す', async () => {
    const { user, props } = renderMemo();

    await user.click(screen.getByTestId('memo-save'));

    expect(props.onSave).toHaveBeenCalledWith('既存のメモ');
  });

  it('キャンセルは onClose を呼び、保存はしない', async () => {
    const { user, props } = renderMemo();

    await user.click(screen.getByTestId('memo-cancel'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).not.toHaveBeenCalled();
  });
});

describe('GotoPageDialog', () => {
  it('タイトルと現在ページを初期値にした入力欄を表示する', () => {
    const { dialog } = renderGoto();

    expect(screen.getByText('移動先ページの指定')).toBeInTheDocument();
    expect(within(dialog).getByTestId('goto-page-input')).toHaveValue('104');
  });

  it('範囲内の値を入力して 移動 を押すと onGoto を呼ぶ', async () => {
    const { user, props } = renderGoto();

    const input = screen.getByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, '105');
    await user.click(screen.getByTestId('goto-page-submit'));

    expect(props.onGoto).toHaveBeenCalledTimes(1);
    expect(props.onGoto).toHaveBeenCalledWith(105);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('入力欄で Enter を押しても同じように onGoto を呼ぶ', async () => {
    const { user, props } = renderGoto();

    const input = screen.getByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, '106{Enter}');

    expect(props.onGoto).toHaveBeenCalledTimes(1);
    expect(props.onGoto).toHaveBeenCalledWith(106);
  });

  it('最小 / 最大ページは移動できる', async () => {
    const { user, props } = renderGoto();

    const input = screen.getByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, '109');
    await user.click(screen.getByTestId('goto-page-submit'));

    expect(props.onGoto).toHaveBeenCalledWith(109);
  });

  it('範囲外の値では onGoto を呼ばない', async () => {
    const { user, props } = renderGoto();

    const input = screen.getByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, '120');
    await user.click(screen.getByTestId('goto-page-submit'));
    await user.clear(input);
    await user.type(input, '0{Enter}');

    expect(props.onGoto).not.toHaveBeenCalled();
  });

  it('数値でない入力では onGoto を呼ばない', async () => {
    const { user, props } = renderGoto();

    const input = screen.getByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, 'abc');
    await user.click(screen.getByTestId('goto-page-submit'));
    await user.clear(input);
    await user.click(screen.getByTestId('goto-page-submit'));

    expect(props.onGoto).not.toHaveBeenCalled();
  });

  it('キャンセルは onClose を呼ぶ', async () => {
    const { user, props } = renderGoto();

    await user.click(screen.getByTestId('goto-page-cancel'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onGoto).not.toHaveBeenCalled();
  });
});

describe('AboutDialog', () => {
  it('カタログ名と件数を表示する', () => {
    const { dialog } = renderAbout();

    expect(screen.getByText('バージョン情報')).toBeInTheDocument();
    expect(within(dialog).getByText('コミックマーケット96（ダミー）')).toBeInTheDocument();
    expect(within(dialog).getByText('コミックマーケット No. 96')).toBeInTheDocument();
    expect(within(dialog).getByText('ジャンル数: 20')).toBeInTheDocument();
    expect(within(dialog).getByText('サークル数: 180')).toBeInTheDocument();
    expect(within(dialog).getByText(/ダミーデータ/)).toBeInTheDocument();
  });

  it('カタログ未読み込みでも件数と代替文言を表示する', () => {
    const { dialog } = renderAbout({ info: null, genreCount: 0, circleCount: 0 });

    expect(within(dialog).getByText('（カタログが読み込まれていません）')).toBeInTheDocument();
    expect(within(dialog).getByText('コミックマーケット No. -')).toBeInTheDocument();
    expect(within(dialog).getByText('ジャンル数: 0')).toBeInTheDocument();
    expect(within(dialog).getByText('サークル数: 0')).toBeInTheDocument();
  });

  it('OK は onClose を呼ぶ', async () => {
    const { user, props } = renderAbout();

    await user.click(screen.getByTestId('about-ok'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  // 実物のダイアログはタイトルバーに × だけを出し、端のドラッグでもサイズを変えられない
  // (Window の minimizable / maximizable / resizable)。
  it('タイトルバーのボタンは × だけで、リサイズ ハンドルを持たない', () => {
    const { dialog } = renderAbout();

    const labels = Array.from(dialog.querySelectorAll('.title-bar-controls button')).map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Close']);
    expect(dialog.querySelectorAll('[class*="resize"]')).toHaveLength(0);
  });
});

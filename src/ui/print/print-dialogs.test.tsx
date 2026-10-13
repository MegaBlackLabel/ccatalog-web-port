import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PRINT_CUT_SETTINGS, PrintCutDialog } from './PrintCutDialog';
import type { PrintCutDialogProps, PrintCutSettings } from './PrintCutDialog';
import { PRINTERS, PrintDialog } from './PrintDialog';
import type { PrintDialogProps } from './PrintDialog';
import { DEFAULT_PRINT_LIST_SETTINGS, PrintListDialog } from './PrintListDialog';
import type { PrintListDialogProps, PrintListSettings, PrintTarget } from './PrintListDialog';
import { DEFAULT_PRINT_MAP_SETTINGS, PrintMapDialog } from './PrintMapDialog';
import type { PrintMapDialogProps, PrintMapSettings } from './PrintMapDialog';

/** 印刷範囲のフィクスチャ。既定から外した値にして、変更時に他の項目が保たれるかを見る。 */
const TARGET: PrintTarget = { days: [2], halls: ['東1'], colors: [3] };

const LIST_SETTINGS: PrintListSettings = { ...DEFAULT_PRINT_LIST_SETTINGS, target: TARGET };

const CUT_SETTINGS: PrintCutSettings = { ...DEFAULT_PRINT_CUT_SETTINGS, target: TARGET };

const MAP_SETTINGS: PrintMapSettings = { ...DEFAULT_PRINT_MAP_SETTINGS, target: TARGET };

function renderList(overrides: Partial<PrintListDialogProps> = {}) {
  const props: PrintListDialogProps = {
    settings: LIST_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintListDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-list-dialog') };
}

function renderCut(overrides: Partial<PrintCutDialogProps> = {}) {
  const props: PrintCutDialogProps = {
    settings: CUT_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintCutDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-cut-dialog') };
}

function renderMap(overrides: Partial<PrintMapDialogProps> = {}) {
  const props: PrintMapDialogProps = {
    settings: MAP_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintMapDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-map-dialog') };
}

function renderPrint(overrides: Partial<PrintDialogProps> = {}) {
  const props: PrintDialogProps = {
    documentName: 'サークルリスト (1日目 東1)',
    onPrint: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-dialog') };
}

describe('PrintListDialog', () => {
  it('タイトルと印刷範囲・印刷項目・改ページ・レイアウトの各コントロールを表示する', () => {
    const { dialog } = renderList();

    expect(screen.getByText('サークルリスト印刷')).toBeInTheDocument();
    // 印刷範囲 (日付 / ホール / チェック色)。
    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(dialog).getByLabelText('東1')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('西1')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('南4')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('色1')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('色9')).toBeInTheDocument();
    // 印刷項目と拡大チェック。
    expect(within(dialog).getByLabelText('サークル名')).toBeChecked();
    expect(within(dialog).getByLabelText('補足を拡大')).not.toBeChecked();
    expect(within(dialog).getByLabelText('メモを拡大')).not.toBeChecked();
    // 改ページとレイアウト。
    expect(within(dialog).getByText('印刷順 :')).toBeInTheDocument();
    expect(within(dialog).getByText('改ページ条件 :')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('サークル通し番号の印刷')).not.toBeChecked();
    expect(within(dialog).getByLabelText('チェック色一覧の印刷')).not.toBeChecked();
    expect(within(dialog).getByLabelText('ブロックの全サークルを印刷')).not.toBeChecked();
  });

  it('色の編集ボタンは無効 (チェック色ダイアログが担当する)', () => {
    const { dialog } = renderList();

    expect(within(dialog).getByRole('button', { name: '色の編集...' })).toBeDisabled();
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('日付のチェックを外すと days から外す', async () => {
    const { user, props, dialog } = renderList({
      settings: { ...LIST_SETTINGS, target: { ...TARGET, days: [1, 2] } },
    });

    await user.click(within(dialog).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('ホールのチェックを入れると halls に足す', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByLabelText('南4'));

    expect(props.onChange).toHaveBeenCalledWith({
      target: { ...TARGET, halls: ['東1', '南4'] },
    });
  });

  it('印刷項目のチェックを外すと items から外す', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByLabelText('サークル名'));

    expect(props.onChange).toHaveBeenCalledWith({
      items: ['読み', '執筆者', '発行誌', '位置', '日付', 'ジャンル'],
    });
  });

  it('改ページ条件を選ぶと pageBreakBy を変える', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByRole('radio', { name: 'ブロック' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakBy: 'block' });
  });

  it('レイアウトのチェックを入れると printSequenceNumber を立てる', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByLabelText('サークル通し番号の印刷'));

    expect(props.onChange).toHaveBeenCalledWith({ printSequenceNumber: true });
  });

  it('プレビューは現在の設定をそのまま渡す', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByTestId('print-list-preview'));

    expect(props.onPreview).toHaveBeenCalledTimes(1);
    expect(props.onPreview).toHaveBeenCalledWith(LIST_SETTINGS);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('閉じるは onClose を呼び、設定は変えない', async () => {
    const { user, props, dialog } = renderList();

    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onPreview).not.toHaveBeenCalled();
  });
});

describe('PrintCutDialog', () => {
  it('タイトルとカット印刷のコントロール (段数・倍率) を表示する', () => {
    const { dialog } = renderCut();

    expect(screen.getByText('サークルカット印刷')).toBeInTheDocument();
    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(dialog).getByLabelText('東1')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('南4')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('色1')).toBeInTheDocument();
    expect(within(dialog).getByTestId('print-cut-cuts-per-row')).toHaveValue('3');
    expect(within(dialog).getByTestId('print-cut-cut-scale')).toHaveValue('1');
    expect(within(dialog).getByLabelText('サークル通し番号の印刷')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('ブロックの全サークルを印刷')).toBeInTheDocument();
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, dialog } = renderCut();

    await user.click(within(dialog).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, dialog } = renderCut();

    await user.click(within(dialog).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('1ページの段数を変えると cutsPerRow を更新する', async () => {
    const { user, props, dialog } = renderCut();

    const input = within(dialog).getByTestId('print-cut-cuts-per-row');
    await user.clear(input);
    await user.type(input, '4');

    expect(props.onChange).toHaveBeenLastCalledWith({ cutsPerRow: 4 });
  });

  it('プレビューは現在の設定をそのまま渡す', async () => {
    const { user, props, dialog } = renderCut();

    await user.click(within(dialog).getByTestId('print-cut-preview'));

    expect(props.onPreview).toHaveBeenCalledTimes(1);
    expect(props.onPreview).toHaveBeenCalledWith(CUT_SETTINGS);
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderCut();

    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });
});

describe('PrintMapDialog', () => {
  it('タイトルとマップ印刷のコントロールを表示する', () => {
    const { dialog } = renderMap();

    expect(screen.getByText('マップ印刷')).toBeInTheDocument();
    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(dialog).getByLabelText('東1')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('南4')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('色1')).toBeInTheDocument();
    expect(within(dialog).getByTestId('print-map-zoom')).toHaveValue('1');
    expect(within(dialog).getByText('100%')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('サークル位置を印刷')).toBeChecked();
  });

  it('blank のときは白地図印刷のタイトルと注記を出す', () => {
    const { dialog } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    expect(screen.getByText('白地図印刷')).toBeInTheDocument();
    expect(screen.queryByText('マップ印刷')).not.toBeInTheDocument();
    expect(within(dialog).getByTestId('print-map-blank-note')).toBeInTheDocument();
  });

  it('blank でないときは白地図の注記を出さない', () => {
    const { dialog } = renderMap();

    expect(within(dialog).queryByTestId('print-map-blank-note')).not.toBeInTheDocument();
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, dialog } = renderMap();

    await user.click(within(dialog).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, dialog } = renderMap();

    await user.click(within(dialog).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('サークル位置を印刷のチェックを外すと printCircleMarkers を落とす', async () => {
    const { user, props, dialog } = renderMap();

    await user.click(within(dialog).getByLabelText('サークル位置を印刷'));

    expect(props.onChange).toHaveBeenCalledWith({ printCircleMarkers: false });
  });

  it('表示倍率を変えると zoom を更新する', async () => {
    const { user, props, dialog } = renderMap();

    const input = within(dialog).getByTestId('print-map-zoom');
    await user.clear(input);
    await user.type(input, '0.5');

    expect(props.onChange).toHaveBeenLastCalledWith({ zoom: 0.5 });
  });

  it('プレビューは現在の設定をそのまま渡す', async () => {
    const { user, props, dialog } = renderMap();

    await user.click(within(dialog).getByTestId('print-map-preview'));

    expect(props.onPreview).toHaveBeenCalledWith(MAP_SETTINGS);
  });

  it('閉じるは onClose を呼ぶ', async () => {
    const { user, props, dialog } = renderMap();

    await user.click(within(dialog).getByRole('button', { name: '閉じる' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });
});

describe('PrintDialog', () => {
  it('タイトルとダミーのプリンタ一覧、文書名を表示する', () => {
    const { dialog } = renderPrint();

    expect(screen.getByText('印刷')).toBeInTheDocument();
    expect(PRINTERS).toHaveLength(3);
    expect(within(dialog).getAllByRole('option')).toHaveLength(3);
    expect(within(dialog).getByTestId('print-printer')).toHaveValue(PRINTERS[0]);
    expect(within(dialog).getByTestId('print-document-name')).toHaveTextContent(
      'サークルリスト (1日目 東1)',
    );
  });

  it('OK は選択中のプリンタで onPrint を呼ぶ', async () => {
    const { user, props, dialog } = renderPrint();

    await user.click(within(dialog).getByTestId('print-submit'));

    expect(props.onPrint).toHaveBeenCalledTimes(1);
    expect(props.onPrint).toHaveBeenCalledWith(PRINTERS[0]);
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('プリンタを選び直すとその名前で onPrint を呼ぶ', async () => {
    const { user, props, dialog } = renderPrint();

    await user.selectOptions(within(dialog).getByTestId('print-printer'), PRINTERS[1]);
    await user.click(within(dialog).getByTestId('print-submit'));

    expect(props.onPrint).toHaveBeenCalledWith(PRINTERS[1]);
  });

  it('キャンセルは onClose を呼び、印刷はしない', async () => {
    const { user, props, dialog } = renderPrint();

    await user.click(within(dialog).getByTestId('print-cancel'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onPrint).not.toHaveBeenCalled();
  });
});

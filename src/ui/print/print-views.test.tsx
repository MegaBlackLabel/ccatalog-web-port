import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ExportResultDialogProps } from '../dialog/ExportResultDialog';
import { ExportResultDialog } from '../dialog/ExportResultDialog';
import { ImageFileOutputDialog } from './ImageFileOutputDialog';
import type { ImageFileOutputDialogProps } from './ImageFileOutputDialog';
import type { ImageFormat } from './ImageFileOutputDialog';
import { PrintPreviewWindow } from './PrintPreviewWindow';
import type { PrintPreviewWindowProps } from './PrintPreviewWindow';
import { PrintProgressDialog } from './PrintProgressDialog';
import type { PrintProgressDialogProps } from './PrintProgressDialog';

/** ダイアログ 197 の出力ファイル形式 (BMP / PNG / JPG)。 */
const ALL_FORMATS: readonly ImageFormat[] = ['bmp', 'png', 'jpg'];

function renderPreview(overrides: Partial<PrintPreviewWindowProps> = {}) {
  const props: PrintPreviewWindowProps = {
    pageCount: 3,
    pageNo: 2,
    zoom: 1,
    onZoomChange: vi.fn(),
    onPageChange: vi.fn(),
    onPrint: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintPreviewWindow {...props} />);
  return { user, props, dialog: view.getByTestId('print-preview-window') };
}

function renderProgress(overrides: Partial<PrintProgressDialogProps> = {}) {
  const props: PrintProgressDialogProps = {
    percent: 40,
    onCancel: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintProgressDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-progress-dialog') };
}

function renderImageOutput(overrides: Partial<ImageFileOutputDialogProps> = {}) {
  const props: ImageFileOutputDialogProps = {
    format: 'bmp',
    directory: 'C:\\dump',
    pageFrom: 1,
    pageTo: 3,
    maxPage: 10,
    onChange: vi.fn(),
    onOutput: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<ImageFileOutputDialog {...props} />);
  return { user, props, dialog: view.getByTestId('image-output-dialog') };
}

function renderExportResult(overrides: Partial<ExportResultDialogProps> = {}) {
  const props: ExportResultDialogProps = {
    failures: [],
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<ExportResultDialog {...props} />);
  return { user, props, dialog: view.getByTestId('export-result-dialog') };
}

describe('PrintPreviewWindow (ダイアログ 300)', () => {
  it('ページ番号と総ページ数をステータスバーに出す', () => {
    const { dialog } = renderPreview({ pageNo: 2, pageCount: 3 });
    expect(dialog).toHaveTextContent('2 / 3');
  });

  it('元のコントロール ID を保つ (3011〜3020)', () => {
    const { dialog } = renderPreview();
    for (const controlId of [3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('前頁 / 次頁 で前後のページを要求する', async () => {
    const { user, props } = renderPreview({ pageNo: 2, pageCount: 3 });
    await user.click(screen.getByRole('button', { name: '前頁' }));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: '次頁' }));
    expect(props.onPageChange).toHaveBeenCalledWith(3);
  });

  it('先頭ページでは前頁が無効になる', () => {
    renderPreview({ pageNo: 1, pageCount: 3 });
    expect(screen.getByRole('button', { name: '前頁' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '次頁' })).toBeEnabled();
  });

  it('最終ページでは次頁が無効になる', () => {
    renderPreview({ pageNo: 3, pageCount: 3 });
    expect(screen.getByRole('button', { name: '前頁' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '次頁' })).toBeDisabled();
  });

  it('ZOOM 2 で onZoomChange(2) を呼ぶ', async () => {
    const { user, props } = renderPreview({ zoom: 1 });
    await user.click(screen.getByRole('button', { name: 'ZOOM 2' }));
    expect(props.onZoomChange).toHaveBeenCalledWith(2);
  });

  it('印刷で onPrint を呼ぶ', async () => {
    const { user, props } = renderPreview();
    await user.click(screen.getByTestId('preview-print'));
    expect(props.onPrint).toHaveBeenCalledTimes(1);
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props } = renderPreview();
    await user.click(screen.getByRole('button', { name: '閉じる' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('プレビュー画像の src に imageUrl を使う', () => {
    renderPreview({ imageUrl: '/cuts/CUT0001.png' });
    expect(screen.getByTestId('preview-image')).toHaveAttribute('src', '/cuts/CUT0001.png');
  });

  it('imageUrl の既定は同梱ダミーの西12 マップ', () => {
    renderPreview();
    expect(screen.getByTestId('preview-image')).toHaveAttribute('src', '/maps/W12.png');
  });

  it('倍率に応じてプレビュー画像を拡大する', () => {
    renderPreview({ zoom: 2 });
    expect(screen.getByTestId('preview-image')).toHaveStyle({ width: '200%' });
  });

  it('imageUrl が空なら画像を出さず枠だけになる', () => {
    renderPreview({ imageUrl: '' });
    expect(screen.queryByTestId('preview-image')).toBeNull();
  });
});

describe('PrintProgressDialog (ダイアログ 181 / 301)', () => {
  it('進捗値とパーセント表示をそのまま出す', () => {
    const { dialog } = renderProgress({ percent: 40 });
    const bar = screen.getByTestId('print-progress');
    expect(bar).toHaveAttribute('max', '100');
    expect(bar).toHaveAttribute('value', '40');
    expect(within(dialog).getByTestId('print-progress-message')).toHaveTextContent('40%');
  });

  it('message を渡すとその文言を出す', () => {
    const { dialog } = renderProgress({ percent: 40, message: '印刷中です。 (40%)' });
    expect(within(dialog).getByTestId('print-progress-message')).toHaveTextContent(
      '印刷中です。 (40%)',
    );
  });

  it('元のコントロール ID を保つ (1600 / 1601 / 2)', () => {
    const { dialog } = renderProgress();
    for (const controlId of [2, 1600, 1601]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('キャンセルで onCancel を呼ぶ', async () => {
    const { user, props } = renderProgress();
    await user.click(screen.getByTestId('print-cancel'));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ImageFileOutputDialog (ダイアログ 197)', () => {
  it('出力パス・形式・出力範囲のコントロールを持つ', () => {
    const { dialog } = renderImageOutput();
    expect(screen.getByTestId('image-output-directory')).toHaveValue('C:\\dump');
    expect(within(dialog).getByRole('radio', { name: 'BMP' })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: 'PNG' })).not.toBeChecked();
    expect(screen.getByTestId('image-output-page-from')).toHaveValue(1);
    expect(screen.getByTestId('image-output-page-to')).toHaveValue(3);
    expect(screen.getByRole('button', { name: '参照...' })).toBeDisabled();
  });

  it('元のコントロール ID を保つ (197 の主要コントロール)', () => {
    const { dialog } = renderImageOutput();
    for (const controlId of [1, 2, 1072, 1075, 1630, 1631, 1637, 1639, 1751, 1752]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('PNG を選ぶと onChange({ format: "png" }) を呼ぶ', async () => {
    const { user, props } = renderImageOutput();
    await user.click(screen.getByRole('radio', { name: 'PNG' }));
    expect(props.onChange).toHaveBeenCalledWith({ format: 'png' });
  });

  it.each(ALL_FORMATS)('%s の拡張子を注意書きに出す', (format) => {
    renderImageOutput({ format });
    expect(screen.getByTestId('image-output-note')).toHaveTextContent(
      `※ ページ番号と拡張子".${format}"が付加されます。`,
    );
  });

  it('範囲内のページ入力は onChange に反映する', async () => {
    const { user, props } = renderImageOutput({ pageFrom: 2, pageTo: 3, maxPage: 5 });
    const from = screen.getByTestId('image-output-page-from');
    await user.clear(from);
    await user.type(from, '4');
    expect(props.onChange).toHaveBeenCalledWith({ pageFrom: 4 });
  });

  it('範囲外や数値でないページ入力では onChange を呼ばない', async () => {
    const { user, props } = renderImageOutput({ pageFrom: 2, pageTo: 3, maxPage: 5 });
    const to = screen.getByTestId('image-output-page-to');
    await user.clear(to);
    await user.type(to, '0');
    expect(props.onChange).not.toHaveBeenCalled();
    await user.clear(to);
    await user.type(to, '999');
    expect(props.onChange).not.toHaveBeenCalled();
    await user.clear(to);
    await user.type(to, 'abc');
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('出力で onOutput を呼ぶ', async () => {
    const { user, props } = renderImageOutput({ pageFrom: 1, pageTo: 3 });
    await user.click(screen.getByTestId('image-output-submit'));
    expect(props.onOutput).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('開始ページが終了ページより大きいときは入れ替えて出力する', async () => {
    const { user, props } = renderImageOutput({ pageFrom: 5, pageTo: 2, maxPage: 10 });
    await user.click(screen.getByTestId('image-output-submit'));
    expect(props.onChange).toHaveBeenCalledWith({ pageFrom: 2, pageTo: 5 });
    expect(props.onOutput).toHaveBeenCalledTimes(1);
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props } = renderImageOutput();
    await user.click(screen.getByTestId('image-output-close'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ExportResultDialog (ダイアログ 1539)', () => {
  it('失敗したサークル名を一覧に出す', () => {
    const { dialog } = renderExportResult({ failures: ['サークルA', 'サークルB'] });
    const rows = within(dialog).getAllByTestId('export-failure');
    expect(rows.map((row) => row.textContent)).toEqual(['サークルA', 'サークルB']);
    expect(within(dialog).getByText('以下のサークルのエクスポートは失敗しました')).toBeInTheDocument();
  });

  it('元のコントロール ID を保つ (1635 / 7077989 / 1)', () => {
    const { dialog } = renderExportResult({ failures: ['サークルA'] });
    for (const controlId of [1, 1635, 7077989]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('失敗が無ければすべて成功しましたと出す', () => {
    const { dialog } = renderExportResult({ failures: [] });
    expect(within(dialog).getByText('すべて成功しました')).toBeInTheDocument();
    expect(within(dialog).queryAllByTestId('export-failure')).toHaveLength(0);
  });

  it('OK で onClose を呼ぶ', async () => {
    const { user, props } = renderExportResult({ failures: ['サークルA'] });
    await user.click(screen.getByTestId('export-result-ok'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ExportResultDialogProps } from '../dialog/ExportResultDialog';
import { ExportResultDialog } from '../dialog/ExportResultDialog';
import { ImageFileOutputDialog } from './ImageFileOutputDialog';
import type { ImageFileOutputDialogProps } from './ImageFileOutputDialog';
import { PrintPreviewWindow } from './PrintPreviewWindow';
import type { PrintPreviewWindowProps } from './PrintPreviewWindow';
import { PrintProgressDialog } from './PrintProgressDialog';
import type { PrintProgressDialogProps } from './PrintProgressDialog';

function renderPreview(overrides: Partial<PrintPreviewWindowProps> = {}) {
  const props: PrintPreviewWindowProps = {
    pageCount: 3,
    pageNo: 2,
    zoom: 1,
    onZoomChange: vi.fn(),
    onPageChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<PrintPreviewWindow {...props} />);
  return { user, props, dialog: view.getByTestId('print-preview-window') };
}

function renderProgress(overrides: Partial<PrintProgressDialogProps> = {}) {
  const props: PrintProgressDialogProps = {
    percent: 40,
    onCancel: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<PrintProgressDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-progress-dialog') };
}

function renderImageOutput(overrides: Partial<ImageFileOutputDialogProps> = {}) {
  const props: ImageFileOutputDialogProps = {
    directory: 'C:\\dump',
    baseName: 'ccatalog',
    format: 'bmp',
    longSide: 0,
    highResolution: false,
    allPages: true,
    pageSpec: '1',
    outputFormat: 'list',
    noGdiPlus: false,
    maxPage: 10,
    onChange: vi.fn(),
    onOutput: vi.fn(),
    onPreview: vi.fn(),
    onOpenDetails: vi.fn(),
    onHelp: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<ImageFileOutputDialog {...props} />);
  return { user, props, dialog: view.getByTestId('image-output-dialog') };
}

function renderExportResult(overrides: Partial<ExportResultDialogProps> = {}) {
  const props: ExportResultDialogProps = {
    failures: [],
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  const view = render(<ExportResultDialog {...props} />);
  return { user, props, dialog: view.getByTestId('export-result-dialog') };
}

describe('PrintPreviewWindow (ダイアログ 300)', () => {
  it('ページ指定は現在ページを出し、その右に総ページ数を出す', () => {
    const { dialog } = renderPreview({ pageNo: 2, pageCount: 3 });
    expect(within(dialog).getByTestId('preview-page-select')).toHaveValue('2');
    expect(within(dialog).getByTestId('preview-page-count')).toHaveTextContent('/ 3');
  });

  it('元のコントロール ID を保つ (3011〜3020)', () => {
    const { dialog } = renderPreview();
    for (const controlId of [3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3023]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('前頁 / 次頁 で前後のページを要求する', async () => {
    const { user, props } = renderPreview({ pageNo: 2, pageCount: 3 });
    await user.click(screen.getByRole('button', { name: '前頁(P)' }));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: '次頁(N)' }));
    expect(props.onPageChange).toHaveBeenCalledWith(3);
  });

  it('先頭ページでは前頁が無効になる', () => {
    renderPreview({ pageNo: 1, pageCount: 3 });
    expect(screen.getByRole('button', { name: '前頁(P)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '次頁(N)' })).toBeEnabled();
  });

  it('最終ページでは次頁が無効になる', () => {
    renderPreview({ pageNo: 3, pageCount: 3 });
    expect(screen.getByRole('button', { name: '前頁(P)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '次頁(N)' })).toBeDisabled();
  });

  it('表示倍率は ×1/4 〜 ×4 の 5 段で、押した倍率をそのまま要求する', async () => {
    const { user, props } = renderPreview({ zoom: 1 });

    await user.click(screen.getByRole('button', { name: '×2' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByRole('button', { name: '×1/4' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.25);

    await user.click(screen.getByRole('button', { name: '×4' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(4);
  });

  it('今の倍率のボタンだけが押された状態になる', () => {
    renderPreview({ zoom: 2 });

    expect(screen.getByRole('button', { name: '×2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '×1' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('ボタン列は実物のツールバーと同じ並びで出る (倍率 / 前頁 / ページ指定 / 次頁 / 閉じる)', () => {
    renderPreview();

    const row = screen.getByTestId('preview-button-row');
    expect([...row.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'))).toEqual([
      '×1/4',
      '×1/2',
      '×1',
      '×2',
      '×4',
      '前頁(P)',
      '次頁(N)',
      '閉じる(X)',
    ]);
    // 実物ツールバーと同じく、倍率 / 前頁 / 次頁 / 閉じるはアイコン (16x16 の SVG) を持つ。
    const icons = [...row.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(icons).toHaveLength(8);
    for (const src of icons) expect(src).toMatch(/^data:image\/svg\+xml/);
    // ページ指定はコンボ (選択の値は「現在ページ : 総ページ数」)。
    expect(within(row).getByTestId('preview-page-select')).toHaveValue('2');
    expect(within(row).getByTestId('preview-page-count')).toHaveTextContent('/ 3');
    // 元実装のプレビューに印刷ボタンは無い。
    expect(within(row).queryByRole('button', { name: '印刷' })).toBeNull();
    // ボタン列はプレビュー面より上にある。
    const area = screen.getByTestId('preview-area');
    expect(row.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const select = screen.getByTestId('preview-page-select');
    expect(select.closest('[data-ctrl-id="3011"]')).toBeNull();
  });

  it('ページ指定のセレクトでそのページを要求する', async () => {
    const { user, props } = renderPreview({ pageNo: 2, pageCount: 5 });

    await user.selectOptions(screen.getByTestId('preview-page-select'), '4');

    expect(props.onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props } = renderPreview();
    await user.click(screen.getByRole('button', { name: '閉じる(X)' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('チェック色の凡例はウィンドウの下に置き、5 列で色と名前を出す', () => {
    const { dialog } = renderPreview({
      checkColors: ['#ff944a', '#ff00ff', '#fff700'],
      checkColorNames: ['', 'オレンジ', ''],
    });

    const legend = within(dialog).getByTestId('preview-check-colors');
    // プレビュー面より後ろ (ウィンドウの下) に置く。
    const area = within(dialog).getByTestId('preview-area');
    expect(area.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // 色 3 個ぶんを並べ、名前が無い色は「(名称未登録)」。
    expect(legend.children).toHaveLength(3);
    expect(legend).toHaveTextContent('(名称未登録)');
    expect(legend).toHaveTextContent('オレンジ');
  });

  it('チェック色を渡さなければ凡例を出さない', () => {
    renderPreview();
    expect(screen.queryByTestId('preview-check-colors')).toBeNull();
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
  it('元実装のコントロールを持つ (518 x 429 = クライアント 508 x 405)', () => {
    const { dialog } = renderImageOutput();

    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);
    expect(root.style.width).toBe('518px');
    expect(root.style.height).toBe('429px');

    expect(screen.getByTestId('image-output-directory')).toHaveValue('C:\\dump');
    expect(screen.getByTestId('image-output-name')).toHaveValue('ccatalog');
    expect(screen.getByTestId('image-output-format')).toHaveValue('bmp');
    expect(screen.getByTestId('image-output-long-side')).toHaveValue('0');
    // ページ指定は 2 つの数値入力 (1 - 1)。
    expect(screen.getByTestId('image-output-page-from')).toHaveValue('1');
    expect(screen.getByTestId('image-output-page-to')).toHaveValue('1');
    // 出力パスの「参照(C)...」はブラウザからフォルダを辿れないので無効。
    expect(screen.getByRole('button', { name: '参照(C)...' })).toBeDisabled();
  });

  it('実物のラベル (アクセラレータ) と注記を出す', () => {
    const { dialog } = renderImageOutput();

    for (const label of [
      '出力パス(P) :',
      '出力ファイル名(B) :',
      '出力ファイル形式(F) :',
      '長辺のサイズ(S) :',
      'すべて(A)',
      'ページ指定(G) :',
      'サークルリスト印刷(I)',
      'サークルカット印刷(U)',
      'マップ印刷(M)',
      '白地図印刷(W)',
      'GDI+を使用しないで印刷(B)',
      '高解像度で出力(H)',
    ]) {
      expect(within(dialog).getByText(label)).toBeInTheDocument();
    }
    for (const button of ['参照(C)...', '詳細設定(N)...', '説明(R)...', 'プレビュー(V)', 'OK', 'キャンセル']) {
      expect(within(dialog).getByRole('button', { name: button })).toBeInTheDocument();
    }
    expect(within(dialog).getByText('ピクセル (0, 1〜9999)')).toBeInTheDocument();
    expect(within(dialog).getByText('※ 0を指定すると、原寸で出力します。')).toBeInTheDocument();
  });

  it('説明 (1050) は凹んだ枠で、高さを固定する', async () => {
    const { user, dialog } = renderImageOutput();
    const description = within(dialog).getByTestId('image-output-description');

    expect(description.className).toContain('sunken-panel');
    expect(description.style.height).toBe('32px');

    for (const name of ['白地図印刷(W)', 'マップ印刷(M)']) {
      await user.click(within(dialog).getByRole('radio', { name }));
      expect(within(dialog).getByTestId('image-output-description').style.height).toBe('32px');
    }
  });

  it('元のコントロール ID を保つ (197 のコントロール)', () => {
    const { dialog } = renderImageOutput();
    for (const controlId of [
      1, 2, 1042, 1046, 1048, 1049, 1051, 1052, 1053, 1056, 1058, 1072, 1075,
      1630, 1631, 1632, 1633, 1637, 1639, 1646, 1705, 1751, 1752,
    ]) {
      expect(
        dialog.querySelector(`[data-ctrl-id="${controlId}"]`),
        String(controlId),
      ).not.toBeNull();
    }
  });

  it('出力ファイル形式を変えると onChange と注意書きの拡張子が変わる', async () => {
    const { user, props } = renderImageOutput();

    await user.selectOptions(screen.getByTestId('image-output-format'), 'png');

    expect(props.onChange).toHaveBeenCalledWith({ format: 'png' });
  });

  it.each(['bmp', 'png', 'jpg'] as const)('%s の拡張子を注意書きに出す', (format) => {
    renderImageOutput({ format });
    expect(screen.getByTestId('image-output-note')).toHaveTextContent(
      `※ ページ番号と拡張子".${format}"が付加されます。`,
    );
  });

  it('長辺のサイズは 0〜9999 のときだけ onChange に出す', async () => {
    const onChange = vi.fn();
    const { user } = renderImageOutput({ onChange });
    const input = screen.getByTestId('image-output-long-side');

    await user.clear(input);
    await user.type(input, '1200');
    expect(onChange).toHaveBeenLastCalledWith({ longSide: 1200 });

    onChange.mockClear();
    await user.clear(input);
    await user.type(input, '10000');
    expect(onChange).not.toHaveBeenCalledWith({ longSide: 10000 });

    onChange.mockClear();
    await user.clear(input);
    await user.type(input, 'abc');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('出力範囲は「すべて」が既定で、ページ指定にすると onChange に出す', async () => {
    const { user, props } = renderImageOutput();

    expect(screen.getByRole('radio', { name: 'すべて(A)' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'ページ指定(G) :' }));

    expect(props.onChange).toHaveBeenCalledWith({ allPages: false });
  });

  it('ページ指定は 2 つの数値入力で、範囲を "3-5" の形で出す', async () => {
    const { user, props } = renderImageOutput({ allPages: false, pageSpec: '3-5' });

    expect(screen.getByRole('radio', { name: 'ページ指定(G) :' })).toBeChecked();
    const from = screen.getByTestId('image-output-page-from');
    const to = screen.getByTestId('image-output-page-to');
    expect(from).toHaveValue('3');
    expect(to).toHaveValue('5');

    await user.clear(from);
    await user.type(from, '2');

    expect(props.onChange).toHaveBeenLastCalledWith({ pageSpec: '2-5' });
  });

  it('ページ範囲が数値でないうちは onChange に出さない', async () => {
    const onChange = vi.fn();
    const { user } = renderImageOutput({ allPages: false, pageSpec: '1-3', onChange });

    const to = screen.getByTestId('image-output-page-to');
    await user.clear(to);

    expect(onChange).not.toHaveBeenCalled();
    expect(to).toHaveValue('');
  });

  it('有効範囲とページ指定の説明を出す', () => {
    renderImageOutput({ maxPage: 108 });
    expect(screen.getByText('(有効範囲 : 1-108)')).toBeInTheDocument();
    expect(
      screen.getByText('ページ番号・範囲を、コンマ区切りで入力してください （例 : 1, 3-5）'),
    ).toBeInTheDocument();
  });

  it('出力形式を選ぶと onChange に出す', async () => {
    const { user, props } = renderImageOutput();
    expect(screen.getByTestId('image-output-dialog')).toHaveTextContent(
      'チェックリストに登録されているサークルを、画像なしの一覧表形式で印刷します。',
    );

    await user.click(screen.getByRole('radio', { name: '白地図印刷(W)' }));

    expect(props.onChange).toHaveBeenCalledWith({ outputFormat: 'blankMap' });
  });

  it.each([
    ['blankMap', '会場マップのみを印刷します。'],
    ['cut', 'チェックリストに登録されているサークルを、サークルカット画像付きで印刷します。'],
    ['map', '会場マップを、チェックリストに登録されているサークルの配置情報と共に印刷します。'],
  ] as const)('出力形式 %s の説明を出す', (outputFormat, description) => {
    renderImageOutput({ outputFormat });
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('OK / キャンセル / プレビュー / 説明 / 詳細設定 を通知する', async () => {
    const { user, props } = renderImageOutput();

    await user.click(screen.getByTestId('image-output-submit'));
    expect(props.onOutput).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('image-output-preview'));
    expect(props.onPreview).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('image-output-help'));
    expect(props.onHelp).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('image-output-details'));
    expect(props.onOpenDetails).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('image-output-cancel'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('高解像度で出力と GDI+ を使用しないで印刷を切り替える', async () => {
    const { user, props } = renderImageOutput();

    await user.click(screen.getByLabelText('高解像度で出力(H)'));
    expect(props.onChange).toHaveBeenCalledWith({ highResolution: true });

    await user.click(screen.getByLabelText('GDI+を使用しないで印刷(B)'));
    expect(props.onChange).toHaveBeenCalledWith({ noGdiPlus: true });
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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CHECK_COLOR_SETTINGS } from '../../domain/app-settings';
import { CheckColorDialog } from './CheckColorDialog';
import type { CheckColorDialogProps } from './CheckColorDialog';

function renderDialog(overrides: Partial<CheckColorDialogProps> = {}) {
  const props: CheckColorDialogProps = {
    checkColors: DEFAULT_CHECK_COLOR_SETTINGS,
    onChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<CheckColorDialog {...props} />);
  return { user, props, dialog: screen.getByTestId('check-color-dialog') };
}

describe('CheckColorDialog (ダイアログ 149 チェック色)', () => {
  it('元実装のコントロールを持つ (431 x 577)', () => {
    const { dialog } = renderDialog();

    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);
    expect(root.style.width).toBe('431px');
    expect(root.style.height).toBe('577px');

    // 編集するチェック色 / 色の編集 / チェック色名の編集 (元のコントロール ID)。
    for (const controlId of [1702, 1665, 1636, 1038, 1711]) {
      expect(dialog.querySelector(`[data-ctrl-id="${controlId}"]`), String(controlId)).not.toBeNull();
    }
    // 表示色 9 + 印刷色 9 (1020〜1037)。
    for (const controlId of [...Array(18)].map((_, index) => 1020 + index)) {
      expect(dialog.querySelector(`[data-ctrl-id="${controlId}"]`), String(controlId)).not.toBeNull();
    }
    expect(within(dialog).getAllByTestId('display-color-1')).toHaveLength(1);
    expect(within(dialog).getAllByTestId('print-color-9')).toHaveLength(1);
  });

  it('編集するチェック色を切り替えると onChange に出す', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');

    expect(props.onChange).toHaveBeenCalledWith({ editTarget: 'current' });
  });

  it('色の名称を編集すると names の patch を出す (32 文字まで)', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('名称を編集する色'), '3');
    const input = within(dialog).getByLabelText('色の名称');
    await user.type(input, 'あ');

    expect(input).toHaveAttribute('maxlength', '32');
    expect(props.onChange).toHaveBeenCalledWith({ names: ['', '', 'あ', '', '', '', '', '', ''] });
  });

  it('表示色のボタンは色パレットを開き、選んだ色を表示色に入れる', async () => {
    const { user, props, dialog } = renderDialog();

    await user.click(within(dialog).getByTestId('display-color-1'));
    const palette = await screen.findByTestId('color-palette-dialog');
    await user.click(within(palette).getByRole('button', { name: '#ff0000' }));
    await user.click(within(palette).getByTestId('palette-ok'));

    // 既定色 (実測の 9 色) の 1 番目だけ差し替える。
    expect(props.onChange).toHaveBeenCalledWith({
      display: ['#ff0000', '#ff00ff', '#fff700', '#00b54a', '#00b5ff', '#9c529c', '#0000ff', '#00ff00', '#ff0000'],
    });
    expect(screen.queryByTestId('color-palette-dialog')).not.toBeInTheDocument();
  });

  it('印刷色は未設定なら表示色を使い、編集すると print の patch を出す', async () => {
    const { user, props, dialog } = renderDialog();
    const print = within(dialog).getByTestId('print-color-2');

    // 既定は表示色 (= 実測の 9 色) と同じ。
    expect(print).toHaveStyle({ background: '#ff00ff' });

    await user.click(print);
    const palette = await screen.findByTestId('color-palette-dialog');
    await user.click(within(palette).getByRole('button', { name: '#00ff00' }));
    await user.click(within(palette).getByTestId('palette-ok'));

    expect(props.onChange).toHaveBeenCalledWith({
      print: ['#ff944a', '#00ff00', '#fff700', '#00b54a', '#00b5ff', '#9c529c', '#0000ff', '#00ff00', '#ff0000'],
    });
  });

  it('デフォルト色に戻すは表示色・印刷色・名称を既定に戻す', async () => {
    const { user, props, dialog } = renderDialog();

    await user.click(within(dialog).getByTestId('preferences-color-reset'));

    expect(props.onChange).toHaveBeenCalledWith({ display: [], print: [], names: [] });
  });

  it('Macデフォルト色に戻すは標準の設定値を編集中は無効', async () => {
    const { user, props, dialog } = renderDialog();
    const macReset = within(dialog).getByTestId('preferences-color-mac-reset');

    expect(macReset).toBeDisabled();
    await user.click(macReset);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('現在のチェックリスト編集中は Macデフォルト色に戻すで標準の設定値に戻せる', async () => {
    // CHM 5CONFIG/4COLORS.HTM: 現在のチェックリスト編集中は「標準の設定値」に戻す。
    const { user, props, dialog } = renderDialog({
      checkColors: { ...DEFAULT_CHECK_COLOR_SETTINGS, editTarget: 'current' },
    });
    const macReset = within(dialog).getByTestId('preferences-color-mac-reset');

    expect(macReset).toBeEnabled();
    await user.click(macReset);

    expect(props.onChange).toHaveBeenCalledWith({ display: [], print: [], names: [] });
  });

  it('閉じるで onClose を呼ぶ', async () => {
    const { user, props } = renderDialog();

    await user.click(screen.getByTestId('check-color-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

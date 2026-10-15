import { render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
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

/** 適用(A) を押す (編集を親へ出す)。 */
async function applyEdit(user: UserEvent) {
  await user.click(screen.getByTestId('check-color-apply'));
}

describe('CheckColorDialog (実物の「チェック色の編集」プロパティシート)', () => {
  it('実物と同じ体裁 (タイトル / タブ / OK・キャンセル・適用)', () => {
    const { dialog } = renderDialog();

    // 実物のタイトルは「チェック色の編集」(メニューのチェック色の編集と同じ)。
    expect(within(dialog).getByText('チェック色の編集')).toBeInTheDocument();
    // プロパティシートなのでタブを 1 つ持つ (実物のページ名は「チェック色」)。
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['チェック色']);
    // 下部は OK / キャンセル / 適用(A) (実物は「閉じる」ではない)。
    expect(within(dialog).getByTestId('check-color-ok')).toHaveTextContent('OK');
    expect(within(dialog).getByTestId('check-color-cancel')).toHaveTextContent('キャンセル');
    expect(within(dialog).getByTestId('check-color-apply')).toHaveTextContent('適用(A)');
    // 変更が無い間は「適用」を使えない (実物のプロパティシートと同じ)。
    expect(within(dialog).getByTestId('check-color-apply')).toBeDisabled();
  });

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

  it('元実装のニーモニックを表示する', () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText('編集するチェック色(S) :')).toBeInTheDocument();
    expect(within(dialog).getByText('色の編集(C)')).toBeInTheDocument();
    expect(within(dialog).getByText('チェック色名の編集(E)')).toBeInTheDocument();
    expect(within(dialog).getByText('名称(N) :')).toBeInTheDocument();
    expect(within(dialog).getByTestId('preferences-color-reset')).toHaveTextContent(
      '標準の設定に戻す(R)',
    );
    expect(within(dialog).getByTestId('preferences-color-mac-reset')).toHaveTextContent(
      'Macデフォルト色に戻す(M)',
    );
  });

  it('「色1」〜「色9」の見出しは、色のボタンと同じ位置から始まる', () => {
    const { dialog } = renderDialog();

    // 見出し行と表示色の行は、どちらも「表示色 :」と同じ幅の先頭スペーサを持つ
    // (実物は色のボタンの真上に見出しが並ぶ)。
    const labels = within(dialog).getByTestId('check-color-labels');
    const displayRow = within(dialog).getByTestId('check-color-display-row');
    expect((labels.firstElementChild as HTMLElement).style.width).toBe('56px');
    expect((displayRow.firstElementChild as HTMLElement).style.width).toBe('56px');
  });

  it('下部ボタンは右寄せ (実物は右端揃え)', () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByTestId('check-color-actions')).toHaveStyle({
      justifyContent: 'flex-end',
    });
  });

  it('編集は適用(A)を押すまで親に出ない', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');

    expect(props.onChange).not.toHaveBeenCalled();

    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({ editTarget: 'current' });
  });

  it('変更すると適用(A)が使えるようになる', async () => {
    const { user, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');

    expect(within(dialog).getByTestId('check-color-apply')).toBeEnabled();
  });

  it('OK は編集を親に出して閉じる', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');
    await user.click(within(dialog).getByTestId('check-color-ok'));

    expect(props.onChange).toHaveBeenCalledWith({ editTarget: 'current' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('キャンセルは編集を捨てて閉じる', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');
    await user.click(within(dialog).getByTestId('check-color-cancel'));

    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('適用(A) は親に出すが閉じない', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('編集するチェック色'), 'current');
    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({ editTarget: 'current' });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('色の名称を編集すると names の patch を出す (32 文字まで)', async () => {
    const { user, props, dialog } = renderDialog();

    await user.selectOptions(within(dialog).getByLabelText('名称を編集する色'), '3');
    const input = within(dialog).getByLabelText('色の名称');
    await user.type(input, 'あ');

    expect(input).toHaveAttribute('maxlength', '32');

    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({ names: ['', '', 'あ', '', '', '', '', '', ''] });
  });

  it('表示色のボタンは色パレットを開き、選んだ色を表示色に入れる', async () => {
    const { user, props, dialog } = renderDialog();

    await user.click(within(dialog).getByTestId('display-color-1'));
    const palette = await screen.findByTestId('color-palette-dialog');
    await user.click(within(palette).getByRole('button', { name: '#ff0000' }));
    await user.click(within(palette).getByTestId('palette-ok'));

    await applyEdit(user);

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

    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({
      print: ['#ff944a', '#00ff00', '#fff700', '#00b54a', '#00b5ff', '#9c529c', '#0000ff', '#00ff00', '#ff0000'],
    });
  });

  it('デフォルト色に戻すは表示色・印刷色・名称を既定に戻す', async () => {
    const { user, props, dialog } = renderDialog();

    await user.click(within(dialog).getByTestId('preferences-color-reset'));
    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({ display: [], print: [], names: [] });
  });

  it('Macデフォルト色に戻すは標準の設定値を編集中は無効', async () => {
    const { user, props, dialog } = renderDialog();
    const macReset = within(dialog).getByTestId('preferences-color-mac-reset');

    expect(macReset).toBeDisabled();
    await user.click(macReset);
    await applyEdit(user);
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
    await applyEdit(user);

    expect(props.onChange).toHaveBeenCalledWith({ display: [], print: [], names: [] });
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckColorDialog } from './CheckColorDialog';
import type { CheckColorDialogProps } from './CheckColorDialog';

/** 色1〜色9 の名称 (index 0 が「色1」)。 */
const COLOR_NAMES = ['赤', '橙', '黄', '緑', '水', '青', '紫', '桃', '灰'];

function renderDialog(overrides: Partial<CheckColorDialogProps> = {}) {
  const props: CheckColorDialogProps = {
    colorNames: COLOR_NAMES,
    current: 0,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<CheckColorDialog {...props} />);
  return { user, props, dialog: screen.getByTestId('check-color-dialog') };
}

describe('CheckColorDialog', () => {
  it('標準色 + 色1〜色9 の 10 項目を色名で表示する', () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText('チェック色')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('radio')).toHaveLength(10);
    expect(within(dialog).getByRole('radio', { name: '標準色' })).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: '赤' })).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: '灰' })).toBeInTheDocument();
  });

  it('current の色を選択状態にする', () => {
    renderDialog({ current: 7 });
    const radio = screen.getByRole('radio', { name: '紫' });

    expect(radio).toBeChecked();
    expect(radio).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('radio', { name: '標準色' })).not.toHaveAttribute('data-selected');
  });

  it('current が 0 なら標準色を選択状態にする', () => {
    renderDialog({ current: 0 });

    expect(screen.getByRole('radio', { name: '標準色' })).toBeChecked();
  });

  it('色を選んで OK すると onSelect にその色を渡す', async () => {
    const { user, props } = renderDialog();

    // colorNames[5] = 色6。
    await user.click(screen.getByRole('radio', { name: '青' }));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(props.onSelect).toHaveBeenCalledWith(6);
  });

  it('選び直さずに OK すると current をそのまま渡す', async () => {
    const { user, props } = renderDialog({ current: 5 });

    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(props.onSelect).toHaveBeenCalledWith(5);
  });

  it('キャンセルは onClose を呼び、色を通知しない', async () => {
    const { user, props } = renderDialog();

    await user.click(screen.getByRole('radio', { name: '黄' }));
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('色名が空の項目は「色N」で表示する', () => {
    renderDialog({ colorNames: ['', '青'] });

    expect(screen.getByRole('radio', { name: '色1' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '青' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '色3' })).toBeInTheDocument();
  });
});

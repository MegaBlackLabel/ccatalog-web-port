import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CircleMsAuthDialog } from './CircleMsAuthDialog';
import type { CircleMsAuthDialogProps } from './CircleMsAuthDialog';
import { SendInfoDialog } from './SendInfoDialog';
import type { SendInfoDialogProps } from './SendInfoDialog';
import { SerialInputDialog } from './SerialInputDialog';
import type { SerialInputDialogProps } from './SerialInputDialog';
import { StartupConfirmDialog } from './StartupConfirmDialog';
import type { StartupConfirmDialogProps } from './StartupConfirmDialog';

function renderSerial(overrides: Partial<SerialInputDialogProps> = {}) {
  const props: SerialInputDialogProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<SerialInputDialog {...props} />);
  return { user, props, dialog: view.getByTestId('serial-input-dialog') };
}

function renderAuth(overrides: Partial<CircleMsAuthDialogProps> = {}) {
  const props: CircleMsAuthDialogProps = {
    status: 'idle',
    onStart: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<CircleMsAuthDialog {...props} />);
  return { user, props, dialog: view.getByTestId('circlems-auth-dialog') };
}

function renderStartup(overrides: Partial<StartupConfirmDialogProps> = {}) {
  const props: StartupConfirmDialogProps = {
    catalogName: 'コミックマーケット96（ダミー）',
    onLaunch: vi.fn(),
    onExit: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<StartupConfirmDialog {...props} />);
  return { user, props, dialog: view.getByTestId('startup-confirm-dialog') };
}

function renderSendInfo(overrides: Partial<SendInfoDialogProps> = {}) {
  const props: SendInfoDialogProps = {
    payload: 'OS名: Windows 98\nメモリサイズ: 64 MB',
    onAnswer: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<SendInfoDialog {...props} />);
  return { user, props, dialog: view.getByTestId('send-info-dialog') };
}

describe('SerialInputDialog', () => {
  it('タイトルと入力欄を表示し、エラー行は空にしておく', () => {
    const { dialog } = renderSerial();

    expect(screen.getByText('シリアル番号入力')).toBeInTheDocument();
    expect(within(dialog).getByText('シリアル番号を入力してください')).toBeInTheDocument();
    expect(within(dialog).getByTestId('serial-input')).toHaveValue('');
    expect(within(dialog).getByTestId('serial-error').textContent).toBe('');
  });

  it('errorMessage を赤いエラー行に表示する', () => {
    const { dialog } = renderSerial({ errorMessage: 'シリアル番号が不正です' });

    expect(within(dialog).getByTestId('serial-error')).toHaveTextContent('シリアル番号が不正です');
  });

  it('入力して OK を押すと onSubmit に trim 済みの値を渡す', async () => {
    const { user, props } = renderSerial();

    await user.type(screen.getByTestId('serial-input'), ' ABC-123 ');
    await user.click(screen.getByTestId('serial-submit'));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledWith('ABC-123');
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('空 (空白のみ) の入力では onSubmit を呼ばない', async () => {
    const { user, props } = renderSerial();

    await user.click(screen.getByTestId('serial-submit'));
    await user.type(screen.getByTestId('serial-input'), '   ');
    await user.click(screen.getByTestId('serial-submit'));

    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('キャンセルは onCancel を呼ぶ', async () => {
    const { user, props } = renderSerial();

    await user.click(screen.getByTestId('serial-cancel'));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
});

describe('CircleMsAuthDialog', () => {
  it('タイトルと説明・待機中の状態を表示する', () => {
    const { dialog } = renderAuth();

    expect(screen.getByText('Circle.ms 認証ダイアログ')).toBeInTheDocument();
    const description = within(dialog).getByTestId('circlems-description') as HTMLTextAreaElement;
    expect(description.value).toContain('Web ブラウザで認証を行います。');
    expect(within(dialog).getByTestId('circlems-status')).toHaveTextContent('待機中');
  });

  it('待機中は 認証を開始 を押すと onStart を呼ぶ', async () => {
    const { user, props } = renderAuth();

    const start = screen.getByTestId('circlems-start');
    expect(start).toBeEnabled();
    await user.click(start);

    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('認証中は 認証を開始 を押せない', () => {
    const { dialog } = renderAuth({ status: 'running' });

    expect(within(dialog).getByTestId('circlems-start')).toBeDisabled();
    expect(within(dialog).getByTestId('circlems-status')).toHaveTextContent('認証中...');
  });

  it('エラー時は message を表示し、再度 認証を開始 できる', async () => {
    const { user, props, dialog } = renderAuth({
      status: 'error',
      message: '認証に失敗しました',
    });

    expect(within(dialog).getByTestId('circlems-status')).toHaveTextContent('エラー');
    expect(within(dialog).getByTestId('circlems-message')).toHaveTextContent('認証に失敗しました');

    const start = within(dialog).getByTestId('circlems-start');
    expect(start).toBeEnabled();
    await user.click(start);

    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('キャンセルは onCancel、閉じるは onClose を呼ぶ', async () => {
    const { user, props } = renderAuth();

    await user.click(screen.getByTestId('circlems-cancel'));
    await user.click(screen.getByTestId('circlems-close'));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onStart).not.toHaveBeenCalled();
  });
});

describe('StartupConfirmDialog', () => {
  it('タイトルとカタログ名を表示する', () => {
    const { dialog } = renderStartup();

    expect(screen.getByText('起動確認')).toBeInTheDocument();
    expect(within(dialog).getByTestId('startup-catalog-name')).toHaveTextContent(
      'コミックマーケット96（ダミー）',
    );
  });

  it('DVDROMカタログを起動する は onLaunch を呼ぶ', async () => {
    const { user, props } = renderStartup();

    await user.click(screen.getByTestId('startup-launch'));

    expect(props.onLaunch).toHaveBeenCalledTimes(1);
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('終了 は onExit を呼ぶ', async () => {
    const { user, props } = renderStartup();

    await user.click(screen.getByTestId('startup-exit'));

    expect(props.onExit).toHaveBeenCalledTimes(1);
    expect(props.onLaunch).not.toHaveBeenCalled();
  });

  // 実物のダイアログはタイトルバーに × だけを出し、端のドラッグでもサイズを変えられない
  // (Window の minimizable / maximizable / resizable)。
  it('タイトルバーのボタンは × だけで、リサイズ ハンドルを持たない', () => {
    const { dialog } = renderStartup();

    const labels = Array.from(dialog.querySelectorAll('.title-bar-controls button')).map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Close']);
    expect(dialog.querySelectorAll('[class*="resize"]')).toHaveLength(0);
  });
});

describe('SendInfoDialog', () => {
  it('タイトルとマシン情報の 4 項目、送信内容のプレビューを表示する', () => {
    const { dialog } = renderSendInfo();

    expect(screen.getByText('情報送信の確認')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/今後の開発の参考のために、アクティベーションの際に/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('OS名')).toBeInTheDocument();
    expect(within(dialog).getByText('メモリサイズ')).toBeInTheDocument();
    expect(within(dialog).getByText('プロセッサ情報')).toBeInTheDocument();
    expect(within(dialog).getByText('画面サイズ')).toBeInTheDocument();
    expect(within(dialog).getByTestId('send-info-payload')).toHaveValue(
      'OS名: Windows 98\nメモリサイズ: 64 MB',
    );
  });

  it('はい は onAnswer(true) を呼ぶ', async () => {
    const { user, props } = renderSendInfo();

    await user.click(screen.getByTestId('send-info-yes'));

    expect(props.onAnswer).toHaveBeenCalledTimes(1);
    expect(props.onAnswer).toHaveBeenCalledWith(true);
  });

  it('いいえ は onAnswer(false) を呼ぶ', async () => {
    const { user, props } = renderSendInfo();

    await user.click(screen.getByTestId('send-info-no'));

    expect(props.onAnswer).toHaveBeenCalledTimes(1);
    expect(props.onAnswer).toHaveBeenCalledWith(false);
  });
});

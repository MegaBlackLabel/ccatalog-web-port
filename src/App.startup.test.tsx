// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { App, dummy, SAMPLE_COUNT, renderApp, chooseMenu, screen, waitFor, render, userEvent } from './test/app-harness';

describe('App — ウィンドウメニューとダイアログ', () => {
  it('ヘルプのバージョン情報を開ける', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ヘルプ(H)', /^バージョン情報/);
    const about = await screen.findByTestId('about-dialog');
    expect(about).toHaveTextContent(dummy.info.comiketName);
    expect(about).toHaveTextContent(`サークル数: ${SAMPLE_COUNT}`);
  });
});

describe('App — 起動シーケンス (元実装: 起動確認 → シリアル番号 → 情報送信)', () => {
  it('起動確認 → シリアル番号 → 情報送信 の順に進み、完了すると閉じる', async () => {
    const user = userEvent.setup({ delay: null });
    // 既定では起動シーケンスを出さないので、明示的に出す (実機と同じ流れ)。
    render(<App startup />);

    const startup = await screen.findByTestId('startup-confirm-dialog');
    expect(startup).toHaveTextContent('コミックマーケット96');
    await user.click(screen.getByTestId('startup-launch'));

    const serial = await screen.findByTestId('serial-input-dialog');
    expect(serial).toBeInTheDocument();
    await user.type(screen.getByTestId('serial-input'), 'DUMMY-0001');
    await user.click(screen.getByTestId('serial-submit'));

    expect(await screen.findByTestId('send-info-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('send-info-yes'));

    await waitFor(() => expect(screen.queryByTestId('send-info-dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('main-window')).toBeInTheDocument();
  });
});

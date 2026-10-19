// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { dummy, renderApp, chooseMenu, toggleSetting, screen, waitFor, within } from './test/app-harness';

describe('App — Google 検索・用紙・一覧追従・アイコン化・表紙の設定反映', () => {
  it('Google 検索の条件設定 (212) で「いずれかを含む」を選ぶと OR で検索する', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { user } = await renderApp();

    await chooseMenu(user, '検索(S)', /^Google検索の条件設定/);
    const dialog = await screen.findByTestId('google-search-dialog');
    await user.click(within(dialog).getByLabelText('「サークル名」と「執筆者名」のいずれかを含む（OR条件）'));
    // 選択は OK で確定する (キャンセルでは捨てる)。
    await user.click(within(dialog).getByTestId('google-search-ok'));

    await chooseMenu(user, '検索(S)', /^サークルをGoogleで検索/);

    const circle = dummy.circles[0];
    expect(open).toHaveBeenCalledWith(
      `https://www.google.com/search?q=${encodeURIComponent(
        `${circle.circleName} OR ${circle.penName}`,
      )}`,
      '_blank',
      'noreferrer',
    );
  }, 30000);

  it('用紙サイズ・余白 (203) の設定は印刷プレビューに出る', async () => {
    const { user } = await renderApp();

    // 実物と同じく、用紙・余白は印刷ダイアログ (1538) のボタンから開く。
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');
    await user.click(within(printDialog).getByTestId('print-page-setup'));
    const setup = await screen.findByTestId('page-setup-dialog');
    const paper = within(setup).getByLabelText('用紙(P)');
    await user.selectOptions(paper, 'A3');
    const left = within(setup).getByLabelText('左(L)');
    await user.clear(left);
    await user.type(left, '60');
    await user.click(within(setup).getByTestId('page-setup-ok'));

    // OK で閉じると印刷ダイアログに戻る。
    expect(screen.queryByTestId('page-setup-dialog')).toBeNull();
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
    await user.click(within(printDialog).getByTestId('print-cancel'));

    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const settings = await screen.findByTestId('print-settings-dialog');
    await user.click(within(settings).getByRole('button', { name: 'プレビュー' }));

    const shown = await screen.findByTestId('preview-page-setup');
    expect(shown).toHaveTextContent('用紙 A3 297.0×420.0mm');
    expect(shown).toHaveTextContent('余白 左 60.0');
  }, 30000);

  it('一覧の追従 (1022) を入れると、選んだサークルの日付とブロックへ一覧が切り替わる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '選択サークルのブロックが変わった際にサークル一覧の表示も追従する');
    // サークル一覧は既定では出さないので、メニューから開く。
    await chooseMenu(user, 'ウィンドウ(W)', /^サークル一覧/);

    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.click(cells[0] as HTMLElement);

    const target = dummy.circles.filter((circle) => circle.pageNo === targetPage)[0];
    const list = screen.getByTestId('list-window');
    await waitFor(() => expect(within(list).getByTestId('list-day')).toHaveValue(String(target.day)));
    await waitFor(() =>
      expect(within(list).getByTestId('list-block')).toHaveValue(String(target.blockId)),
    );
  }, 30000);


  it('個別窓のアイコン化を連動する (1714) を入れると、1 つ最小化すると子ウィンドウが全部たたまれる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '個別窓のアイコン化を連動する');

    const detail = screen.getByTestId('detail-window');
    await user.click(within(detail).getByRole('button', { name: 'Minimize' }));

    await waitFor(() => expect(screen.queryByTestId('detail-window')).not.toBeInTheDocument());
    expect(screen.queryByTestId('list-window')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checklist-window')).not.toBeInTheDocument();
    expect(screen.queryByTestId('map-window')).not.toBeInTheDocument();

    // ウィンドウメニューから戻せる。
    await chooseMenu(user, 'ウィンドウ(W)', /^サークル詳細/);
    expect(await screen.findByTestId('detail-window')).toBeInTheDocument();
  }, 30000);

  it('起動時に表紙画像を表示する (1711) を入れると表紙ウィンドウが出て、閉じられる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '起動時に表紙画像を表示する');

    const cover = await screen.findByTestId('cover-dialog');
    expect(cover).toHaveTextContent(dummy.info.comiketName);

    await user.click(within(cover).getByTestId('cover-close'));
    expect(screen.queryByTestId('cover-dialog')).not.toBeInTheDocument();
  }, 30000);
});

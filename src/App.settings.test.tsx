// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { App, dummy, checkedCount, renderApp, chooseMenu, toggleSetting, screen, waitFor, render, cleanup } from './test/app-harness';

describe('App — 動作設定 (ダイアログ 150) の反映', () => {
  it('シングルクリックでチェックする (1026) を入れると、1 回のクリックでチェックに載る', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(checkedCount()).toBe(65));

    await toggleSetting(user, 'シングルクリックでチェックする');

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.click(cells[1] as HTMLElement);

    expect(cells[1]).toHaveClass('cut-cell--checked');
    // ステータスバーはマウスの下のサークル情報に切り替わるので、離してから件数を見る。
    await user.unhover(cells[1] as HTMLElement);
    await waitFor(() => expect(checkedCount()).toBe(66));
  });

  it('選択カーソルをマウスカーソルに追従する (1024) を入れると、かざしたカットが選択される', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '選択カーソルをマウスカーソルに追従する');

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.hover(cells[2] as HTMLElement);

    expect(cells[2]).toHaveClass('cut-cell--selected');
  });

  it('リターンキーで次のサークルへ移動 (1021) は既定で有効。Enter でチェックして次のカットへ進む', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(checkedCount()).toBe(65));
    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');

    (cells[0] as HTMLElement).focus();
    await user.keyboard('{Enter}');

    expect(cells[0]).toHaveClass('cut-cell--checked');
    expect(cells[1]).toHaveClass('cut-cell--selected');
    // カーソルが移ったので、ステータスバーのページ表示も変わらない (同じページ内)。
    (cells[0] as HTMLElement).blur();
    await waitFor(() => expect(checkedCount()).toBe(66));
  });

  it('ページ変更時に左上のカットへカーソルを合わせる (1710) を入れると、ページ移動で先頭が選ばれる', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(screen.getByTestId('main-window')).toBeInTheDocument());
    await toggleSetting(user, 'ページ変更時に常に左上のサークルカットにカーソルを合わせる');

    // 起動時とは違うページへ移動する (サークルのいるページ)。
    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await waitFor(() => expect(cells[0]).toHaveClass('cut-cell--selected'));
  }, 30000);
});

describe('App — 保存 (元実装の INI / チェックリストファイル相当)', () => {

  it('動作設定と起動時のチェックリスト読み込みは次の起動でも残る', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(checkedCount()).toBe(65));
    await toggleSetting(user, '起動時に前回使用したチェックリストを自動的に読み込む');

    // 1 件登録して 66 件にする。
    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.dblClick(cells[1] as HTMLElement);
    expect(cells[1]).toHaveClass('cut-cell--checked');
    // ステータスバーはマウスの下のサークル情報に切り替わるので、離してから件数を見る。
    await user.unhover(cells[1] as HTMLElement);
    await waitFor(() => expect(checkedCount()).toBe(66));

    await toggleSetting(user, 'シングルクリックでチェックする');
    cleanup();

    render(<App startup={false} />);

    // 読み込んだチェックリストがあるので、デモ用のダミー登録は入れ直さない。
    await waitFor(() => expect(checkedCount()).toBe(66));
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
    expect(await screen.findByLabelText('シングルクリックでチェックする (S)')).toBeChecked();
  }, 30000);
});

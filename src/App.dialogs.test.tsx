// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { renderApp, chooseMenu, screen, waitFor, within } from './test/app-harness';

describe('App — 残りのダイアログをメニューから開ける', () => {
  it('印刷詳細設定は 4 タブの 1 枚で、タブを切り替えてプレビュー → 印刷中 まで進める', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const dialog = await screen.findByTestId('print-settings-dialog');

    // 元ダイアログ 163〜166 が 1 枚のタブになっている。
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'サークルリスト印刷',
      'サークルカット印刷',
      'マップ印刷',
      '白地図印刷',
    ]);

    // 既定はサークルリスト印刷のタブ。
    expect(dialog).toHaveTextContent('印刷項目');
    // タブを切り替えるとマップ印刷の項目になる。
    await user.click(within(dialog).getByRole('link', { name: 'マップ印刷' }));
    expect(dialog).toHaveTextContent('指示線');

    // プレビューは別ウィンドウで開き、閉じると印刷詳細設定に戻る。
    await user.click(within(dialog).getByRole('button', { name: 'プレビュー' }));
    expect(await screen.findByTestId('print-preview-window')).toBeInTheDocument();
    // マップ印刷タブなので、会場図のプレビューが出る。
    expect(screen.getByTestId('preview-print-map')).toBeInTheDocument();
    await user.click(screen.getByTestId('preview-close'));
    expect(screen.queryByTestId('print-preview-window')).not.toBeInTheDocument();

    // 白地図印刷のプレビューも会場図だが、白地図はチェック色を使わないので凡例は出さない。
    await user.click(within(dialog).getByRole('link', { name: '白地図印刷' }));
    await user.click(within(dialog).getByRole('button', { name: 'プレビュー' }));
    const whitePreview = await screen.findByTestId('print-preview-window');
    expect(within(whitePreview).getByTestId('preview-print-map')).toBeInTheDocument();
    expect(within(whitePreview).queryByTestId('preview-check-colors')).toBeNull();
    await user.click(within(whitePreview).getByTestId('preview-close'));
    expect(screen.queryByTestId('print-preview-window')).not.toBeInTheDocument();

    // 下部は実物と同じ OK / キャンセル / 適用(A)。「用紙サイズ・余白」「印刷」はここには無い
    // (実物では用紙・余白は印刷ダイアログ、印刷はファイル > 印刷から)。
    expect(within(dialog).getByTestId('print-settings-ok')).toHaveTextContent('OK');
    expect(within(dialog).getByTestId('print-settings-cancel')).toHaveTextContent('キャンセル');
    expect(within(dialog).getByTestId('print-settings-apply')).toHaveTextContent('適用(A)');
    expect(within(dialog).queryByTestId('print-settings-page-setup')).toBeNull();
    expect(within(dialog).queryByTestId('print-settings-print')).toBeNull();
    await user.click(within(dialog).getByTestId('print-settings-ok'));
    expect(screen.queryByTestId('print-settings-dialog')).not.toBeInTheDocument();
  });

  it('印刷ダイアログでプリンタを選ぶと設定ダイアログへ進む', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');
    await user.click(within(printDialog).getByTestId('print-submit'));
    expect(await screen.findByTestId('print-settings-dialog')).toBeInTheDocument();
  });

  it('印刷ダイアログの詳細設定は印刷詳細設定を上に重ね、印刷ダイアログは開いたままにする', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');

    await user.click(within(printDialog).getByRole('radio', { name: 'マップ印刷(M)' }));
    await user.click(within(printDialog).getByTestId('print-details'));

    const settings = await screen.findByTestId('print-settings-dialog');
    expect(settings).toBeInTheDocument();
    // 選んだ形式のタブで開き、印刷ダイアログは閉じない (重ねて出す)。
    expect(within(settings).getByRole('tab', { name: 'マップ印刷' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();

    await user.click(within(settings).getByTestId('print-settings-cancel'));
    expect(screen.queryByTestId('print-settings-dialog')).toBeNull();
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
  });

  it('ブックマークを追加できる', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ブックマーク(B)', /^このページを追加/);
    const add = await screen.findByTestId('bookmark-add-dialog');
    await user.clear(within(add).getByTestId('bookmark-name-input'));
    await user.type(within(add).getByTestId('bookmark-name-input'), 'あとで見るページ');
    await user.click(within(add).getByTestId('bookmark-add-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('あとで見るページ'),
    );
  });


  it('データベースの初期化から古いデータベースの統合を開ける', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^データベースの初期化/);
    const chooser = await screen.findByTestId('list-dialog');
    await user.dblClick(within(chooser).getByText('古いデータベースの統合'));
    expect(await screen.findByTestId('database-merge-dialog')).toBeInTheDocument();
  });

  it('チェックリストのエクスポート結果を表示できる', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^チェックリストを circle\.ms にエクスポート/);
    expect(await screen.findByTestId('export-result-dialog')).toBeInTheDocument();
  });

  it('画像ファイル出力は説明・詳細設定・出力まで進められる (ダイアログ 197)', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^画像ファイル出力/);
    const dialog = await screen.findByTestId('image-output-dialog');
    expect(dialog).toHaveTextContent('※ ページ番号と拡張子".bmp"が付加されます。');

    // 説明 (1646) → 説明ダイアログ。閉じると画像ファイル出力に戻る。
    await user.click(within(dialog).getByTestId('image-output-help'));
    const help = await screen.findByTestId('image-output-help-dialog');
    expect(help).toHaveTextContent('BMPファイル出力');
    await user.click(within(help).getByTestId('image-output-help-close'));
    expect(screen.getByTestId('image-output-dialog')).toBeInTheDocument();

    // 詳細設定 (1051) → 印刷詳細設定 (163〜166) を上に重ね、画像ファイル出力ダイアログは
    // 閉じない。選んだ出力形式のタブで開く。
    await user.click(within(dialog).getByRole('radio', { name: 'サークルカット印刷(U)' }));
    await user.click(within(dialog).getByTestId('image-output-details'));
    const details = await screen.findByTestId('print-settings-dialog');
    expect(within(details).getByRole('tab', { name: 'サークルカット印刷' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('image-output-dialog')).toBeInTheDocument();
    await user.click(within(details).getByTestId('print-settings-cancel'));
    expect(screen.queryByTestId('print-settings-dialog')).toBeNull();
    expect(screen.getByTestId('image-output-dialog')).toBeInTheDocument();

    // ページ指定で出力 → 指定したページ数がステータスバーに出る (範囲は 1 - 3)。
    await user.click(within(dialog).getByLabelText('ページ指定(G) :'));
    const from = within(dialog).getByTestId('image-output-page-from');
    await user.clear(from);
    await user.type(from, '1');
    const to = within(dialog).getByTestId('image-output-page-to');
    await user.clear(to);
    await user.type(to, '3');
    await user.click(within(dialog).getByTestId('image-output-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('3 ページを BMP で出力しました'),
    );
  });
});

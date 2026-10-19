// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { selectASpaceCircle, checkedCount, renderApp, screen, waitFor, within, fireEvent } from './test/app-harness';
import { CHECK_COLOR_HEX } from './ui/check-colors';

describe('App — チェックリストのダミー登録 (見た目とスクロールの確認用)', () => {
  /** ダミー登録の日付ごとの件数 (App 側と同じ規則: 各日の末尾から決定的に選ぶ)。 */
  const DEMO_COUNTS: Record<number, number> = { 1: 20, 2: 14, 3: 14, 4: 14, 0: 3 };
  const DEMO_TOTAL = Object.values(DEMO_COUNTS).reduce((sum, count) => sum + count, 0);
  /** チェックリスト 1 行の高さ (実測 20px)。 */
  const CHECKLIST_ROW_HEIGHT = 20;
  /** チェックリストウィンドウの高さ (LAYOUT_WIDE の 390px。タブパネルはこれより低い)。 */
  const CHECKLIST_WINDOW_HEIGHT = 390;

  it('初期表示のタブに、縦スクロールが出る量の行が入っている', async () => {
    await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('row').length).toBeGreaterThan(1));

    // ヘッダー行を除いた件数。
    const rows = within(checklist).getAllByRole('row').length - 1;
    expect(rows).toBe(DEMO_COUNTS[1]);
    // 行数 x 行高がウィンドウ高 (≧ タブパネル高) を超えるので、パネルからはみ出して縦スクロールが出る。
    expect(rows * CHECKLIST_ROW_HEIGHT).toBeGreaterThan(CHECKLIST_WINDOW_HEIGHT);
  });

  it('各日にダミー登録が入り、件数はステータスバーに出る', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('tab')).toHaveLength(5));

    for (const day of [1, 2, 3, 4, 0]) {
      await user.click(
        within(checklist).getByRole('link', { name: day === 0 ? '抽選漏れ' : `${day}日目` }),
      );
      await waitFor(() =>
        expect(
          within(checklist).getByText(`全 ${DEMO_TOTAL} 件中 ${DEMO_COUNTS[day]} 件を表示`),
        ).toBeInTheDocument(),
      );
    }
  });

  it('解除したダミー登録は入れ直さない', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('row').length).toBeGreaterThan(1));

    // 1 日目のタブのデータ行 (ヘッダー行を除く)。
    const dataRows = within(checklist).getAllByRole('row').slice(1);
    expect(dataRows).toHaveLength(DEMO_COUNTS[1]);

    // 1 日目の行をすべて選んで「チェック解除」する (Ctrl クリックで追加選択)。
    await user.click(dataRows[0]);
    for (const row of dataRows.slice(1)) {
      fireEvent.click(row, { ctrlKey: true });
    }
    await waitFor(() =>
      expect(within(checklist).getByText(`選択 ${DEMO_COUNTS[1]} 件`)).toBeInTheDocument(),
    );
    await user.click(within(checklist).getByRole('button', { name: 'チェック解除' }));

    await waitFor(() =>
      expect(within(checklist).getByText('この日のチェックリストは空です')).toBeInTheDocument(),
    );
    // 解除した 20 件は登録し直されず、他の日のダミー登録だけが残る。
    expect(
      within(checklist).getByText(`全 ${DEMO_TOTAL - DEMO_COUNTS[1]} 件中 0 件を表示`),
    ).toBeInTheDocument();
  });
});

describe('App — チェックツールバー (33001〜33009 / 33020)', () => {
  /** 起動時のダミー登録の件数 (1 日目 20 / 翌日以降 各 14 / 抽選漏れ 3)。 */
  const DEMO_TOTAL = 65;

  it('色ボタンは選択中のサークルを追加・色替えし、チェックリストから外すボタンで外す', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(checkedCount()).toBe(DEMO_TOTAL));

    await selectASpaceCircle(user);
    await user.click(within(main).getByRole('button', { name: '色5' }));

    await waitFor(() => expect(checkedCount()).toBe(DEMO_TOTAL + 1));
    // 選択中のカット (a のサークル) のスペース番号ボックスが、押した色で塗られる。
    expect(
      screen.getByTestId('cut-view').querySelector('.cut-cell--selected .cut-cell__space') as HTMLElement,
    ).toHaveStyle({ background: CHECK_COLOR_HEX[5] });

    // 登録済みのサークルは、色ボタンを押しても件数は増えず色だけ変わる。
    await user.click(within(main).getByRole('button', { name: '色7' }));
    expect(checkedCount()).toBe(DEMO_TOTAL + 1);
    expect(
      screen.getByTestId('cut-view').querySelector('.cut-cell--selected .cut-cell__space') as HTMLElement,
    ).toHaveStyle({ background: CHECK_COLOR_HEX[7] });

    await user.click(within(main).getByRole('button', { name: 'チェックリストから外す' }));

    await waitFor(() => expect(checkedCount()).toBe(DEMO_TOTAL));
    const space = screen
      .getByTestId('cut-view')
      .querySelector('.cut-cell--selected .cut-cell__space') as HTMLElement;
    expect(space.style.background).toBe('');
  });
});

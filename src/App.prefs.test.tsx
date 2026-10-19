// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { selectASpaceCircle, checkedCount, renderApp, chooseMenu, screen, waitFor, within } from './test/app-harness';
import type { UserEvent } from '@testing-library/user-event';

describe('App — 動作設定 (プロパティシート)', () => {
  /** 動作設定を開いて、指定したページを選ぶ。 */
  async function openPage(user: UserEvent, label: string) {
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
    const dialog = await screen.findByTestId('preferences-dialog');
    if (label !== '動作オプション') {
      // タブは <li role="tab"> の中の <a> が押せる (ライブラリの実装)。
      await user.click(within(dialog).getByRole('link', { name: label }));
    }
    return dialog;
  }

  it('パス設定で「指定場所から読み込む」にすると、画像の取得元が変わる', async () => {
    const { user } = await renderApp();
    const dialog = await openPage(user, 'パス設定');

    await user.click(within(dialog).getByLabelText('指定場所から読み込む(R)'));
    await user.clear(within(dialog).getByLabelText('画像データの場所'));
    await user.type(within(dialog).getByLabelText('画像データの場所'), 'https://cdn.example.com/img');
    await user.click(within(dialog).getByTestId('preferences-ok'));

    await waitFor(() =>
      expect(screen.getByTestId('cut-view').querySelector('img')).toHaveAttribute(
        'src',
        expect.stringMatching(/^https:\/\/cdn\.example\.com\/img\/cuts\/\d+\.png$/),
      ),
    );
  });

  it('リスト表示で列を外すとチェックリストの列が消える', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    expect(within(checklist).getByRole('columnheader', { name: 'メモ' })).toBeInTheDocument();

    const dialog = await openPage(user, 'リスト表示');
    await user.click(within(dialog).getByLabelText('メモ'));
    await user.click(within(dialog).getByTestId('preferences-ok'));

    await waitFor(() =>
      expect(within(checklist).queryByRole('columnheader', { name: 'メモ' })).not.toBeInTheDocument(),
    );
    // サークル名は外せない (5LIST.HTM)。
    expect(within(checklist).getByRole('columnheader', { name: 'サークル名' })).toBeInTheDocument();
  }, 30000);

  it('チェック色で表示色を変えると、チェックしたカットの色が変わる', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(checkedCount()).toBe(65));
    // 選択中のサークル (a のサークル = スペース番号ボックスを持つセル) を色1 でチェックする。
    await selectASpaceCircle(user);
    await user.click(within(main).getByRole('button', { name: '色1' }));
    await waitFor(() => expect(checkedCount()).toBe(66));

    const dialog = await openPage(user, 'チェック色');
    await user.click(within(dialog).getByTestId('display-color-1'));
    const palette = await screen.findByTestId('color-palette-dialog');
    await user.click(within(palette).getByRole('button', { name: '#ffffff' }));
    await user.click(within(palette).getByTestId('palette-ok'));
    await user.click(within(dialog).getByTestId('preferences-ok'));

    const space = screen
      .getByTestId('cut-view')
      .querySelector('.cut-cell--selected .cut-cell__space') as HTMLElement;
    await waitFor(() => expect(space).toHaveStyle({ background: '#ffffff' }));
  });
});

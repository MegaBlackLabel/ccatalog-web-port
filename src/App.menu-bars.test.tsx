// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { checkedCount, gotoPage, openChecklistMenu, renderApp, screen, waitFor } from './test/app-harness';
import { STANDARD_CHECK_COLOR_HEX } from './ui/check-colors';
import type { UserEvent } from '@testing-library/user-event';

describe('App — サークルカットの配置情報の帯 (トップ)', () => {
  it('帯は奇数ページは右寄せ、偶数ページは左寄せにする', async () => {
    const { user } = await renderApp();

    await gotoPage(user, 105);
    expect((await screen.findByTestId('cut-heading')).style.justifyContent).toBe('flex-end');

    await gotoPage(user, 106);
    expect(screen.getByTestId('cut-heading').style.justifyContent).toBe('flex-start');
  });
});

describe('App — チェックリスト メニュー (実機の並びと活性)', () => {
  /** 項目の表示文字 (ラベル + ショートカット)。 */
  const textOf = (item: HTMLElement) => (item.textContent ?? '').replace(/\s+/g, ' ').trim();

  /** 未チェックの a のサークル (番号ボックスを持ち、まだチェックされていないセル) を選ぶ。 */
  async function selectUncheckedCircle(user: UserEvent): Promise<HTMLElement> {
    const cell = [...screen.getByTestId('cut-view').querySelectorAll('.cut-cell')].find(
      (node) => node.querySelector('.cut-cell__space') && !node.classList.contains('cut-cell--checked'),
    ) as HTMLElement;
    await user.click(cell);
    return cell;
  }

  it('実機 (画像) と同じ並びで、色1〜色9には 1〜9 のショートカットが付く', async () => {
    const { user } = await renderApp();
    const items = await openChecklistMenu(user);

    expect(items.map(textOf)).toEqual([
      '標準色で追加(A)Enter',
      '色1で追加1',
      '色2で追加2',
      '色3で追加3',
      '色4で追加4',
      '色5で追加5',
      '色6で追加6',
      '色7で追加7',
      '色8で追加8',
      '色9で追加9',
      'チェックリストから外す(R)0',
      '標準のチェック色(D)▶',
      'チェック色の編集(E)...',
      'サークルのメモを編集する(M)Ctrl+T',
      'チェックなしサークルのメモを消去する',
      '全てのメモを消去する',
      '選択サークルをクリップボードにコピー(C)',
      'クリップボードからチェックリストにペースト(P)',
    ]);
  });

  it('「標準色で追加(A)」(33040) は選択中のサークルを標準のチェック色で登録する', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(checkedCount()).toBe(65));
    const cell = await selectUncheckedCircle(user);
    expect(cell).not.toHaveClass('cut-cell--checked');

    const items = await openChecklistMenu(user);
    await user.click(
      items.find((node) => textOf(node).startsWith('標準色で追加(A)')) as HTMLElement,
    );

    expect(cell).toHaveClass('cut-cell--checked');
    // 標準色 (= 「標準のチェック色」の既定) は実物の会場マップで使われている緑。
    const space = cell.querySelector('.cut-cell__space') as HTMLElement;
    await waitFor(() => expect(space).toHaveStyle({ background: STANDARD_CHECK_COLOR_HEX }));
    expect(checkedCount()).toBe(66);
  }, 30000);
});

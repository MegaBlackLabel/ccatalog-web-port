// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { App, dummy, pageNumberOf, detailCircleName, gotoPage, openChecklistMenu, renderApp, chooseMenu, screen, waitFor, within, render } from './test/app-harness';

describe('App — 元アプリの画面が揃っている', () => {
  it('画面下にタスクバーを出し、トレイの時計も持つ', async () => {
    await renderApp();

    const taskbar = await screen.findByTestId('taskbar');
    // 画面下に貼り付く (実物のタスクバーは高さ 28px)。
    expect(taskbar).toBeInTheDocument();
    expect(taskbar.style.height).toBe('28px');
    // 時計は HH:MM (24 時間) で出す。
    expect(within(taskbar).getByText(/^\d{1,2}:\d{2}$/)).toBeInTheDocument();
  });

  it('既定の配置は取り込み画像と同じ (カット=左いっぱい / 詳細+マップ=右上 / チェックリスト=右下)', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1440 });
    try {
      render(<App startup={false} />);
      expect(await screen.findByTestId('main-window')).toBeInTheDocument();

      // 既定で出すのは取り込み画像の 4 枚だけ (サークル一覧と検索はメニューから開く)。
      expect(screen.queryByTestId('list-window')).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-window')).not.toBeInTheDocument();

      const boxes = ['main-window', 'detail-window', 'map-window', 'checklist-window'].map((id) => {
        const element = screen.getByTestId(id);
        const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
        expect(root, `${id} のウィンドウ枠`).not.toBeNull();
        return {
          id,
          left: Number.parseFloat(root.style.left),
          top: Number.parseFloat(root.style.top),
          width: Number.parseFloat(root.style.width),
          height: Number.parseFloat(root.style.height),
        };
      });
      const [main, detail, map, checklist] = boxes;
      for (const box of boxes) {
        expect(Number.isFinite(box.left) && Number.isFinite(box.top), `${box.id} の位置`).toBe(true);
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }

      // サークルカットは左端から画面の高さいっぱい。詳細とマップは右上に並ぶ
      // (取り込み画像の詳細 554 は マップ 528 より高い)。
      expect(main.left).toBeLessThan(detail.left);
      expect(detail.top).toBe(map.top);
      // 上段の 2 枚はメインと同じ Y から始める (画像の実測は 12 で 1px 下がっている)。
      expect(detail.top).toBe(main.top);
      expect(map.top).toBe(main.top);
      expect(detail.height).toBeGreaterThan(map.height);
      expect(map.left).toBeGreaterThan(detail.left + detail.width - 8);
      // チェックリストは上段のすぐ下 (接する) から右下で、サークルカットに重ならない。
      expect(checklist.top).toBeGreaterThanOrEqual(detail.top + detail.height - 8);
      expect(checklist.left).toBeGreaterThanOrEqual(main.left + main.width);
      expect(checklist.left + checklist.width).toBeGreaterThan(map.left + map.width - 8);
      // 画面が画像 (1966x940) より広いので、取り込み画像の実寸のまま置く
      // (メインだけは最小幅 659 が画像の 657 より 2px 広いので 659 になる。
      //  右の 3 枚はメインの右端 + 1px から並べ直すので 詳細 668 / マップ 1169 /
      //  チェックリスト 668 になる。上段 2 枚の Y はメインに揃える)。
      expect([main.left, main.top, main.width, main.height]).toEqual([8, 11, 659, 925]);
      expect([detail.left, detail.top, detail.width, detail.height]).toEqual([668, 11, 500, 554]);
      expect([map.left, map.top, map.width, map.height]).toEqual([1169, 11, 796, 528]);
      expect([checklist.left, checklist.top, checklist.width, checklist.height]).toEqual([
        668, 567, 1299, 369,
      ]);
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it('画面が画像と同じ大きさでもチェックリストはサークルカットに重ならない', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1966 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 940 });
    try {
      render(<App startup={false} />);
      expect(await screen.findByTestId('main-window')).toBeInTheDocument();

      const boxOf = (id: string) => {
        const element = screen.getByTestId(id);
        const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
        return {
          left: Number.parseFloat(root.style.left),
          width: Number.parseFloat(root.style.width),
        };
      };
      const main = boxOf('main-window');
      const checklist = boxOf('checklist-window');
      // メインは最小幅 659 に持ち上がる (+ デスクトップ余白 8) ので、画像の座標のままでは
      // チェックリストが潜り込む。重ならない位置まで右へ寄せる。
      expect(checklist.left).toBeGreaterThanOrEqual(main.left + main.width);
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it.each([
    [1920, 1080],
    [1440, 900],
    [1366, 768],
  ])(
    '画面 %ix%i でもチェックリストはサークルカットに重ならず画面に収まる',
    async (width, height) => {
      const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
      try {
        render(<App startup={false} />);
        expect(await screen.findByTestId('main-window')).toBeInTheDocument();

        const boxOf = (id: string) => {
          const element = screen.getByTestId(id);
          const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
          return {
            left: Number.parseFloat(root.style.left),
            width: Number.parseFloat(root.style.width),
            height: Number.parseFloat(root.style.height),
          };
        };
        const main = boxOf('main-window');
        const checklist = boxOf('checklist-window');
        // メインは縮尺に関係なく最小幅 659 を守るので、画像の座標のままだとチェックリストが
        // 右端寄せでメインの下へ潜る。重ならないよう幅を詰めて右へ寄せる。
        expect(checklist.left).toBeGreaterThanOrEqual(main.left + main.width);
        expect(checklist.left + checklist.width).toBeLessThanOrEqual(width - 8);
        // 詰めても最小の大きさは割らない (割る画面では実物どおり重なる)。
        expect(checklist.width).toBeGreaterThanOrEqual(362);
        expect(checklist.height).toBeGreaterThanOrEqual(200);
      } finally {
        if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
        if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
      }
    },
  );

  it('画面 1920x1080 では既定の 4 枚がどれも重ならない', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
    try {
      render(<App startup={false} />);
      expect(await screen.findByTestId('main-window')).toBeInTheDocument();

      const boxOf = (id: string) => {
        const element = screen.getByTestId(id);
        const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
        return {
          left: Number.parseFloat(root.style.left),
          top: Number.parseFloat(root.style.top),
          width: Number.parseFloat(root.style.width),
          height: Number.parseFloat(root.style.height),
        };
      };
      const main = boxOf('main-window');
      const detail = boxOf('detail-window');
      const map = boxOf('map-window');
      const checklist = boxOf('checklist-window');
      const mainRight = main.left + main.width;
      // メインの右に 詳細 → マップ の順で並べ、その下の帯にチェックリスト。
      expect(detail.left).toBeGreaterThanOrEqual(mainRight);
      expect(detail.top).toBe(main.top);
      expect(map.top).toBe(main.top);
      expect(map.left).toBeGreaterThanOrEqual(detail.left + detail.width);
      expect(checklist.left).toBeGreaterThanOrEqual(mainRight);
      for (const box of [detail, map, checklist]) {
        expect(box.left + box.width).toBeLessThanOrEqual(1920 - 8);
      }
      expect(checklist.top).toBeGreaterThanOrEqual(detail.top + detail.height);
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it('画面が画像より小さいときは縦横同じ比率で縮む (縦だけ引き伸ばさない)', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1400 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1400 });
    try {
      render(<App startup={false} />);
      expect(await screen.findByTestId('main-window')).toBeInTheDocument();

      const boxOf = (id: string) => {
        const element = screen.getByTestId(id);
        const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
        return {
          width: Number.parseFloat(root.style.width),
          height: Number.parseFloat(root.style.height),
        };
      };
      // 画像の縮尺は 1400/1966 = 0.712 (縦は 1400-28=1372 → 1372/940 = 1.46 なので横が効く)。
      // 高さは画像の比率のまま縮むが、チェックリストはメインの右に収まるよう幅を詰める
      // (右端 1392 - メインの右端 667 - 1px = 724)。
      const checklist = boxOf('checklist-window');
      expect(checklist.height).toBeCloseTo(369 * (1400 / 1966), -1);
      expect(checklist.width).toBe(1400 - 8 - 668);
      const map = boxOf('map-window');
      expect(map.height).toBeCloseTo(528 * (1400 / 1966), -1);
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it('ウィンドウ位置を初期化 (60006) は取り込み画像の配置に戻し、他のウィンドウとダイアログを閉じる', async () => {
    const { user } = await renderApp();

    // 初期配置を控えておく。
    const boxOf = (id: string) => {
      const element = screen.getByTestId(id);
      const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
      return `${root.style.left}/${root.style.top}/${root.style.width}/${root.style.height}`;
    };
    const mainBox = boxOf('main-window');

    // サークル一覧とダイアログを開く (初期化で閉じる対象)。
    await chooseMenu(user, 'ウィンドウ(W)', /^サークル一覧/);
    expect(await screen.findByTestId('list-window')).toBeInTheDocument();
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
    expect(await screen.findByTestId('preferences-dialog')).toBeInTheDocument();

    await chooseMenu(user, 'ウィンドウ(W)', /^ウィンドウ位置を初期化/);

    // 取り込み画像の 4 枚だけになり、位置は初期配置のまま。他のダイアログは閉じる。
    expect(screen.queryByTestId('list-window')).toBeNull();
    expect(screen.queryByTestId('preferences-dialog')).toBeNull();
    expect(screen.getByTestId('main-window')).toBeInTheDocument();
    expect(screen.getByTestId('detail-window')).toBeInTheDocument();
    expect(screen.getByTestId('map-window')).toBeInTheDocument();
    expect(screen.getByTestId('checklist-window')).toBeInTheDocument();
    expect(boxOf('main-window')).toBe(mainBox);
  }, 30000);

});

describe('App — サークルを選ぶ', () => {

  it('カットをダブルクリックすると詳細が埋まり、チェックリストに載る', async () => {
    const { user } = await renderApp();
    const cutView = await screen.findByTestId('cut-view');
    const cell = cutView.querySelector('.cut-cell');
    expect(cell).not.toBeNull();

    await user.dblClick(cell as HTMLElement);

    const detail = await screen.findByTestId('detail-window');
    // サークル名は見出し帯としてカット画像に焼き込まれているので、DOM からは
    // 詳細ウィンドウの「サークル名」行 (実物は読み取り専用テキスト) を読んで突き合わせる。
    const nameRow = within(detail)
      .getAllByTestId('detail-info-row')
      .find((row) => row.getAttribute('data-label') === 'サークル名');
    const name = nameRow?.lastElementChild?.textContent ?? '';
    expect(name.length).toBeGreaterThan(0);

    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getByText(name)).toBeInTheDocument());
  });

  it('ページ指定で移動するとカット表示のページが変わる', async () => {
    const { user } = await renderApp();
    const lastPage = dummy.circles[dummy.circles.length - 1].pageNo;
    await gotoPage(user, lastPage);
  });

  it('カット以外をクリックすると選択が外れ、詳細は直前のサークルのまま残る', async () => {
    const { user } = await renderApp();
    const view = await screen.findByTestId('cut-view');
    // 起動直後は先頭のサークルにカーソルがある (カットビューが空のまま開くことはない)。
    await waitFor(() => expect(view.querySelectorAll('.cut-cell--selected')).toHaveLength(1));

    // 別のページへ移って 1 つ選び、そのサークル名を控えてからカット以外 (背景) をクリックする。
    await gotoPage(user, 106);
    await user.click(screen.getByTestId('cut-view').querySelector('.cut-cell') as HTMLElement);
    const name = detailCircleName();
    expect(name.length).toBeGreaterThan(0);
    await user.click(screen.getByTestId('cut-view'));

    // 実機と同じく未選択のまま (先頭を選び直さないのでページも動かない)。
    expect(screen.getByTestId('cut-view').querySelectorAll('.cut-cell--selected')).toHaveLength(0);
    expect(pageNumberOf()).toBe('106');

    // 未選択では、選択が要るチェックリスト メニューの項目が使えない。
    const items = await openChecklistMenu(user);
    const textOf = (item: HTMLElement) => (item.textContent ?? '').replace(/\s+/g, ' ').trim();
    for (const label of ['標準色で追加(A)', '色1で追加', 'チェックリストから外す(R)']) {
      const item = items.find((node) => textOf(node).startsWith(label)) as HTMLElement;
      expect(item.getAttribute('aria-disabled'), label).toBe('true');
    }

    // 詳細は直前のサークルのまま (カット未選択の表示には戻らない)。
    const detail = screen.getByTestId('detail-window');
    expect(detailCircleName()).toBe(name);
    expect(within(detail).queryByTestId('detail-cut-placeholder')).toBeNull();
  }, 30000);
});

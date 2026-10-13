// メインメニュー定義。ccatalog.exe の RT_MENU リソース 128 から生成したものをそのまま持つ。
// 生成: tools/gen-menu-defs.py  (元データ: 解析/ui.json ← ui_spec.py が PE をパース)
// 手で編集しない。

export type CatalogMenuItem =
  | {
      type: 'item';
      /** 元実装の WM_COMMAND メニュー ID。 */
      command: number;
      label: string;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
    }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; items: CatalogMenuItem[]; disabled?: boolean };

export type CatalogMenu = { label: string; items: CatalogMenuItem[] };

/** ファイル / 表示 / ページ移動 / ブックマーク / チェックリスト / 検索 / ウィンドウ / ヘルプ */
export const CCATALOG_MENUS: CatalogMenu[] = [
  {
    label: 'ファイル(F)',
    items: [
      {
        type: 'item',
        label: '新規作成(N)',
        command: 32818,
        shortcut: 'Ctrl+N'
      },
      {
        type: 'item',
        label: 'チェックリストを開く(O)...',
        command: 32793,
        shortcut: 'Ctrl+O'
      },
      {
        type: 'item',
        label: 'チェックリストの追加読み込み(I)...',
        command: 32795
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'チェックリストの保存(S)',
        command: 32794,
        shortcut: 'Ctrl+S'
      },
      {
        type: 'item',
        label: '名前を付けて保存(A)...',
        command: 32819
      },
      {
        type: 'item',
        label: 'Ver1形式で保存(E)...',
        command: 32843
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'チェックリストを circle.ms からインポート',
        command: 32870
      },
      {
        type: 'item',
        label: 'チェックリストを circle.ms にエクスポート',
        command: 32871
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: '印刷(P)...',
        command: 32771,
        shortcut: 'Ctrl+P'
      },
      {
        type: 'item',
        label: '画像ファイル出力(B)',
        command: 32866
      },
      {
        type: 'item',
        label: '印刷詳細設定(R)...',
        command: 32823
      },
      {
        type: 'item',
        label: '印刷設定のエクスポート(W)',
        command: 32852
      },
      {
        type: 'item',
        label: '印刷設定のインポート(Q)',
        command: 32853
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: '動作設定(C)...',
        command: 32780
      },
      {
        type: 'item',
        label: '動作設定のエクスポート(P)',
        command: 32854
      },
      {
        type: 'item',
        label: '動作設定のインポート(I)',
        command: 32855
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'コミックマーケット回数切り替え(G)...',
        command: 32829
      },
      {
        type: 'item',
        label: 'サークルデータの追加・削除(D)...',
        command: 32828
      },
      {
        type: 'item',
        label: '画像データの追加・削除(M)...',
        command: 32827
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'データベースの初期化(T)...',
        command: 32858
      },
      {
        type: 'item',
        label: 'データのネット更新(U)...',
        command: 32856
      },
      {
        type: 'item',
        label: 'データのファイル更新(V)...',
        command: 32857
      },
      {
        type: 'separator'
      },
      {
        type: 'submenu',
        label: '最近使ったファイル(F)',
        items: [
          {
            type: 'item',
            label: '(なし)',
            command: 32820,
            disabled: true
          }
        ],
        disabled: false
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'アプリケーションの終了(X)',
        command: 57665
      }
    ]
  },
  {
    label: '表示(V)',
    items: [
      {
        type: 'item',
        label: 'ズームアウト(O)',
        command: 32787,
        shortcut: 'Ctrl+\'-\''
      },
      {
        type: 'item',
        label: 'ズームイン(I)',
        command: 32788,
        shortcut: 'Ctrl+\'+\''
      },
      {
        type: 'item',
        label: '幅に合わせる(W)',
        command: 32791
      },
      {
        type: 'item',
        label: '高さに合わせる(H)',
        command: 32790
      },
      {
        type: 'item',
        label: '全体を表示(L)',
        command: 32814,
        shortcut: 'Ctrl+0'
      },
      {
        type: 'item',
        label: '元のサイズ(R)',
        command: 32789,
        shortcut: 'Ctrl+1'
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'アンチエイリアス(A)',
        command: 32792
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: '高解像度表示(R)',
        command: 32867
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'リスト中のカット表示(C)',
        command: 32868
      },
      {
        type: 'separator'
      },
      {
        type: 'submenu',
        label: 'ツールバー(T)',
        items: [
          {
            type: 'item',
            label: '基本バー(B)',
            command: 32839
          },
          {
            type: 'item',
            label: 'ページ移動バー(J)',
            command: 32840
          },
          {
            type: 'item',
            label: '表示バー(D)',
            command: 32841
          },
          {
            type: 'item',
            label: 'チェックバー(C)',
            command: 32842
          },
          {
            type: 'item',
            label: 'ナビゲートバー(N)',
            command: 32847
          }
        ],
        disabled: false
      }
    ]
  },
  {
    label: 'ページ移動(J)',
    items: [
      {
        type: 'item',
        label: '前のページ(P)',
        command: 32774,
        shortcut: 'PageUp'
      },
      {
        type: 'item',
        label: '次のページ(N)',
        command: 32775,
        shortcut: 'PageDown'
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'ページ指定で移動(G)...',
        command: 32803,
        shortcut: 'Ctrl+G'
      },
      {
        type: 'separator'
      },
      {
        type: 'submenu',
        label: '日付(D)',
        items: [
          {
            type: 'item',
            label: '日付ジャンプダミー',
            command: 32809,
            disabled: true
          }
        ],
        disabled: false
      },
      {
        type: 'submenu',
        label: 'ホール(L)',
        items: [
          {
            type: 'item',
            label: 'ホールジャンプダミー',
            command: 32810,
            disabled: true
          }
        ],
        disabled: false
      },
      {
        type: 'submenu',
        label: 'ブロック(S)',
        items: [
          {
            type: 'item',
            label: 'ブロックジャンプダミー',
            command: 32811,
            disabled: true
          }
        ],
        disabled: false
      },
      {
        type: 'submenu',
        label: 'ジャンル(R)',
        items: [
          {
            type: 'item',
            label: 'ジャンルジャンプダミー',
            command: 32812,
            disabled: true
          }
        ],
        disabled: false
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: '前に戻る(B)',
        command: 32845,
        shortcut: 'Alt←'
      },
      {
        type: 'item',
        label: '次に進む(F)',
        command: 32846,
        shortcut: 'Alt→'
      },
      {
        type: 'item',
        label: '前のブロック',
        command: 32865,
        shortcut: 'Ctrl+E'
      },
      {
        type: 'item',
        label: '次のブロック',
        command: 32864,
        shortcut: 'Ctrl+R'
      }
    ]
  },
  {
    label: 'ブックマーク(B)',
    items: [
      {
        type: 'item',
        label: 'このページを追加(A)...',
        command: 32824
      },
      {
        type: 'item',
        label: 'ブックマークの整理(O)...',
        command: 32825
      },
      {
        type: 'separator'
      }
    ]
  },
  {
    label: 'チェックリスト(A)',
    items: [
      {
        type: 'submenu',
        label: '標準のチェック色(D)',
        items: [
          {
            type: 'item',
            label: '色1',
            command: 33051
          }
        ],
        disabled: false
      },
      {
        type: 'item',
        label: 'チェック色の編集(F)...',
        command: 61227
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'サークルのメモを編集する(M)',
        command: 32860,
        shortcut: 'Ctrl+T'
      },
      {
        type: 'item',
        label: 'チェックなしサークルのメモを消去する',
        command: 32869
      },
      {
        type: 'item',
        label: '全てのメモを消去する',
        command: 32874
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: '選択サークルをクリップボードにコピー(C)',
        command: 1707
      },
      {
        type: 'item',
        label: 'クリップボードからチェックリストにペースト(P)',
        command: 1708
      }
    ]
  },
  {
    label: '検索(S)',
    items: [
      {
        type: 'item',
        label: '検索(S)...',
        command: 32801,
        shortcut: 'Ctrl+F'
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'サークルのWEBページを開く(W)',
        command: 32859,
        shortcut: 'Ctrl+Q'
      },
      {
        type: 'item',
        label: 'サークルのTWITTERを開く(T)',
        command: 32872,
        shortcut: 'Ctrl+Y'
      },
      {
        type: 'item',
        label: 'サークルのPixivを開く(T)',
        command: 32873,
        shortcut: 'Ctrl+U'
      },
      {
        type: 'item',
        label: 'サークルをGoogleで検索(G)',
        command: 32831,
        shortcut: 'Ctrl+W'
      },
      {
        type: 'item',
        label: 'Google検索の条件設定(C)',
        command: 32836
      }
    ]
  },
  {
    label: 'ウィンドウ(W)',
    items: [
      {
        type: 'item',
        label: 'ダミーメニュー',
        command: 32835,
        disabled: true
      }
    ]
  },
  {
    label: 'ヘルプ(H)',
    items: [
      {
        type: 'item',
        label: '目次(C)',
        command: 32815
      },
      {
        type: 'item',
        label: '検索(S)...',
        command: 32816
      },
      {
        type: 'item',
        label: 'キーワード(I)...',
        command: 32817
      },
      {
        type: 'separator'
      },
      {
        type: 'item',
        label: 'バージョン情報(A)...',
        command: 57664
      },
      {
        type: 'item',
        label: 'サポートページ（P)',
        command: 32844
      }
    ]
  }
];

/** メニュー ID (元実装の WM_COMMAND) のうち、Web 版でも意味を持つもの。 */
export const MENU_COMMANDS = {
  newChecklist: 32818,
  openChecklist: 32793,
  appendChecklist: 32795,
  saveChecklist: 32794,
  saveChecklistAs: 32819,
  print: 32771,
  preferences: 32780,
  switchComiket: 32829,
  search: 32801,
  searchQuick: 32799,
  googleSearch: 32831,
  googleSearchConfig: 32836,
  printDetails: 32823,
  imageOutput: 32866,
  circleData: 32828,
  imageData: 32827,
  databaseInit: 32858,
  netUpdate: 32856,
  fileUpdate: 32857,
  importCircleMs: 32870,
  exportCircleMs: 32871,
  bookmarkAdd: 32824,
  bookmarkOrganize: 32825,
  memoEdit: 32860,
  zoomOut: 32787,
  zoomIn: 32788,
  fitWidth: 32791,
  fitHeight: 32790,
  fitAll: 32814,
  actualSize: 32789,
  pagePrev: 32774,
  pageNext: 32775,
  gotoPage: 32803,
  back: 32845,
  forward: 32846,
  exit: 57665,
  about: 57664,
} as const;

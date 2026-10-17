import { useMemo, useState, type CSSProperties } from 'react';
import { Button, TextBox, Window } from '@megablacklabel/react98retro';

/** 開き方 (元実装のヘルプメニュー 32815 目次 / 32816 検索 / 32817 キーワード)。 */
export type HelpMode = 'contents' | 'search' | 'keyword';

export type HelpDialogProps = {
  mode: HelpMode;
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 元実装のヘルプ (CHM) の章立てをなぞったダミーの目次。 */
const TOPICS: readonly { title: string; body: string }[] = [
  {
    title: '1. はじめに',
    body: 'このヘルプは、コミックマーケット DVD-ROM カタログブラウザの使い方をまとめたものです。',
  },
  {
    title: '2. ウィンドウの使い方',
    body: 'サークルカット / サークル詳細 / サークル一覧 / チェックリスト / 会場マップ の 5 つのウィンドウを切り替えて使います。',
  },
  {
    title: '3. 検索と絞込み',
    body: '検索は 14 項目の条件で行い、結果に対してさらに絞込み検索ができます。やり直しで絞込み前に戻ります。',
  },
  {
    title: '4. チェックリスト',
    body: 'カットをダブルクリック (または Return) するとチェックリストに登録されます。色 1〜9 で色分けできます。',
  },
  {
    title: '5. 会場マップ',
    body: 'サークルのある机をチェック色で塗ります。ジャンル表示の濃さを変えると、ジャンル色を半透明で重ねます。',
  },
  {
    title: '6. 印刷',
    body: 'サークルリスト / サークルカット / 会場マップ / 白地図 を印刷できます。Web 版は印刷処理をダミーで再現します。',
  },
];

const MODE_TITLE: Record<HelpMode, string> = {
  contents: 'ヘルプ - 目次',
  search: 'ヘルプ - 検索',
  keyword: 'ヘルプ - キーワード',
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 4,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const LIST_STYLE: CSSProperties = {
  flex: '0 0 40%',
  minWidth: 0,
  overflow: 'auto',
  border: '2px solid',
  borderColor: '#808080 #ffffff #ffffff #808080',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
};

const TOPIC_BUTTON_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  minWidth: 0,
  minHeight: 0,
  padding: '2px 4px',
};

const CONTENT_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'auto',
  border: '2px solid',
  borderColor: '#808080 #ffffff #ffffff #808080',
  background: '#ffffff',
  padding: 6,
};

const SEARCH_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 4,
  alignItems: 'center',
  padding: '4px 4px 0',
  flex: '0 0 auto',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: 4,
  flex: '0 0 auto',
};

/**
 * ヘルプ (元実装の CHM)。目次 / 検索 / キーワードの 3 つとも同じ画面を開き、
 * キーワードで目次を絞り込める。中身はダミー (元実装の章立てだけをなぞる)。
 */
export function HelpDialog({
  mode,
  onClose,
  initialX = 220,
  initialY = 100,
  width = 520,
  height = 360,
  zIndex,
}: HelpDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(0);

  const topics = useMemo(() => {
    const needle = keyword.trim();
    if (needle.length === 0) return TOPICS;
    return TOPICS.filter((topic) => topic.title.includes(needle) || topic.body.includes(needle));
  }, [keyword]);

  const shown = topics[selected] ?? topics[0];

  return (
    <Window
      data-testid="help-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title={MODE_TITLE[mode]}
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div data-testid="help-body" style={BODY_STYLE}>
        <div style={LIST_STYLE}>
          {topics.map((topic, index) => (
            <Button
              key={topic.title}
              type="button"
              variant={topic === shown ? 'default' : undefined}
              data-testid="help-topic"
              style={TOPIC_BUTTON_STYLE}
              onClick={() => setSelected(index)}
            >
              {topic.title}
            </Button>
          ))}
        </div>
        <div data-testid="help-content" style={CONTENT_STYLE}>
          {shown === undefined ? '該当する項目がありません' : shown.body}
        </div>
      </div>
      <div style={SEARCH_ROW_STYLE}>
        <TextBox
          aria-label="キーワード"
          placeholder="キーワード"
          style={{ flex: '1 1 auto' }}
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setSelected(0);
          }}
        />
      </div>
      <div style={BUTTON_ROW_STYLE}>
        <Button variant="default" data-testid="help-close" onClick={onClose}>
          閉じる(&C)
        </Button>
      </div>
    </Window>
  );
}

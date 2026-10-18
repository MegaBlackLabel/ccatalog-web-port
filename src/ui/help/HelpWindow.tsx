import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Tabs, TreeView, Window, type TreeViewItem } from '@megablacklabel/react98retro';
import { HELP_ICONS, type HelpIconName } from './help-icons';
import {
  findTopics,
  topicSnippet,
  topicUrl,
  type HelpData,
  type HelpIndexEntry,
  type HelpTocEntry,
  type HelpTopicText,
} from './help-data';
import { loadHelpData } from './help-source';

/** 開くタブ (元実装のヘルプ メニュー 32815 目次 / 32816 検索 / 32817 キーワード)。 */
export type HelpPane = 'contents' | 'keyword' | 'search';

export type HelpWindowProps = {
  /** 最初に開くタブ。 */
  pane: HelpPane;
  onClose: () => void;
  /** データの読み込み口 (テストで差し替える。既定は公開資産 /help/**)。 */
  load?: () => Promise<HelpData>;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 実機のウィンドウ (実測 480x360 はビューアの既定。ユーザー提供のスクリーンショットは 1065x956)。 */
const HELP_WIDTH = 1065;
const HELP_HEIGHT = 956;

const WINDOW_TITLE = 'コミケットDVD-ROMカタログブラウザ ヘルプ';

/** ナビゲーション パネルの幅 (実測: ウィンドウ 480 でも 1065 でも 250px の固定)。 */
const NAV_WIDTH = 250;

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flex: '1 1 auto',
  minHeight: 0,
  gap: 2,
  padding: 2,
};

const TOOLBAR_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 2,
  flex: '0 0 auto',
  padding: '2px 4px',
  background: '#c0c0c0',
  borderBottom: '1px solid #808080',
};

/** 実機のツールバー ボタン (アイコンの下にラベル)。 */
const TOOL_BUTTON_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  minWidth: 0,
  minHeight: 0,
  padding: '2px 4px',
  fontSize: 12,
  lineHeight: 1,
  background: 'transparent',
  border: '1px solid transparent',
  boxShadow: 'none',
};

const MENU_STYLE: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: 180,
  padding: 2,
  background: '#c0c0c0',
  border: '2px solid',
  borderColor: '#ffffff #000000 #000000 #ffffff',
  boxShadow: '1px 1px 0 #000000',
  zIndex: 10,
};

const MENU_ITEM_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  minWidth: 0,
  minHeight: 0,
  padding: '2px 6px',
  textAlign: 'left',
  fontSize: 12,
  background: 'transparent',
  border: 0,
  boxShadow: 'none',
};

const NAV_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: `0 0 ${NAV_WIDTH}px`,
  minWidth: 0,
  minHeight: 0,
};

/** ナビゲーション パネルの中身 (タブの下) は、ウィンドウの下端まで伸ばす。 */
const LIST_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  background: '#ffffff',
  fontSize: 12,
};

const SCROLL_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
};

const ROW_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  minWidth: 0,
  minHeight: 0,
  padding: '1px 3px',
  fontSize: 12,
  background: 'transparent',
  border: 0,
  boxShadow: 'none',
};

const SEARCH_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 3,
  padding: 3,
  flex: '0 0 auto',
};

const HIT_STYLE: CSSProperties = {
  ...ROW_STYLE,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  padding: '2px 3px',
};

const SNIPPET_STYLE: CSSProperties = { color: '#404040' };

const TOPIC_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
  width: '100%',
  height: '100%',
  background: '#ffffff',
  border: '2px solid',
  borderColor: '#808080 #ffffff #ffffff #808080',
};

/**
 * ヘルプ (元実装の CHM = ccatalog.chm)。
 *
 * 実機は HtmlHelp() で HTML Help ビューアを開く。ここではビューアの見た目 (ツールバー
 * 非表示 / 戻る / 印刷 / オプション(Q)、目次 / キーワード / 検索のタブ) と、元の HTML を
 * そのまま出すトピック パネル (iframe) を移植する。トピックの HTML / 画像 / COMMON.CSS は
 * tools/gen-help-assets.py が CHM から取り出した公開資産 (public/help/**) を配信する。
 *
 * 目次の木はライブラリの `TreeView`、色ボタンなどのスクロールバーはライブラリの 98 風
 * スクロールバーを使う (トピック パネルの中は別の文書なので、同じ規則を
 * public/help/help-scrollbars.css として配信して元の CSS に足している)。
 */
export function HelpWindow({
  pane,
  onClose,
  load = loadHelpData,
  initialX = 200,
  initialY = 60,
  width = HELP_WIDTH,
  height = HELP_HEIGHT,
  zIndex,
}: HelpWindowProps) {
  const [tab, setTab] = useState<HelpPane>(pane);
  const [data, setData] = useState<HelpData | null>(null);
  const [failed, setFailed] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly string[]>([]);
  const [future, setFuture] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<readonly HelpTopicText[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 「同期」で開く目次 (TreeView の defaultOpen に渡す)。 */
  const [syncOpen, setSyncOpen] = useState<ReadonlySet<string>>(new Set<string>());
  const [syncKey, setSyncKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let alive = true;
    load()
      .then((loaded) => {
        if (!alive) return;
        setData(loaded);
        // 実機と同じく、開いた時点では目次の先頭のトピックを出す。
        setCurrent(loaded.toc[0]?.local ?? loaded.topics[0]?.path ?? null);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [load]);

  /** トピックを出す (直前のトピックを履歴に積む)。 */
  const showTopic = (local: string) => {
    if (current !== null && current !== local) setHistory((past) => [...past, current]);
    setFuture([]);
    setCurrent(local);
  };

  const goBack = () => {
    const previous = history[history.length - 1];
    if (previous === undefined || current === null) return;
    setHistory(history.slice(0, -1));
    setFuture([current, ...future]);
    setCurrent(previous);
  };

  const goForward = () => {
    const next = future[0];
    if (next === undefined || current === null) return;
    setFuture(future.slice(1));
    setHistory([...history, current]);
    setCurrent(next);
  };

  const runSearch = () => {
    setHits(data === null ? [] : findTopics(data.topics, query));
  };

  const printTopic = () => frameRef.current?.contentWindow?.print();

  /** 目次を表示中のトピックに合わせて開く (実機の 表示 > 同期)。 */
  const syncToc = () => {
    if (current === null || data === null) return;
    const ancestors = new Set<string>();
    const walk = (entries: readonly HelpTocEntry[], trail: string[]): boolean =>
      entries.some((entry) => {
        if (entry.local === current) {
          trail.forEach((local) => ancestors.add(local));
          return true;
        }
        return walk(entry.children, [...trail, entry.local]);
      });
    walk(data.toc, []);
    setSyncOpen(ancestors);
    setSyncKey((key) => key + 1); // TreeView を作り直して defaultOpen を効かせる
    setTab('contents');
  };

  const tocItems = useMemo(
    () =>
      (data?.toc ?? []).map(function toItem(entry): TreeViewItem {
        return {
          id: entry.local,
          defaultOpen: syncOpen.has(entry.local),
          // 入れ子を持つ項目は、名前を押すとそのトピックを出す (畳み/開きは + が担う)。
          // ラベルのクリックでそのトピックを出す (入れ子の開閉は TreeView が担う)。
          label: (
            <span data-testid="help-toc-label" onClick={() => showTopic(entry.local)}>
              {entry.name}
            </span>
          ),
          children: entry.children.map(toItem),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, syncOpen],
  );

  const frameSource = current === null ? 'about:blank' : topicUrl(current);

  return (
    <Window
      data-testid="help-window"
      title={WINDOW_TITLE}
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      style={{ minWidth: 320, minHeight: 240 }}
    >
      <div data-testid="help-toolbar" style={TOOLBAR_STYLE}>
        <ToolButton
          icon={navHidden ? 'show' : 'hide'}
          label={navHidden ? '表示' : '非表示'}
          onClick={() => setNavHidden((hidden) => !hidden)}
        />
        <ToolButton
          icon="back"
          label="戻る"
          disabled={history.length === 0}
          onClick={goBack}
        />
        {future.length === 0 ? null : (
          <ToolButton icon="forward" label="進む" onClick={goForward} />
        )}
        <ToolButton icon="print" label="印刷" onClick={printTopic} />
        <div style={{ position: 'relative' }}>
          <ToolButton icon="options" label="オプション(Q)" onClick={() => setMenuOpen((open) => !open)} />
          {menuOpen ? (
            <div data-testid="help-options-menu" role="menu" style={MENU_STYLE}>
              {/* 実機のビューアのコマンドのうち、Web 版が実装しているものだけを出す
                  (「ナビゲーション タブ」はナビ パネルの開閉 = 非表示 / 表示 と同じ)。 */}
              <button
                type="button"
                role="menuitem"
                style={MENU_ITEM_STYLE}
                onClick={() => {
                  setNavHidden((hidden) => !hidden);
                  setMenuOpen(false);
                }}
              >
                ナビゲーション タブ(N)
              </button>
              <button
                type="button"
                role="menuitem"
                style={MENU_ITEM_STYLE}
                onClick={() => {
                  syncToc();
                  setMenuOpen(false);
                }}
              >
                同期(L)
              </button>
              <button
                type="button"
                role="menuitem"
                style={MENU_ITEM_STYLE}
                onClick={() => {
                  printTopic();
                  setMenuOpen(false);
                }}
              >
                印刷(P)...
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {failed ? (
        <div data-testid="help-error" style={{ padding: 8 }}>
          ヘルプを読み込めませんでした
        </div>
      ) : (
        <div style={BODY_STYLE}>
          {navHidden ? null : (
            <div data-testid="help-nav" style={NAV_STYLE}>
              <Tabs
                tabs={[
                  {
                    id: 'contents',
                    label: '目次(C)',
                    content: (
                      <div style={LIST_STYLE} data-testid="help-toc">
                        <TreeView
                          key={syncKey}
                          data-testid="help-toc-tree"
                          items={tocItems}
                          selectedId={current ?? undefined}
                          style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}
                        />
                      </div>
                    ),
                  },
                  {
                    id: 'keyword',
                    label: 'キーワード(N)',
                    content: (
                      <div style={LIST_STYLE} data-testid="help-keywords">
                        <div style={SCROLL_STYLE}>
                          {(data?.index ?? []).map((entry) => (
                            <KeywordRow
                              key={`${entry.name}:${entry.local}`}
                              entry={entry}
                              onOpen={showTopic}
                            />
                          ))}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'search',
                    label: '検索(S)',
                    content: (
                      <div style={LIST_STYLE}>
                        <div style={SEARCH_ROW_STYLE}>
                          <input
                            aria-label="検索"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') runSearch();
                            }}
                            style={{ flex: '1 1 auto', minWidth: 0 }}
                          />
                          <button type="button" onClick={runSearch}>
                            検索(S)
                          </button>
                        </div>
                        <div data-testid="help-hits" style={SCROLL_STYLE}>
                          {hits === null
                            ? null
                            : hits.map((topic) => (
                                <button
                                  key={topic.path}
                                  type="button"
                                  data-testid="help-hit"
                                  style={HIT_STYLE}
                                  onClick={() => showTopic(topic.path)}
                                >
                                  <span>{topic.title}</span>
                                  <span style={SNIPPET_STYLE}>{topicSnippet(topic, query)}</span>
                                </button>
                              ))}
                        </div>
                      </div>
                    ),
                  },
                ]}
                activeTab={tab}
                onTabChange={(id) => setTab(id as HelpPane)}
                fill
                style={{ flex: '1 1 auto', minHeight: 0 }}
                panelClassName="help-panel"
              />
            </div>
          )}
          <iframe
            ref={frameRef}
            data-testid="help-topic-frame"
            title="トピック"
            src={frameSource}
            style={TOPIC_STYLE}
          />
        </div>
      )}
    </Window>
  );
}

/** 実機と同じ、アイコンの下にラベルを置くツールバー ボタン。 */
function ToolButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: HelpIconName;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="toolbar-icon-button"
      disabled={disabled}
      style={TOOL_BUTTON_STYLE}
      onClick={onClick}
    >
      <img src={HELP_ICONS[icon]} alt="" aria-hidden="true" />
      {label}
    </button>
  );
}

/** キーワード (索引) の 1 行。実機は親キーワードで入れ子にするが、ここは名前順の 1 列で出す。 */
function KeywordRow({ entry, onOpen }: { entry: HelpIndexEntry; onOpen: (local: string) => void }) {
  return (
    <button
      type="button"
      data-testid="help-keyword-row"
      aria-label={entry.name}
      style={ROW_STYLE}
      onClick={() => onOpen(entry.local)}
    >
      {entry.name}
      {entry.group === entry.name ? null : <span style={SNIPPET_STYLE}> （{entry.group}）</span>}
    </button>
  );
}

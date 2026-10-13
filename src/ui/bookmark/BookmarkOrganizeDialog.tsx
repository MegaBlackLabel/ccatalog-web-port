import { useEffect, useState, type CSSProperties } from 'react';
import { Button, TextBox, Window } from '@megablacklabel/react98retro';
import type { Bookmark } from '../../domain/app-settings';

export type BookmarkOrganizeDialogProps = {
  /** 登録済みのブックマーク (表示順そのままに、グループ単位でまとめて出す)。 */
  bookmarks: readonly Bookmark[];
  /** 選択項目の名前変更。空文字は呼ばない。 */
  onRename: (id: number, name: string) => void;
  /** 選択項目の削除。 */
  onRemove: (ids: number[]) => void;
  /** 選択項目のグループ変更。空文字は未分類。 */
  onSetGroup: (ids: number[], group: string) => void;
  /** 項目のダブルクリック。そのページへ移動する。 */
  onJump: (pageNo: number) => void;
  /** 閉じる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** グループ未設定 (Bookmark.group が空文字) の見出し。 */
const UNCLASSIFIED_LABEL = '(未分類)';

/** グループ 1 つ分のツリー (表示順を保つため配列で組み立てる)。 */
type BookmarkGroup = {
  /** まとめの基準にした生のグループ名。 */
  key: string;
  /** ツリーの見出しに出す名前。 */
  label: string;
  bookmarks: Bookmark[];
};

function groupBookmarks(bookmarks: readonly Bookmark[]): BookmarkGroup[] {
  const groups: BookmarkGroup[] = [];
  for (const bookmark of bookmarks) {
    const existing = groups.find((group) => group.key === bookmark.group);
    if (existing === undefined) {
      groups.push({
        key: bookmark.group,
        label: bookmark.group === '' ? UNCLASSIFIED_LABEL : bookmark.group,
        bookmarks: [bookmark],
      });
    } else {
      existing.bookmarks.push(bookmark);
    }
  }
  return groups;
}

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const MAIN_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 8,
  flex: '1 1 auto',
  minHeight: 0,
};

const TREE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
  background: '#ffffff',
  border: '2px inset #d4d0c8',
};

const GROUP_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 4px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 4px 2px 18px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const SELECTED_ROW_STYLE: CSSProperties = {
  background: '#000080',
  color: '#ffffff',
};

const EMPTY_STYLE: CSSProperties = {
  padding: 6,
  color: '#404040',
};

const SIDE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: '0 0 auto',
  width: 150,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

export function BookmarkOrganizeDialog({
  bookmarks,
  onRename,
  onRemove,
  onSetGroup,
  onJump,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: BookmarkOrganizeDialogProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [groupDraft, setGroupDraft] = useState('');

  const selected = bookmarks.find((bookmark) => bookmark.id === selectedId) ?? null;
  const selectedName = selected === null ? '' : selected.name;

  // 選択が変わったら名前欄をその項目の名前で埋め直す (アプリ側で名前が変わったときも追従)。
  useEffect(() => {
    setRenameDraft(selectedName);
  }, [selectedId, selectedName]);

  const rename = () => {
    if (selected === null) return;
    const trimmed = renameDraft.trim();
    if (trimmed === '') return;
    onRename(selected.id, trimmed);
  };

  const applyGroup = () => {
    if (selected === null) return;
    onSetGroup([selected.id], groupDraft.trim());
  };

  const remove = () => {
    if (selected === null) return;
    onRemove([selected.id]);
  };

  const groups = groupBookmarks(bookmarks);

  return (
    <Window
      data-testid="bookmark-organize-dialog"
      title="ブックマークの整理"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={MAIN_ROW_STYLE}>
          <div data-testid="bookmark-list" data-ctrl-id={1602} style={TREE_STYLE}>
            {bookmarks.length === 0 ? (
              <div style={EMPTY_STYLE}>ブックマークは登録されていません</div>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <div style={GROUP_ROW_STYLE}>{group.label}</div>
                  {group.bookmarks.map((bookmark) => {
                    const isSelected = bookmark.id === selectedId;
                    return (
                      <div
                        key={bookmark.id}
                        data-testid="bookmark-row"
                        data-bookmark-id={bookmark.id}
                        data-selected={isSelected ? 'true' : 'false'}
                        style={isSelected ? { ...ROW_STYLE, ...SELECTED_ROW_STYLE } : ROW_STYLE}
                        onClick={() => setSelectedId(bookmark.id)}
                        onDoubleClick={() => onJump(bookmark.pageNo)}
                      >
                        {bookmark.name}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div style={SIDE_STYLE}>
            <TextBox
              id="bookmark-rename-input"
              label="名前(N):"
              data-ctrl-id={32826}
              data-testid="bookmark-rename-input"
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
            />
            <Button data-testid="bookmark-rename-submit" onClick={rename}>
              変更
            </Button>
            <TextBox
              id="bookmark-group-input"
              label="グループ(G):"
              data-testid="bookmark-group-input"
              value={groupDraft}
              onChange={(event) => setGroupDraft(event.target.value)}
            />
            <Button data-testid="bookmark-group-submit" onClick={applyGroup}>
              設定
            </Button>
            <Button data-testid="bookmark-remove" disabled={selected === null} onClick={remove}>
              削除(D)
            </Button>
          </div>
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-ctrl-id={1} data-testid="bookmark-organize-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}

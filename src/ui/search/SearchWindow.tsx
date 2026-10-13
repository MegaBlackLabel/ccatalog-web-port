import { useState, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  GroupBox,
  OptionButton,
  StatusBar,
  StatusBarField,
  TextBox,
  Window,
} from '@megablacklabel/react98retro';
import { splitKeywords, type SearchCondition } from '../../domain/search';
import { SEARCH_FIELDS, isFieldSelected } from '../../domain/search-fields';
import type { Genre } from '../../domain/types';

export type SearchWindowProps = {
  condition: SearchCondition;
  genres: readonly Genre[];
  /** 絞込みボタンの disabled = !canNarrow。 */
  canNarrow: boolean;
  canUndoNarrow: boolean;
  /** 1704「検索実行後も検索ダイアログを表示したままにする」の現在値。 */
  keepOpen?: boolean;
  onKeepOpenChange?: (keepOpen: boolean) => void;
  onConditionChange: (patch: Partial<SearchCondition>) => void;
  onSearch: () => void;
  onNarrow: () => void;
  onUndoNarrow: () => void;
  onReset: () => void;
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
};

type DayOption = { day: number; label: string; controlId: number };

/** 参加日チェックボックス (リソース #135 の 1003-1007)。抽選漏れは day 0。 */
const DAY_OPTIONS: readonly DayOption[] = [
  { day: 1, label: '1日目', controlId: 1003 },
  { day: 2, label: '2日目', controlId: 1004 },
  { day: 3, label: '3日目', controlId: 1005 },
  { day: 4, label: '4日目', controlId: 1006 },
  { day: 0, label: '抽選漏れ', controlId: 1007 },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 4,
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
};

const ROW_STYLE: CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-start' };

const INNER_ROW_STYLE: CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-start' };

/** 検索対象項目は元実装と同じ 2 列 (7 行 x 2 列)。 */
const FIELD_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'repeat(7, auto)',
  gridAutoFlow: 'column',
  columnGap: 8,
  rowGap: 1,
};

const GENRE_LIST_STYLE: CSSProperties = {
  height: 150,
  overflow: 'auto',
  background: '#ffffff',
  border: '1px solid #808080',
  padding: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const BUTTON_ROW_STYLE: CSSProperties = { display: 'flex', gap: 6, alignItems: 'center' };

const SPACER_STYLE: CSSProperties = { flex: '1 1 auto' };

export function SearchWindow({
  condition,
  genres,
  canNarrow,
  canUndoNarrow,
  keepOpen,
  onKeepOpenChange,
  onConditionChange,
  onSearch,
  onNarrow,
  onUndoNarrow,
  onReset,
  onClose,
  initialX = 80,
  initialY = 60,
  width = 620,
  height = 470,
}: SearchWindowProps) {
  const [keepOpenFallback, setKeepOpenFallback] = useState(true);
  const keepOpenValue = keepOpen ?? keepOpenFallback;

  const selectedFieldCount = SEARCH_FIELDS.filter((field) =>
    isFieldSelected(condition.fields, field.key),
  ).length;

  const status = [
    `検索対象項目 ${selectedFieldCount}`,
    `日付 ${condition.days.length}`,
    `ジャンル ${condition.genres.length}`,
    `キーワード ${splitKeywords(condition.keywords).length} 語`,
  ].join(' / ');

  return (
    <div data-testid="search-window">
      <Window
        title="サークル検索"
        onClose={onClose}
        width={width}
        height={height}
        initialX={initialX}
        initialY={initialY}
        statusBar={
          <StatusBar>
            <StatusBarField>{status}</StatusBarField>
          </StatusBar>
        }
      >
        <div style={BODY_STYLE}>
          <div style={ROW_STYLE}>
            <GroupBox legend="検索範囲" style={{ flex: '1 1 auto' }}>
              <div style={INNER_ROW_STYLE}>
                <GroupBox legend="参加日" style={{ flex: '0 0 auto' }}>
                  {DAY_OPTIONS.map((option) => {
                    const checked = condition.days.includes(option.day);
                    return (
                      <Checkbox
                        key={option.day}
                        id={`search-day-${option.day}`}
                        label={option.label}
                        checked={checked}
                        onChange={() =>
                          onConditionChange({
                            days: checked
                              ? condition.days.filter((day) => day !== option.day)
                              : [...condition.days, option.day],
                          })
                        }
                        data-ctrl-id={option.controlId}
                      />
                    );
                  })}
                </GroupBox>
                <GroupBox legend="検索対象項目" style={{ flex: '1 1 auto' }}>
                  <div style={FIELD_GRID_STYLE}>
                    {SEARCH_FIELDS.map((field) => {
                      const selected = isFieldSelected(condition.fields, field.key);
                      return (
                        <Checkbox
                          key={field.key}
                          id={`search-field-${field.key}`}
                          label={field.label}
                          checked={selected}
                          onChange={() =>
                            onConditionChange({
                              fields: selected
                                ? condition.fields & ~field.bit
                                : condition.fields | field.bit,
                            })
                          }
                          data-ctrl-id={field.controlId}
                        />
                      );
                    })}
                  </div>
                </GroupBox>
              </div>
              <Checkbox
                id="search-memo-only"
                label="メモが記入されているサークルのみ探す"
                checked={condition.memoOnly}
                onChange={(event) => onConditionChange({ memoOnly: event.target.checked })}
                data-ctrl-id={1040}
              />
              <Checkbox
                id="search-updated-only"
                label="更新されたサークルのみ探す"
                checked={condition.updatedOnly}
                onChange={(event) => onConditionChange({ updatedOnly: event.target.checked })}
                data-ctrl-id={1047}
              />
            </GroupBox>
            <GroupBox legend="検索対象ジャンル" style={{ width: 250, flex: '0 0 auto' }}>
              <div data-ctrl-id={1015} style={GENRE_LIST_STYLE}>
                {genres.length === 0 ? (
                  <span style={{ fontSize: 11 }}>ジャンルがありません</span>
                ) : (
                  genres.map((genre) => {
                    const checked = condition.genres.includes(genre.id);
                    return (
                      <Checkbox
                        key={genre.id}
                        id={`search-genre-${genre.id}`}
                        label={genre.name}
                        checked={checked}
                        onChange={() =>
                          onConditionChange({
                            genres: checked
                              ? condition.genres.filter((id) => id !== genre.id)
                              : [...condition.genres, genre.id],
                          })
                        }
                      />
                    );
                  })
                )}
              </div>
              <div style={BUTTON_ROW_STYLE}>
                <Button
                  data-ctrl-id={7}
                  onClick={() => onConditionChange({ genres: genres.map((genre) => genre.id) })}
                >
                  全部選択
                </Button>
                <Button data-ctrl-id={6} onClick={() => onConditionChange({ genres: [] })}>
                  全部解除
                </Button>
              </div>
            </GroupBox>
          </div>

          <GroupBox legend="検索キーワード（スペースで区切って複数入力できます）">
            <Checkbox
              id="search-fuzzy"
              label="あいまい検索"
              checked={condition.fuzzy}
              onChange={(event) => onConditionChange({ fuzzy: event.target.checked })}
              data-ctrl-id={1017}
            />
            <TextBox
              id="search-keyword-input"
              label="キーワード :"
              style={{ flex: '1 1 auto' }}
              value={condition.keywords}
              onChange={(event) => onConditionChange({ keywords: event.target.value })}
              data-ctrl-id={1000}
              data-testid="search-keyword"
            />
            <div style={INNER_ROW_STYLE}>
              <OptionButton
                id="search-and-mode"
                name="search-keyword-mode"
                label="全ての語を含む"
                checked={condition.andMode}
                onChange={() => onConditionChange({ andMode: true })}
                data-ctrl-id={1001}
              />
              <OptionButton
                id="search-or-mode"
                name="search-keyword-mode"
                label="いずれかの語を含む"
                checked={!condition.andMode}
                onChange={() => onConditionChange({ andMode: false })}
                data-ctrl-id={1002}
              />
            </div>
            <Checkbox
              id="search-keep-open"
              label="検索実行後も検索ダイアログを表示したままにする"
              checked={keepOpenValue}
              onChange={(event) => {
                setKeepOpenFallback(event.target.checked);
                onKeepOpenChange?.(event.target.checked);
              }}
              data-ctrl-id={1704}
            />
          </GroupBox>

          <div style={BUTTON_ROW_STYLE}>
            <Button data-testid="search-reset" data-ctrl-id={1041} onClick={onReset}>
              検索条件を初期化
            </Button>
            <span style={SPACER_STYLE} />
            <Button variant="default" data-testid="search-run" data-ctrl-id={1} onClick={onSearch}>
              検索
            </Button>
            <Button
              data-testid="search-narrow"
              data-ctrl-id={3}
              disabled={!canNarrow}
              onClick={onNarrow}
            >
              絞込み
            </Button>
            <Button
              data-testid="search-undo"
              data-ctrl-id={4}
              disabled={!canUndoNarrow}
              onClick={onUndoNarrow}
            >
              やり直し
            </Button>
            <Button data-testid="search-close" data-ctrl-id={2} onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </Window>
    </div>
  );
}

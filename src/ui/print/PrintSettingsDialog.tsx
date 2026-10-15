import { useState, type CSSProperties } from 'react';
import { Button, Tabs, Window } from '@megablacklabel/react98retro';
import type { PrintListSettings } from './PrintListDialog';
import { PrintListPage } from './PrintListDialog';
import type { PrintCutSettings } from './PrintCutDialog';
import { PrintCutPage } from './PrintCutDialog';
import type { PrintMapSettings } from './PrintMapDialog';
import { PrintMapPage } from './PrintMapDialog';

/**
 * 印刷詳細設定。元実装は形式ごとに 1 枚のダイアログ (ダイアログ 163〜166) だが、
 * 動作設定と同じプロパティシートとして 1 枚のウィンドウにまとめる
 * (タブ = サークルリスト印刷 / サークルカット印刷 / マップ印刷 / 白地図印刷)。
 *
 * ウィンドウの寸法は元実装の実測相当 (660 x 442 の資源寸法に、動作設定と同じ比率を当てた 686 x 664)。
 */
export const PRINT_SETTINGS_TABS = [
  { id: 'list', label: 'サークルリスト印刷' },
  { id: 'cut', label: 'サークルカット印刷' },
  { id: 'map', label: 'マップ印刷' },
  { id: 'blankMap', label: '白地図印刷' },
] as const;

export type PrintSettingsTabId = (typeof PRINT_SETTINGS_TABS)[number]['id'];

export type PrintSettingsDialogProps = {
  /** 最初に開くタブ。 */
  initialTab?: PrintSettingsTabId;
  listSettings: PrintListSettings;
  cutSettings: PrintCutSettings;
  mapSettings: PrintMapSettings;
  onListChange: (patch: Partial<PrintListSettings>) => void;
  onCutChange: (patch: Partial<PrintCutSettings>) => void;
  onMapChange: (patch: Partial<PrintMapSettings>) => void;
  /** 表示中のタブのプレビュー。 */
  onPreview: (tab: PrintSettingsTabId) => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 確定待ちの編集 (キーごとの patch)。「適用」の有効 / 無効と確定時の通知に使う。 */
type PendingEdits = {
  list?: Partial<PrintListSettings>;
  cut?: Partial<PrintCutSettings>;
  map?: Partial<PrintMapSettings>;
};

export function PrintSettingsDialog({
  initialTab = 'list',
  listSettings,
  cutSettings,
  mapSettings,
  onListChange,
  onCutChange,
  onMapChange,
  onPreview,
  onClose,
  initialX = 240,
  initialY = 30,
  // 元実装の資源寸法 660 x 442 に、動作設定 (411 x 452 → 実測 439 x 670) と同じ比率を当てた寸法。
  // 実物のウィンドウ幅は 690px (ユーザー提供スクリーンショット実測: 枠 682 + 影 8)。
  // このときタブ ページは 672x584 になり、実物のタブ ページ実寸と一致する。
  width = 690,
  height = 664,
  zIndex,
}: PrintSettingsDialogProps) {
  const [tab, setTab] = useState<PrintSettingsTabId>(initialTab);
  /** 編集中の値 (OK / 適用(A) で親へ出すまで確定しない)。 */
  const [draft, setDraft] = useState({ list: listSettings, cut: cutSettings, map: mapSettings });
  /** まだ確定していない編集 (「適用」の有効 / 無効と、確定時に渡す patch)。 */
  const [pending, setPending] = useState<PendingEdits>({});
  const dirty = Object.values(pending).some((patch) => patch !== undefined);

  const editList = (patch: Partial<PrintListSettings>) => {
    setDraft((prev) => ({ ...prev, list: { ...prev.list, ...patch } }));
    setPending((prev) => ({ ...prev, list: { ...prev.list, ...patch } }));
  };

  const editCut = (patch: Partial<PrintCutSettings>) => {
    setDraft((prev) => ({ ...prev, cut: { ...prev.cut, ...patch } }));
    setPending((prev) => ({ ...prev, cut: { ...prev.cut, ...patch } }));
  };

  const editMap = (patch: Partial<PrintMapSettings>) => {
    setDraft((prev) => ({ ...prev, map: { ...prev.map, ...patch } }));
    setPending((prev) => ({ ...prev, map: { ...prev.map, ...patch } }));
  };

  /** 溜めた編集を親へ出す (OK / 適用(A))。 */
  const commit = () => {
    if (pending.list) onListChange(pending.list);
    if (pending.cut) onCutChange(pending.cut);
    if (pending.map) onMapChange(pending.map);
  };

  const pages: Record<PrintSettingsTabId, React.ReactNode> = {
    list: <PrintListPage settings={draft.list} onChange={editList} onPreview={() => onPreview('list')} />,
    cut: <PrintCutPage settings={draft.cut} onChange={editCut} onPreview={() => onPreview('cut')} />,
    map: (
      <PrintMapPage
        settings={{ ...draft.map, blank: false }}
        onChange={editMap}
        onPreview={() => onPreview('map')}
      />
    ),
    blankMap: (
      <PrintMapPage
        settings={{ ...draft.map, blank: true }}
        onChange={editMap}
        onPreview={() => onPreview('blankMap')}
      />
    ),
  };

  return (
    <Window
      data-testid="print-settings-dialog"
      title="印刷詳細設定"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <Tabs
          tabs={PRINT_SETTINGS_TABS.map((item) => ({
            id: item.id,
            label: item.label,
            content: pages[item.id],
          }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as PrintSettingsTabId)}
          fill
          style={{ flex: '1 1 auto', minHeight: 0 }}
          panelClassName="print-settings-page"
        />
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="print-settings-ok"
            onClick={() => {
              commit();
              setPending({});
              onClose();
            }}
          >
            OK
          </Button>
          <Button data-testid="print-settings-cancel" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            data-testid="print-settings-apply"
            disabled={!dirty}
            onClick={() => {
              commit();
              setPending({});
            }}
          >
            適用(A)
          </Button>
        </div>
      </div>
    </Window>
  );
}

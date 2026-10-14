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
  /** 用紙サイズ・余白の設定 (元実装のダイアログ 203)。 */
  onPageSetup: () => void;
  /** 印刷 (プリンタ選択から来た流れ。元実装は印刷ダイアログで実行する)。 */
  onPrint: () => void;
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

const TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
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
  onPageSetup,
  onPrint,
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

  const pages: Record<PrintSettingsTabId, React.ReactNode> = {
    list: <PrintListPage settings={listSettings} onChange={onListChange} onPreview={() => onPreview('list')} />,
    cut: <PrintCutPage settings={cutSettings} onChange={onCutChange} onPreview={() => onPreview('cut')} />,
    map: (
      <PrintMapPage
        settings={{ ...mapSettings, blank: false }}
        onChange={onMapChange}
        onPreview={() => onPreview('map')}
      />
    ),
    blankMap: (
      <PrintMapPage
        settings={{ ...mapSettings, blank: true }}
        onChange={onMapChange}
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
          <Button data-ctrl-id={203} data-testid="print-settings-page-setup" style={TEXT_BUTTON_STYLE} onClick={onPageSetup}>
            用紙サイズ・余白...
          </Button>
          <Button variant="default" data-testid="print-settings-print" style={TEXT_BUTTON_STYLE} onClick={onPrint}>
            印刷
          </Button>
          <Button data-testid="print-settings-close" style={TEXT_BUTTON_STYLE} onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}

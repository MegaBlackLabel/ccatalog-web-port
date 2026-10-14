import { DIALOG_LIFT_STYLE } from '../dialog-layer';
import { PrintCutDialog, type PrintCutSettings } from './PrintCutDialog';
import { PrintListDialog, type PrintListSettings } from './PrintListDialog';
import { PrintMapDialog, type PrintMapSettings } from './PrintMapDialog';
import type { ImageOutputFormat } from './ImageFileOutputDialog';

export type ImageOutputDetailsDialogProps = {
  /** 選んでいる出力形式 (ダイアログ 197 のラジオ 1046 / 1048 / 1049 / 1053)。 */
  outputFormat: ImageOutputFormat;
  listSettings: PrintListSettings;
  cutSettings: PrintCutSettings;
  mapSettings: PrintMapSettings;
  onListChange: (patch: Partial<PrintListSettings>) => void;
  onCutChange: (patch: Partial<PrintCutSettings>) => void;
  onMapChange: (patch: Partial<PrintMapSettings>) => void;
  onPreview: () => void;
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (画像ファイル出力の右隣に出す)。 */
  initialX?: number;
  initialY?: number;
};

/**
 * 画像ファイル出力の「詳細設定」(ダイアログ 197 の 1051) が開く詳細ダイアログ。
 * 元実装は出力形式ごとの印刷詳細設定 (サークルリスト印刷 / サークルカット印刷 / マップ印刷 /
 * 白地図印刷) を開くため、同じ中身のダイアログを出す。
 */
export function ImageOutputDetailsDialog({
  outputFormat,
  listSettings,
  cutSettings,
  mapSettings,
  onListChange,
  onCutChange,
  onMapChange,
  onPreview,
  onClose,
  initialX,
  initialY,
}: ImageOutputDetailsDialogProps) {
  const dialog =
    outputFormat === 'cut' ? (
      <PrintCutDialog
        settings={cutSettings}
        onChange={onCutChange}
        onPreview={onPreview}
        onClose={onClose}
        initialX={initialX}
        initialY={initialY}
      />
    ) : outputFormat === 'map' || outputFormat === 'blankMap' ? (
      <PrintMapDialog
        settings={{ ...mapSettings, blank: outputFormat === 'blankMap' }}
        onChange={onMapChange}
        onPreview={onPreview}
        onClose={onClose}
        initialX={initialX}
        initialY={initialY}
      />
    ) : (
      <PrintListDialog
        settings={listSettings}
        onChange={onListChange}
        onPreview={onPreview}
        onClose={onClose}
        initialX={initialX}
        initialY={initialY}
      />
    );

  // 画像ファイル出力ダイアログの上に出す (ライブラリは新しい窓をアクティブな窓の後ろに置く)。
  return <div style={DIALOG_LIFT_STYLE}>{dialog}</div>;
}

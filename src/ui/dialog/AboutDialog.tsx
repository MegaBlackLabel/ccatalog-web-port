import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';
import type { ComiketInfo } from '../../domain/types';

export type AboutDialogProps = {
  /** 読み込んだカタログ情報。未読み込みは null。 */
  info: ComiketInfo | null;
  genreCount: number;
  circleCount: number;
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
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
  padding: 6,
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const APP_NAME_STYLE: CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
};

const CATALOG_NAME_STYLE: CSSProperties = { color: '#000080' };

const NOTE_STYLE: CSSProperties = {
  margin: '4px 0 0',
  color: '#404040',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 'auto',
  paddingTop: 6,
  flex: '0 0 auto',
};

export function AboutDialog({
  info,
  genreCount,
  circleCount,
  onClose,
  initialX = 400,
  initialY = 200,
  width = 360,
  height = 240,
  zIndex,
}: AboutDialogProps) {
  return (
    <Window
      data-testid="about-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="バージョン情報"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={APP_NAME_STYLE}>コミケットカタログブラウザ (Web 移植版)</div>
        <div data-testid="about-comiket-name" style={CATALOG_NAME_STYLE}>
          {info?.comiketName ?? '（カタログが読み込まれていません）'}
        </div>
        <div>コミックマーケット No. {info?.comiketNo ?? '-'}</div>
        <div>ジャンル数: {genreCount}</div>
        <div>サークル数: {circleCount}</div>
        <p style={NOTE_STYLE}>
          このアプリのカタログデータはダミーデータです。実際のコミックマーケットの頒布物・サークル情報ではありません。
        </p>
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-testid="about-ok" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Window>
  );
}

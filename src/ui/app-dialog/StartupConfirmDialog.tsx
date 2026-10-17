import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type StartupConfirmDialogProps = {
  /** 起動しようとしているカタログ名。例: 'コミックマーケット96（ダミー）' */
  catalogName: string;
  /** 「DVDROMカタログを起動する」。 */
  onLaunch: () => void;
  /** 「終了」。 */
  onExit: () => void;
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
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
};

const LAUNCH_STYLE: CSSProperties = { width: '100%', flex: '0 0 auto' };

const MESSAGE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
};

const CATALOG_NAME_STYLE: CSSProperties = { color: '#000080', fontWeight: 700 };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  marginTop: 'auto',
  paddingTop: 6,
  flex: '0 0 auto',
};

/** 起動確認ダイアログ (元ダイアログ 250)。 */
export function StartupConfirmDialog({
  catalogName,
  onLaunch,
  onExit,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: StartupConfirmDialogProps) {
  // タイトルバーの × は「終了」と同じ扱い。
  return (
    <Window
      data-testid="startup-confirm-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="起動確認"
      // Escape とタイトルバーの × は「終了」として扱う。
      onClose={onExit}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <Button
          variant="default"
          type="button"
          data-ctrl-id={1720}
          data-testid="startup-launch"
          style={LAUNCH_STYLE}
          onClick={onLaunch}
        >
          DVDROMカタログを起動する
        </Button>
        <div data-ctrl-id={1746} data-testid="startup-message" style={MESSAGE_STYLE}>
          <div data-testid="startup-catalog-name" style={CATALOG_NAME_STYLE}>
            {catalogName}
          </div>
          <div>DVDROM カタログを起動します。</div>
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button type="button" data-ctrl-id={1745} data-testid="startup-exit" onClick={onExit}>
            終了
          </Button>
        </div>
      </div>
    </Window>
  );
}

import { useState, type CSSProperties } from 'react';
import { Button, Tabs, Window } from '@megablacklabel/react98retro';
import type { CheckColorSettings } from '../../domain/app-settings';
import { CheckColorEditor } from './CheckColorEditor';

export type CheckColorDialogProps = {
  /** 色の設定 (表示色 / 印刷色 / 名称 / 編集するチェック色)。 */
  checkColors: CheckColorSettings;
  onChange: (patch: Partial<CheckColorSettings>) => void;
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
  gap: 8,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  fontSize: 12,
};

/** 実物と同じ 1 ページだけのプロパティシート (タブ名は「チェック色」)。 */
const TABS = [{ id: 'color', label: 'チェック色' }] as const;

/** タブの中身 (プロパティシートのページ)。 */
const PAGE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: '1 1 auto',
  minHeight: 0,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  padding: '0 6px 6px',
  flex: '0 0 auto',
};

/**
 * チェック色の編集 (元実装のダイアログ 149 「チェック色」)。
 * メニューの「チェックリスト > チェック色の編集」(61227) と、ツールバーの「色編集」から開く。
 *
 * 実物は 1 ページだけのプロパティシートで、タイトルが「チェック色の編集」、タブが
 * 「チェック色」、下部に OK / キャンセル / 適用(A) を並べる (「閉じる」ではない)。
 * 編集はその場では反映せず、OK / 適用(A) で確定し、キャンセルで捨てる。
 *
 * ウィンドウの寸法はダイアログ 149 の資源寸法 404 x 375 (ダイアログ単位) に、
 * 動作設定 (411 x 452 → 実測 439 x 670) と同じ比率を当てた 431 x 577。
 */
export function CheckColorDialog({
  checkColors,
  onChange,
  onClose,
  initialX = 300,
  initialY = 40,
  width = 431,
  height = 577,
  zIndex,
}: CheckColorDialogProps) {
  /** 編集中の表示値 (確定するまで親には出さない)。 */
  const [draft, setDraft] = useState(checkColors);
  /** まだ確定していない編集 (「適用」の有効 / 無効と、確定時に渡す patch)。 */
  const [pending, setPending] = useState<Partial<CheckColorSettings>>({});
  const dirty = Object.keys(pending).length > 0;

  const edit = (patch: Partial<CheckColorSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setPending((prev) => ({ ...prev, ...patch }));
  };

  return (
    <Window
      data-testid="check-color-dialog"
      title="チェック色の編集"
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
          tabs={TABS.map((item) => ({
            id: item.id,
            label: item.label,
            content: (
              <div style={PAGE_STYLE}>
                <CheckColorEditor checkColors={draft} onChange={edit} />
              </div>
            ),
          }))}
          activeTab="color"
          onTabChange={() => {}}
          fill
          style={{ flex: '1 1 auto', minHeight: 0 }}
          panelClassName="check-color-page"
        />
        <div style={BUTTON_ROW_STYLE} data-testid="check-color-actions">
          <Button
            variant="default"
            data-testid="check-color-ok"
            onClick={() => {
              onChange(pending);
              setPending({});
              onClose();
            }}
          >
            OK
          </Button>
          <Button data-testid="check-color-cancel" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            data-testid="check-color-apply"
            disabled={!dirty}
            onClick={() => {
              onChange(pending);
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

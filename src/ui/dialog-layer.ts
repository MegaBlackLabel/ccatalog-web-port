import type { CSSProperties } from 'react';

/**
 * ダイアログ類の重ね順。
 *
 * ライブラリのウィンドウ管理は「新しく開いた窓を、今アクティブな窓より 1 つ後ろに置く」
 * (`useWindowManager.register`)。そのため、
 *   1. メインウィンドウのメニューから開いたダイアログがメインウィンドウの後ろに隠れる
 *   2. ダイアログから開いたダイアログ (色パレット / 説明 / 詳細設定) が親のダイアログの後ろに隠れる
 * という状態になる (実測: ダイアログ z 10 / メインウィンドウ z 11)。
 *
 * position + z-index で作った重ね順の中では fixed の子もその中に描かれるので、
 * 「ダイアログ全体」と「その上に出すダイアログ」の 2 段の重ね順で前面に出す。
 */

/** ダイアログ類をまとめる重ね順 (メインウィンドウなどの上)。 */
export const DIALOG_LAYER_STYLE: CSSProperties = {
  position: 'relative',
  zIndex: 100,
};

/** ダイアログの上にさらに出すダイアログ (色パレット / 説明 / 詳細設定) の重ね順。 */
export const DIALOG_LIFT_STYLE: CSSProperties = {
  position: 'relative',
  zIndex: 200,
};

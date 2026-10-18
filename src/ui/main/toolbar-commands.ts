/**
 * ツールバーが送る WM_COMMAND のうち、MENU_COMMANDS (menu-defs.ts) に無いもの。
 * 元実装はツールバー ボタンもメニューと同じ ID 帯を使うが、ジャンプの ComboBox と
 * チェックの色パレットは ToolbarWindow32 の子コントロール (WM_COMMAND を持たない) なので、
 * Web 版だけがアプリ内コマンド ID を割り当てる。
 *
 * jumpOptions を渡さなかったときのジャンプの ID 帯は、元実装のページ移動メニュー実測
 * (34000 = 日付 / 34100 = ホール / 34200 = ブロック / 34400 = ジャンル) に合わせ、
 * メニューに対応の無いインデックスだけ 34300 帯を Web 版の割り当てにする
 * (ホールは circles から作れないので既定では選択肢なし = アプリが選択肢を渡す)。
 *
 * MainWindow (送信側) と App (処理側) が同じ値を使うため、ここが単一の定義。
 */
export const TOOLBAR_COMMANDS = {
  dayJumpBase: 34000,
  indexJumpBase: 34300,
  /** 「チェックリストに追加／色変更」= 33000 + 色番号 (1〜9)。 */
  checkColorBase: 33000,
  /**
   * 「標準色で追加」= 33040。チェックリスト メニューの先頭項目で、選択中のサークルを
   * 「標準のチェック色」(33100 + 色番号) で登録する (実機のメニュー ダンプの ID)。
   */
  checkAddStandardColor: 33040,
  checkRemove: 33020,
  /** 色編集。元実装はツールバー内のボタン (実測 ID 33041) で、Web 版はメニューと同じ 61227 で開く。 */
  colorEdit: 61227,
  antiAlias: 32792,
} as const;

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PRINT_CUT_SETTINGS, PrintCutPage } from './PrintCutDialog';
import type { PrintCutPageProps, PrintCutSettings } from './PrintCutDialog';
import { PRINTERS, PrintDialog } from './PrintDialog';
import type { PrintDialogProps } from './PrintDialog';
import { DEFAULT_PRINT_LIST_SETTINGS, PrintListPage } from './PrintListDialog';
import type { PrintListPageProps, PrintListSettings, PrintTarget } from './PrintListDialog';
import { DEFAULT_PRINT_MAP_SETTINGS, PrintMapPage } from './PrintMapDialog';
import type { PrintMapPageProps, PrintMapSettings } from './PrintMapDialog';

/** 印刷範囲のフィクスチャ。既定から外した値にして、変更時に他の項目が保たれるかを見る。 */
const TARGET: PrintTarget = { days: [2], halls: ['東1'], colors: [3] };

const LIST_SETTINGS: PrintListSettings = { ...DEFAULT_PRINT_LIST_SETTINGS, target: TARGET };

const CUT_SETTINGS: PrintCutSettings = { ...DEFAULT_PRINT_CUT_SETTINGS, target: TARGET };

const MAP_SETTINGS: PrintMapSettings = { ...DEFAULT_PRINT_MAP_SETTINGS, target: TARGET };

function renderList(overrides: Partial<PrintListPageProps> = {}) {
  const props: PrintListPageProps = {
    settings: LIST_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintListPage {...props} />);
  return { user, props, page: view.container };
}

/**
 * UI-SPEC.md ダイアログ 163 (サークルリスト印刷 / 660 x 442) の表にあるコントロール ID。
 * 4294967295 (グループボックス・ラベル) は ID を持たないため含めない。
 */
const LIST_CONTROL_IDS: readonly number[] = [
  1080, 1081, 1082, 1083, 1084,
  1090, 1091, 1092, 1093, 1094, 1095, 1096, 1097, 1098, 1099, 1100, 1101, 1102, 1103,
  1112, 1113, 1114, 1117, 1118,
  1120, 1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128,
  1130, 1131, 1132, 1133, 1134, 1135, 1136, 1137, 1138,
  1139, 1140, 1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150,
  1719,
];

/**
 * UI-SPEC.md ダイアログ 164 (サークルカット印刷 / 660 x 442) の表にあるコントロール ID。
 * 4294967295 (グループボックス・ラベル) は ID を持たないため含めない。
 */
const CUT_CONTROL_IDS: readonly number[] = [
  // 印刷範囲 > 日付
  1180, 1181, 1182, 1183, 1184,
  // 印刷範囲 > ホール (1190-1203 と まとめホール 1212-1218)
  1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199,
  1200, 1201, 1202, 1203, 1212, 1213, 1214, 1217, 1218,
  // 印刷範囲 > チェック色 (見本色 1220-1228 / チェック 1230-1238 / 色の編集 1250)
  1220, 1221, 1222, 1223, 1224, 1225, 1226, 1227, 1228,
  1230, 1231, 1232, 1233, 1234, 1235, 1236, 1237, 1238, 1250,
  // 印刷項目 (1244 のリストと 1721 / 1722)
  1244, 1721, 1722,
  // 改ページ (1239 のコンボと 1240-1243)
  1239, 1240, 1241, 1242, 1243,
  // レイアウト (1245 のコンボと 1246、1248 / 1251 / 1249 / 1717、1252 / 1253)
  1245, 1246, 1248, 1249, 1251, 1717, 1252, 1253,
  // プレビュー
  1247,
];

/**
 * UI-SPEC.md ダイアログ 165 (マップ印刷 / 660 x 442) の表にあるコントロール ID。
 * 4294967295 (グループボックス・ラベル) は ID を持たないため含めない。
 */
const MAP_CONTROL_IDS: readonly number[] = [
  // 印刷範囲 > 日付
  1280, 1281, 1282, 1283, 1284,
  // 印刷範囲 > ホール (1290-1303 と まとめホール 1312-1318)
  1290, 1291, 1292, 1293, 1294, 1295, 1296, 1297, 1298, 1299,
  1300, 1301, 1302, 1303, 1312, 1313, 1314, 1317, 1318,
  // 印刷範囲 > チェック色 (見本色 1320-1328 / チェック 1330-1338 / 色の編集 1350)
  1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328,
  1330, 1331, 1332, 1333, 1334, 1335, 1336, 1337, 1338, 1350,
  // 印刷項目 (1344 のリストと 1726 / 1727)
  1344, 1726, 1727,
  // 改ページ (1339 のコンボと 1340-1343)
  1339, 1340, 1341, 1342, 1343,
  // レイアウト (1345 のコンボと 1346 の見本枠、1348 / 1349 / 1352、濃度 1353-1355、
  // 略図マップ 1356 / 1357、地図詰めの方向 1358 / 1359)
  1345, 1346, 1348, 1349, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359,
  // 指示線 (1351 のコンボ、見本色 1360-1368、チェック 1370-1378)
  1351, 1360, 1361, 1362, 1363, 1364, 1365, 1366, 1367, 1368,
  1370, 1371, 1372, 1373, 1374, 1375, 1376, 1377, 1378,
  // プレビュー
  1347,
];

/**
 * UI-SPEC.md ダイアログ 166 (白地図印刷 / 660 x 442) の表にあるコントロール ID。
 * 1345 (レイアウトのコンボ) は 165 と同じ ID を共有する。
 */
const BLANK_MAP_CONTROL_IDS: readonly number[] = [
  // 印刷範囲 > 日付 / ホール
  1380, 1381, 1382, 1383, 1384,
  1390, 1391, 1392, 1393, 1394, 1395, 1396, 1397, 1398, 1399,
  1400, 1401, 1402, 1403, 1412, 1413, 1414, 1417, 1418,
  // レイアウト (1345 のコンボと 1446 の見本枠、ジャンル 1451、濃度 1452-1454、
  // 略図マップ 1456 / 1457、地図詰めの方向 1458 / 1459)
  1345, 1446, 1451, 1452, 1453, 1454, 1456, 1457, 1458, 1459,
  // プレビュー
  1447,
];

/** data-ctrl-id を数値で集める。 */
function controlIds(root: HTMLElement): number[] {
  return [...root.querySelectorAll('[data-ctrl-id]')].map((element) =>
    Number(element.getAttribute('data-ctrl-id')),
  );
}

/** data-ctrl-id の要素を取り出す (無ければテストを失敗させる)。 */
function control(root: HTMLElement, controlId: number): HTMLElement {
  const element = root.querySelector(`[data-ctrl-id="${controlId}"]`);
  if (element === null) throw new Error(`data-ctrl-id=${controlId} の要素がありません`);
  return element as HTMLElement;
}

function renderCut(overrides: Partial<PrintCutPageProps> = {}) {
  const props: PrintCutPageProps = {
    settings: CUT_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintCutPage {...props} />);
  return { user, props, page: view.container };
}

function renderMap(overrides: Partial<PrintMapPageProps> = {}) {
  const props: PrintMapPageProps = {
    settings: MAP_SETTINGS,
    onChange: vi.fn(),
    onPreview: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintMapPage {...props} />);
  return { user, props, page: view.container };
}

function renderPrint(overrides: Partial<PrintDialogProps> = {}) {
  const props: PrintDialogProps = {
    onPrint: vi.fn(),
    onPageSetup: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<PrintDialog {...props} />);
  return { user, props, dialog: view.getByTestId('print-dialog') };
}

describe('PrintListPage', () => {
  it('印刷範囲・印刷項目・改ページ・レイアウトの各コントロールを表示する', () => {
    const { page } = renderList();

    // 印刷範囲 (日付 / ホール / チェック色)。
    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(page).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(page).getByLabelText('東1')).toBeInTheDocument();
    expect(within(page).getByLabelText('西1')).toBeInTheDocument();
    expect(within(page).getByLabelText('南4')).toBeInTheDocument();
    // 元実装の 3 列目 (まとめホール)。
    expect(within(page).getByLabelText('東123')).toBeInTheDocument();
    expect(within(page).getByLabelText('東456')).toBeInTheDocument();
    expect(within(page).getByLabelText('西12')).toBeInTheDocument();
    expect(within(page).getByLabelText('南12')).toBeInTheDocument();
    expect(within(page).getByLabelText('南34')).toBeInTheDocument();
    expect(within(page).getByLabelText('色1')).toBeInTheDocument();
    expect(within(page).getByLabelText('色9')).toBeInTheDocument();
    // 印刷項目 (元実装の 163 に補足を拡大 / メモを拡大は無い)。
    expect(within(page).getByLabelText('サークル名')).toBeChecked();
    expect(within(page).queryByLabelText('補足を拡大')).toBeNull();
    expect(within(page).queryByLabelText('メモを拡大')).toBeNull();
    // 改ページとレイアウト。
    expect(within(page).getByText('印刷順 :')).toBeInTheDocument();
    expect(within(page).getByText('改ページ条件 :')).toBeInTheDocument();
    expect(within(page).getByRole('combobox', { name: 'レイアウト' })).toHaveValue('portrait');
    expect(within(page).getByLabelText('サークル通し番号の印刷')).not.toBeChecked();
    expect(within(page).getByLabelText('チェック色一覧の印刷')).not.toBeChecked();
    expect(within(page).getByLabelText('ブロックの全サークルを印刷')).not.toBeChecked();
  });

  it('色の編集ボタンは無効 (チェック色ダイアログが担当する)', () => {
    const { page } = renderList();

    expect(within(page).getByRole('button', { name: '色の編集...' })).toBeDisabled();
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('日付のチェックを外すと days から外す', async () => {
    const { user, props, page } = renderList({
      settings: { ...LIST_SETTINGS, target: { ...TARGET, days: [1, 2] } },
    });

    await user.click(within(page).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('ホールのチェックを入れると halls に足す', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('南4'));

    expect(props.onChange).toHaveBeenCalledWith({
      target: { ...TARGET, halls: ['東1', '南4'] },
    });
  });

  it('印刷項目のチェックを外すと items から外す', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('サークル名'));

    expect(props.onChange).toHaveBeenCalledWith({
      items: ['読み', '執筆者', '発行誌', '位置', '日付', 'ジャンル'],
    });
  });

  it('改ページ条件を選ぶと pageBreakBy を変える', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByRole('radio', { name: 'ブロック' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakBy: 'block' });
  });

  it('レイアウトのチェックを入れると printSequenceNumber を立てる', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('サークル通し番号の印刷'));

    expect(props.onChange).toHaveBeenCalledWith({ printSequenceNumber: true });
  });

  it('プレビューは onPreview を呼ぶ', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByTestId('print-list-preview'));

    expect(props.onPreview).toHaveBeenCalledTimes(1);
  });

  it('プレビュー ボタンは実物の 93x21 (UI-SPEC ダイアログ 163)', () => {
    const { page } = renderList();
    const preview = page.querySelector('[data-testid="print-list-preview"]') as HTMLElement;
    expect(preview.style.width).toBe('93px');
    expect(preview.style.height).toBe('21px');
  });

  it('仕様 (UI-SPEC.md ダイアログ 163) の全コントロール ID を data-ctrl-id として持つ', () => {
    const { page } = renderList();

    const ids = controlIds(page);

    expect(ids).toEqual(expect.arrayContaining([...LIST_CONTROL_IDS]));
    // 件数も見て、ID の欠落と重複 (同じ ID を 2 つの要素に付ける) の両方を検出する。
    expect(ids).toHaveLength(LIST_CONTROL_IDS.length);
  });

  it('グループは実物と同じ並び (印刷範囲 > 日付 > ホール > チェック色 > 右上 印刷項目 / 左下 改ページ > レイアウト)', () => {
    const { page } = renderList();

    const legends = [...page.querySelectorAll('fieldset > legend')].map(
      (legend) => legend.textContent,
    );

    expect(legends).toEqual([
      '印刷範囲',
      '日付',
      'ホール',
      'チェック色',
      '印刷項目',
      '改ページ',
      'レイアウト',
    ]);
  });

  it('グループの寸法は実物の実測どおり (印刷範囲 470x273 / 印刷項目 161x273 / 改ページ 131x213 / レイアウト 213 以上)', () => {
    const { page } = renderList();
    const groupOf = (legend: string) =>
      [...page.querySelectorAll('fieldset')].find(
        (field) => field.querySelector(':scope > legend')?.textContent === legend,
      ) as HTMLElement;

    for (const [legend, width, minHeight] of [
      ['印刷範囲', '470px', '273px'],
      ['印刷項目', '161px', '273px'],
      ['改ページ', '131px', '213px'],
      ['レイアウト', '', '213px'],
    ] as const) {
      const group = groupOf(legend);
      if (width !== '') expect(group.style.width).toBe(width);
      expect(group.style.minHeight).toBe(minHeight);
    }

    // 実物は「印刷項目」が右上 (1 段目)、「改ページ」が左下 (2 段目)。
    const breakGroup = groupOf('改ページ');
    const itemGroup = groupOf('印刷項目');
    expect(itemGroup.compareDocumentPosition(breakGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // チェックボックスの行間は 1 行 30px ピッチ (実物の実測)。
    const dayColumn = groupOf('日付').querySelector('div') as HTMLElement;
    expect(dayColumn.style.rowGap).toBe('11px');
  });

  it('印刷順は元実装と同じ 4 項目で、選ぶと pageBreakOrder を変える', async () => {
    const { user, props, page } = renderList();
    const order = within(page).getByRole('combobox', { name: '印刷順' });

    expect([...order.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'チェックリスト順',
      '配置順',
      'サークル名順',
      '色順',
    ]);
    expect(order).toHaveValue('checklist');

    await user.selectOptions(order, within(order).getByRole('option', { name: '配置順' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakOrder: 'space' });
  });

  it('レイアウトは元実装と同じ 5 タイプで、選ぶと layout を変える', async () => {
    const { user, props, page } = renderList();
    const layout = within(page).getByRole('combobox', { name: 'レイアウト' });

    expect(layout).toBe(control(page, 1145));
    expect([...layout.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      '縦向き',
      '縦向き (フォント大)',
      '横向き 1段組',
      '横向き 1段 (フォント大)',
      '横向き 2段組',
    ]);
    // 1146 はレイアウトの見本を描く枠。資源では空で、Web 版も空のまま出す。
    expect(control(page, 1146)).toBeEmptyDOMElement();
    expect(within(page).getByTestId('print-list-layout-frame')).toBeEmptyDOMElement();

    await user.selectOptions(
      layout,
      within(layout).getByRole('option', { name: '横向き 2段組' }),
    );

    expect(props.onChange).toHaveBeenCalledWith({ layout: 'landscape2' });
  });

  it('まとめホール (東123 など) のチェックを入れると halls に足す', async () => {
    const { user, props, page } = renderList();

    await user.click(within(page).getByLabelText('東123'));

    expect(props.onChange).toHaveBeenCalledWith({
      target: { ...TARGET, halls: ['東1', '東123'] },
    });
  });

  it('チェック色の見本色 (1120-1128) を元の色で表示する', () => {
    const { page } = renderList();

    expect(control(page, 1120)).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(control(page, 1121)).toHaveStyle({ backgroundColor: '#ff8000' });
    expect(control(page, 1122)).toHaveStyle({ backgroundColor: '#ffff00' });
    expect(control(page, 1123)).toHaveStyle({ backgroundColor: '#008000' });
    expect(control(page, 1124)).toHaveStyle({ backgroundColor: '#00ffff' });
    expect(control(page, 1125)).toHaveStyle({ backgroundColor: '#0000c0' });
    expect(control(page, 1126)).toHaveStyle({ backgroundColor: '#800080' });
    expect(control(page, 1127)).toHaveStyle({ backgroundColor: '#ff00ff' });
    expect(control(page, 1128)).toHaveStyle({ backgroundColor: '#808080' });
  });

  it('Window を出さず、閉じる ボタンも持たない (タブの中身だけを出す)', () => {
    const { page } = renderList();

    expect(screen.queryByTestId('print-list-dialog')).toBeNull();
    expect(within(page).queryByRole('button', { name: '閉じる' })).toBeNull();
    // 閉じるボタン (元リソース 163 の表には無く、Web 版がダイアログ側で出していた 2) は印刷詳細設定側が持つ。
    expect(page.querySelector('[data-ctrl-id="2"]')).toBeNull();
  });
});

describe('PrintCutPage', () => {
  it('印刷範囲・印刷項目・改ページ・レイアウトの各コントロールを表示する', () => {
    const { page } = renderCut();

    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(page).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(page).getByLabelText('東1')).toBeInTheDocument();
    expect(within(page).getByLabelText('南4')).toBeInTheDocument();
    expect(within(page).getByLabelText('東123')).toBeInTheDocument();
    expect(within(page).getByLabelText('色1')).toBeInTheDocument();
    expect(within(page).getByLabelText('枠の印刷')).toBeInTheDocument();
    expect(within(page).getByLabelText('サークル通し番号の印刷')).toBeInTheDocument();
    expect(within(page).getByLabelText('ブロックの全サークルを印刷')).toBeInTheDocument();
  });

  it('グループの寸法は実物の実測どおり (印刷範囲 470x273 / 印刷項目 161x273 / 改ページ 131x213 / レイアウト 213 以上)', () => {
    const { page } = renderCut();
    const groupOf = (legend: string) =>
      [...page.querySelectorAll('fieldset')].find(
        (field) => field.querySelector(':scope > legend')?.textContent === legend,
      ) as HTMLElement;

    for (const [legend, width, minHeight] of [
      ['印刷範囲', '470px', '273px'],
      ['印刷項目', '161px', '273px'],
      ['改ページ', '131px', '213px'],
      ['レイアウト', '', '213px'],
    ] as const) {
      const group = groupOf(legend);
      if (width !== '') expect(group.style.width).toBe(width);
      expect(group.style.minHeight).toBe(minHeight);
    }

    // 実物は「印刷項目」が 1 段目右、「改ページ」が 2 段目左。
    expect(
      groupOf('印刷項目').compareDocumentPosition(groupOf('改ページ')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // チェックボックスの行間は 1 行 30px ピッチ (実物の実測)。
    expect((groupOf('日付').querySelector('div') as HTMLElement).style.rowGap).toBe('11px');
  });

  it('グループは 印刷範囲 > 日付 > ホール > チェック色、印刷項目、改ページ、レイアウト の順に並ぶ', () => {
    const { page } = renderCut();

    const legends = [...page.querySelectorAll('fieldset > legend')].map(
      (legend) => legend.textContent,
    );

    expect(legends).toEqual([
      '印刷範囲',
      '日付',
      'ホール',
      'チェック色',
      '印刷項目',
      '改ページ',
      'レイアウト',
    ]);
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, page } = renderCut();

    await user.click(within(page).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, page } = renderCut();

    await user.click(within(page).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('まとめホール (東123 など) のチェックを入れると halls に足す', async () => {
    const { user, props, page } = renderCut();

    await user.click(within(page).getByLabelText('東123'));

    expect(props.onChange).toHaveBeenCalledWith({
      target: { ...TARGET, halls: ['東1', '東123'] },
    });
  });

  it('チェック色の見本色 (1220-1228) を元の色で表示する', () => {
    const { page } = renderCut();

    expect(control(page, 1220)).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(control(page, 1221)).toHaveStyle({ backgroundColor: '#ff8000' });
    expect(control(page, 1222)).toHaveStyle({ backgroundColor: '#ffff00' });
    expect(control(page, 1223)).toHaveStyle({ backgroundColor: '#008000' });
    expect(control(page, 1224)).toHaveStyle({ backgroundColor: '#00ffff' });
    expect(control(page, 1225)).toHaveStyle({ backgroundColor: '#0000c0' });
    expect(control(page, 1226)).toHaveStyle({ backgroundColor: '#800080' });
    expect(control(page, 1227)).toHaveStyle({ backgroundColor: '#ff00ff' });
    expect(control(page, 1228)).toHaveStyle({ backgroundColor: '#808080' });
  });

  it('印刷順は元実装と同じ 4 項目で、選ぶと pageBreakOrder を変える', async () => {
    const { user, props, page } = renderCut();
    const order = within(page).getByRole('combobox', { name: '印刷順' });

    expect([...order.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'チェックリスト順',
      '配置順',
      'サークル名順',
      '色順',
    ]);
    expect(order).toHaveValue('checklist');

    await user.selectOptions(order, within(order).getByRole('option', { name: '配置順' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakOrder: 'space' });
  });

  it('改ページ条件を選ぶと pageBreakBy を変える', async () => {
    const { user, props, page } = renderCut();

    await user.click(within(page).getByRole('radio', { name: 'ブロック' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakBy: 'block' });
  });

  it('枠の印刷のチェックを外すと printFrame を落とす', async () => {
    const { user, props, page } = renderCut();

    expect(within(page).getByLabelText('枠の印刷')).toBeChecked();

    await user.click(within(page).getByLabelText('枠の印刷'));

    expect(props.onChange).toHaveBeenCalledWith({ printFrame: false });
  });

  it('レイアウトは元実装と同じ 8 種類で、選ぶと layout を変える', async () => {
    const { user, props, page } = renderCut();
    const layout = within(page).getByRole('combobox', { name: 'レイアウト' });

    expect([...layout.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      '横向き 4 x 4',
      '横向き 5 x 5',
      '横向き 6 x 6',
      '横向き 7 x 7',
      '縦向き 2 x 5',
      '縦向き 3 x 7',
      '縦向き 4 x 9',
      '縦向き 5 x 1',
    ]);

    await user.selectOptions(layout, within(layout).getByRole('option', { name: '縦向き 3 x 7' }));

    expect(props.onChange).toHaveBeenCalledWith({ layout: 'portrait3x7' });
  });

  it('レイアウトの見本枠 (1246) を空の枠として持つ', () => {
    const { page } = renderCut();

    const frame = within(page).getByTestId('print-cut-layout-frame');

    expect(frame).toHaveAttribute('data-ctrl-id', '1246');
    // 元実装はここにレイアウトの見本を実行時描画するため、資源 (ダイアログ 164) では空。
    expect(frame).toBeEmptyDOMElement();
  });

  it('カット詰め方向は横詰めが既定で、縦詰めを選ぶと cutPacking を変える', async () => {
    const { user, props, page } = renderCut();

    expect(within(page).getByLabelText('横詰め')).toBeChecked();
    expect(within(page).getByLabelText('縦詰め')).not.toBeChecked();

    await user.click(within(page).getByLabelText('縦詰め'));

    expect(props.onChange).toHaveBeenCalledWith({ cutPacking: 'vertical' });
  });

  it('仕様 (UI-SPEC.md ダイアログ 164) の全コントロール ID を data-ctrl-id として持つ', () => {
    const { page } = renderCut();

    const ids = controlIds(page);

    // 仕様の ID がすべて出ていること。
    expect(ids).toEqual(expect.arrayContaining([...CUT_CONTROL_IDS]));
    // 仕様外の ID や同じ ID の重複が無いこと (件数で見る)。
    expect(ids).toHaveLength(CUT_CONTROL_IDS.length);
  });

  it('プレビューは onPreview を呼ぶ', async () => {
    const { user, props, page } = renderCut();

    await user.click(within(page).getByTestId('print-cut-preview'));

    expect(props.onPreview).toHaveBeenCalledTimes(1);
  });

  it('プレビュー ボタンは実物の 93x21 (UI-SPEC ダイアログ 164)', () => {
    const { page } = renderCut();
    const preview = page.querySelector('[data-testid="print-cut-preview"]') as HTMLElement;
    expect(preview.style.width).toBe('93px');
    expect(preview.style.height).toBe('21px');
  });

  it('Window を出さず、閉じる ボタンも持たない (タブの中身だけを出す)', () => {
    const { page } = renderCut();

    expect(screen.queryByTestId('print-cut-dialog')).toBeNull();
    expect(within(page).queryByRole('button', { name: '閉じる' })).toBeNull();
    // 閉じるボタン (元リソース 164 の表には無く、Web 版がダイアログ側で出していた 2) は印刷詳細設定側が持つ。
    expect(page.querySelector('[data-ctrl-id="2"]')).toBeNull();
  });
});

describe('PrintMapPage', () => {
  it('マップ印刷の各コントロールを表示する', () => {
    const { page } = renderMap();

    for (const label of ['1日目', '2日目', '3日目', '4日目', '抽選漏れ']) {
      expect(within(page).getByLabelText(label)).toBeInTheDocument();
    }
    expect(within(page).getByLabelText('東1')).toBeInTheDocument();
    expect(within(page).getByLabelText('南4')).toBeInTheDocument();
    expect(within(page).getByLabelText('東123')).toBeInTheDocument();
    expect(within(page).getByLabelText('サークル通し番号の印刷')).toBeInTheDocument();
    expect(within(page).getByLabelText('ジャンルを重ねて印刷')).not.toBeChecked();
    expect(within(page).getByLabelText('略図マップの印刷')).not.toBeChecked();
    expect(within(page).getByTestId('print-map-density')).toHaveValue('50');
    expect(within(page).getByRole('button', { name: 'プレビュー' })).toBeInTheDocument();
    // チェック色と指示線の色は 2 か所に並ぶ (165 のチェック色 1330-1338 と指示線 1370-1378)。
    expect(within(page).getAllByLabelText('色1')).toHaveLength(2);
  });

  it('グループの寸法は実物の実測どおり (印刷範囲 470x273 / 印刷項目 161x273 / 改ページ 131x213 / レイアウト 213 以上)', () => {
    const { page } = renderMap();
    const groupOf = (legend: string) =>
      [...page.querySelectorAll('fieldset')].find(
        (field) => field.querySelector(':scope > legend')?.textContent === legend,
      ) as HTMLElement;

    for (const [legend, width, minHeight] of [
      ['印刷範囲', '470px', '273px'],
      ['印刷項目', '161px', '273px'],
      ['改ページ', '131px', '213px'],
      ['レイアウト', '', '213px'],
    ] as const) {
      const group = groupOf(legend);
      if (width !== '') expect(group.style.width).toBe(width);
      expect(group.style.minHeight).toBe(minHeight);
    }

    // 実物は「印刷項目」が 1 段目右、「改ページ」が 2 段目左。レイアウトは残り幅を取る
    // (flex-basis 0 にしないと、内容の幅で 3 段目へ折り返す)。
    expect(
      groupOf('印刷項目').compareDocumentPosition(groupOf('改ページ')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // flex-basis 0 にしないと、内容の幅で 3 段目へ折り返す (GroupBox が style を
    // そのまま属性へ出すので、属性文字列で確認する)。
    expect(groupOf('レイアウト').getAttribute('style') ?? '').toContain('flex: 1 1 0px');
    expect((groupOf('日付').querySelector('div') as HTMLElement).style.rowGap).toBe('11px');
  });

  it('白地図印刷 (166) は 2 列: 左に印刷範囲 + 注記、右にレイアウトのコンボ以下', () => {
    const { page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    const range = [...page.querySelectorAll('fieldset')].find(
      (field) => field.querySelector(':scope > legend')?.textContent === '印刷範囲',
    ) as HTMLElement;
    const note = page.querySelector('[data-testid="print-map-blank-note"]') as HTMLElement;
    const combo = page.querySelector('[data-testid="print-map-layout"]') as HTMLElement;

    // 166 はチェック色が無いので、印刷範囲は内容幅 (実測 315)。固定幅は付けない。
    expect(range.style.width).toBe('');
    expect(range.style.minHeight).toBe('273px');
    // 注記は印刷範囲と同じ列 (印刷範囲の下) にあり、レイアウトのコンボは別の列。
    expect(note.parentElement).toBe(range.parentElement);
    expect(combo.closest('fieldset')).toBeNull();
    // 見本枠は元リソースの実測 147x117。
    const frame = page.querySelector('[data-testid="print-map-layout-frame"]') as HTMLElement;
    expect([frame.style.width, frame.style.height]).toEqual(['147px', '117px']);

    // 「ジャンルを重ねて印刷」と「濃度」は 1 行に同居する (実物の実測 y=196 が同じ行)。
    const genre = page.querySelector('[data-ctrl-id="1451"]') as HTMLElement;
    const density = page.querySelector('[data-testid="print-map-density"]') as HTMLElement;
    const genreRow = density.parentElement?.parentElement;
    expect(genreRow?.contains(genre)).toBe(true);
    expect(genreRow?.style.flexWrap).toBe('nowrap');
    // 「略図を地図表示に合わせて回転」は 1 段インデント (実測 +18px)。
    const rotate = page.querySelector('[data-ctrl-id="1457"]') as HTMLElement;
    expect(rotate.style.marginLeft).toBe('18px');
    // プレビュー ボタンは実物の 93x21 (UI-SPEC ダイアログ 165) で、本文の下端に置く。
    const preview = page.querySelector('[data-testid="print-map-preview"]') as HTMLElement;
    expect(preview.style.width).toBe('93px');
    expect(preview.style.height).toBe('21px');
    expect((preview.parentElement as HTMLElement).style.marginTop).toBe('auto');
    expect((preview.closest('div[style*="min-height"]') as HTMLElement)?.style.minHeight ?? '100%').toBe('100%');
  });

  it('仕様 (UI-SPEC.md ダイアログ 165) の全コントロール ID を data-ctrl-id として持つ', () => {
    const { page } = renderMap();

    const ids = controlIds(page);

    expect(ids).toEqual(expect.arrayContaining([...MAP_CONTROL_IDS]));
    // 件数も見て、ID の欠落と重複 (同じ ID を 2 つの要素に付ける) の両方を検出する。
    expect(ids).toHaveLength(MAP_CONTROL_IDS.length);
  });

  it('グループは 印刷範囲 > 日付 > ホール > チェック色、印刷項目、改ページ、レイアウト > 指示線 の順に並ぶ', () => {
    const { page } = renderMap();

    const legends = [...page.querySelectorAll('fieldset > legend')].map(
      (legend) => legend.textContent,
    );

    expect(legends).toEqual([
      '印刷範囲',
      '日付',
      'ホール',
      'チェック色',
      '印刷項目',
      '改ページ',
      'レイアウト',
      '指示線',
    ]);
  });

  it('日付のチェックを入れると、他の日付を保ったまま days に足す', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('1日目'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });
  });

  it('抽選漏れは 0 として days に入れる', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('抽選漏れ'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 0] } });
  });

  it('まとめホール (東123 など) のチェックを入れると halls に足す', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('東123'));

    expect(props.onChange).toHaveBeenCalledWith({
      target: { ...TARGET, halls: ['東1', '東123'] },
    });
  });

  it('チェック色のチェックを外すと colors から外す', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByTestId('print-map-color-3'));

    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, colors: [] } });
  });

  it('チェック色の見本色 (1320-1328) を元の色で表示する', () => {
    const { page } = renderMap();

    expect(control(page, 1320)).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(control(page, 1321)).toHaveStyle({ backgroundColor: '#ff8000' });
    expect(control(page, 1322)).toHaveStyle({ backgroundColor: '#ffff00' });
    expect(control(page, 1323)).toHaveStyle({ backgroundColor: '#008000' });
    expect(control(page, 1324)).toHaveStyle({ backgroundColor: '#00ffff' });
    expect(control(page, 1325)).toHaveStyle({ backgroundColor: '#0000c0' });
    expect(control(page, 1326)).toHaveStyle({ backgroundColor: '#800080' });
    expect(control(page, 1327)).toHaveStyle({ backgroundColor: '#ff00ff' });
    expect(control(page, 1328)).toHaveStyle({ backgroundColor: '#808080' });
  });

  it('印刷項目のチェックを外すと items から外す', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('サークル名'));

    expect(props.onChange).toHaveBeenCalledWith({
      items: ['読み', '執筆者', '発行誌', '位置', '日付', 'ジャンル'],
    });
  });

  it('補足を拡大 / メモを拡大で enlargeDescription と enlargeMemo を立てる', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('補足を拡大'));
    expect(props.onChange).toHaveBeenCalledWith({ enlargeDescription: true });

    await user.click(within(page).getByLabelText('メモを拡大'));
    expect(props.onChange).toHaveBeenLastCalledWith({ enlargeMemo: true });
  });

  it('印刷順は元実装と同じ 5 項目で、選ぶと pageBreakOrder を変える', async () => {
    const { user, props, page } = renderMap();
    const order = within(page).getByRole('combobox', { name: '印刷順' });

    expect(order).toBe(control(page, 1339));
    expect([...order.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'チェックリスト順',
      '配置順',
      'サークル名順',
      '色順',
      '配置座標順',
    ]);
    expect(order).toHaveValue('checklist');

    await user.selectOptions(order, within(order).getByRole('option', { name: '配置座標順' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakOrder: 'coordinate' });
  });

  it('改ページ条件を選ぶと pageBreakBy を変える', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByRole('radio', { name: 'ブロック' }));

    expect(props.onChange).toHaveBeenCalledWith({ pageBreakBy: 'block' });
  });

  it('レイアウトは元実装と同じ 10 タイプで、選ぶと layout を変える', async () => {
    const { user, props, page } = renderMap();
    const layout = within(page).getByRole('combobox', { name: 'レイアウト' });

    expect(layout).toBe(control(page, 1345));
    expect([...layout.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      '横向き地図＋チェック色',
      '横向き地図＋リスト',
      '横向き地図＋カット小',
      '横向き地図＋カット中',
      '横向き地図＋カット大',
      '縦向き地図＋チェック色',
      '縦向き地図＋リスト',
      '縦向き地図＋カット小',
      '縦向き地図＋カット中',
      '縦向き地図＋カット大',
    ]);
    expect(layout).toHaveValue('landscapeColor');
    // 1346 はレイアウトの見本を描く枠。資源では空で、Web 版も空のまま出す。
    expect(control(page, 1346)).toBeEmptyDOMElement();
    expect(within(page).getByTestId('print-map-layout-frame')).toBeEmptyDOMElement();

    await user.selectOptions(
      layout,
      within(layout).getByRole('option', { name: '縦向き地図＋カット大' }),
    );

    expect(props.onChange).toHaveBeenCalledWith({ layout: 'portraitCutLarge' });
  });

  it('サークル通し番号 / チェック色一覧のチェックを立てる', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('サークル通し番号の印刷'));
    expect(props.onChange).toHaveBeenCalledWith({ printSequenceNumber: true });

    await user.click(within(page).getByLabelText('チェック色一覧の印刷'));
    expect(props.onChange).toHaveBeenLastCalledWith({ printColorLegend: true });
  });

  it('ジャンルを重ねて印刷のチェックを入れると overlayGenre を立てる', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('ジャンルを重ねて印刷'));

    expect(props.onChange).toHaveBeenCalledWith({ overlayGenre: true });
  });

  it('濃度を変えると overlayDensity を更新する', async () => {
    const { user, props, page } = renderMap();

    const input = within(page).getByTestId('print-map-density');
    await user.clear(input);
    await user.type(input, '30');

    expect(props.onChange).toHaveBeenLastCalledWith({ overlayDensity: 30 });
  });

  it('略図マップの印刷 / 略図を地図表示に合わせて回転のチェックを立てる', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByLabelText('略図マップの印刷'));
    expect(props.onChange).toHaveBeenCalledWith({ printSketchMap: true });

    await user.click(within(page).getByLabelText('略図を地図表示に合わせて回転'));
    expect(props.onChange).toHaveBeenLastCalledWith({ rotateSketchMap: true });
  });

  it('地図詰めの方向は元実装と同じ 5 項目で、選ぶと mapPacking を変える', async () => {
    const { user, props, page } = renderMap();
    const packing = within(page).getByRole('combobox', { name: '地図詰めの方向' });

    expect(packing).toBe(control(page, 1359));
    expect([...packing.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      '左下',
      '右下',
      '中央',
      '左上',
      '右上',
    ]);
    expect(packing).toHaveValue('leftBottom');

    await user.selectOptions(packing, within(packing).getByRole('option', { name: '中央' }));

    expect(props.onChange).toHaveBeenCalledWith({ mapPacking: 'center' });
  });

  it('指示線の太さは元実装と同じ 4 項目で、選ぶと indicatorWidth を変える', async () => {
    const { user, props, page } = renderMap();
    const width = within(page).getByRole('combobox', { name: '指示線の太さ' });

    expect(width).toBe(control(page, 1351));
    expect([...width.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'なし',
      '細',
      '中',
      '太',
    ]);
    expect(width).toHaveValue('none');

    await user.selectOptions(width, within(width).getByRole('option', { name: '太' }));

    expect(props.onChange).toHaveBeenCalledWith({ indicatorWidth: 'thick' });
  });

  it('指示線の色のチェックを外すと indicatorColors から外す', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByTestId('print-map-indicator-3'));

    expect(props.onChange).toHaveBeenCalledWith({ indicatorColors: [1, 2, 4, 5, 6, 7, 8, 9] });
  });

  it('指示線の見本色 (1360-1368) を元の色で表示する', () => {
    const { page } = renderMap();

    expect(control(page, 1360)).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(control(page, 1361)).toHaveStyle({ backgroundColor: '#ff8000' });
    expect(control(page, 1362)).toHaveStyle({ backgroundColor: '#ffff00' });
    expect(control(page, 1363)).toHaveStyle({ backgroundColor: '#008000' });
    expect(control(page, 1364)).toHaveStyle({ backgroundColor: '#00ffff' });
    expect(control(page, 1365)).toHaveStyle({ backgroundColor: '#0000c0' });
    expect(control(page, 1366)).toHaveStyle({ backgroundColor: '#800080' });
    expect(control(page, 1367)).toHaveStyle({ backgroundColor: '#ff00ff' });
    expect(control(page, 1368)).toHaveStyle({ backgroundColor: '#808080' });
  });

  it('プレビューは onPreview を呼ぶ', async () => {
    const { user, props, page } = renderMap();

    await user.click(within(page).getByTestId('print-map-preview'));

    expect(within(page).getByTestId('print-map-preview')).toBe(control(page, 1347));
    expect(props.onPreview).toHaveBeenCalledTimes(1);
  });

  it('blank のときは白地図の注記を出す', () => {
    const { page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    expect(within(page).getByTestId('print-map-blank-note')).toBeInTheDocument();
  });

  it('blank でないときは白地図の注記を出さない', () => {
    const { page } = renderMap();

    expect(within(page).queryByTestId('print-map-blank-note')).not.toBeInTheDocument();
  });

  it('blank のときは 166 の全コントロール ID を出し、165 固有の行を出さない', () => {
    const { page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    const ids = controlIds(page);

    expect(ids).toEqual(expect.arrayContaining([...BLANK_MAP_CONTROL_IDS]));
    expect(ids).toHaveLength(BLANK_MAP_CONTROL_IDS.length);
    // 165 固有: チェック色 (1330) / 印刷項目 (1344) / 改ページ (1340) / 指示線 (1351, 1370)。
    expect(ids).not.toContain(1330);
    expect(ids).not.toContain(1344);
    expect(ids).not.toContain(1340);
    expect(ids).not.toContain(1351);
    expect(ids).not.toContain(1370);
  });

  it('blank のときのグループは 印刷範囲 > 日付 > ホール だけになる (166 にレイアウトの枠は無い)', () => {
    const { page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    const legends = [...page.querySelectorAll('fieldset > legend')].map(
      (legend) => legend.textContent,
    );

    expect(legends).toEqual(['印刷範囲', '日付', 'ホール']);
    // 1446 は 165 の 1346 と同じレイアウトの見本枠。
    expect(control(page, 1446)).toBeEmptyDOMElement();
    expect(within(page).getByTestId('print-map-layout-frame')).toBeEmptyDOMElement();
  });

  it('blank のときのプレビューは 1447', async () => {
    const { user, props, page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    const preview = within(page).getByTestId('print-map-preview');
    expect(preview).toBe(control(page, 1447));

    await user.click(preview);

    expect(props.onPreview).toHaveBeenCalledTimes(1);
  });

  it('blank のときも日付とホール、レイアウト系の設定を変えられる', async () => {
    const { user, props, page } = renderMap({ settings: { ...MAP_SETTINGS, blank: true } });

    await user.click(within(page).getByLabelText('1日目'));
    expect(props.onChange).toHaveBeenCalledWith({ target: { ...TARGET, days: [2, 1] } });

    await user.click(within(page).getByLabelText('東123'));
    expect(props.onChange).toHaveBeenLastCalledWith({
      target: { ...TARGET, halls: ['東1', '東123'] },
    });

    await user.click(within(page).getByLabelText('略図を地図表示に合わせて回転'));
    expect(props.onChange).toHaveBeenLastCalledWith({ rotateSketchMap: true });
  });

  it('Window を出さず、閉じる ボタンも持たない (タブの中身だけを出す)', () => {
    const { page } = renderMap();

    expect(screen.queryByTestId('print-map-dialog')).toBeNull();
    expect(within(page).queryByRole('button', { name: '閉じる' })).toBeNull();
    // 閉じるボタン (元リソース 165 / 166 の表には無く、Web 版がダイアログ側で出していた 2) は印刷詳細設定側が持つ。
    expect(page.querySelector('[data-ctrl-id="2"]')).toBeNull();
  });
});

describe('PrintDialog', () => {
  /** ダイアログ 1538 のグループ (legend で引く)。 */
  const groupOf = (dialog: HTMLElement, legend: string) =>
    [...dialog.querySelectorAll('fieldset')].find(
      (field) => field.querySelector(':scope > legend')?.textContent === legend,
    ) as HTMLElement;

  it('タイトルとダミーのプリンタ一覧、プリンタのプロパティを表示する', () => {
    const { dialog } = renderPrint();

    expect(screen.getByText('印刷')).toBeInTheDocument();
    expect(PRINTERS).toHaveLength(3);
    expect(within(within(dialog).getByTestId('print-printer')).getAllByRole('option')).toHaveLength(
      3,
    );
    expect(within(dialog).getByTestId('print-printer')).toHaveValue(PRINTERS[0]);
    // 状態 / 種類 / 場所 / コメント (1095〜1101) はプリンタごとのダミー。
    expect(within(dialog).getByTestId('print-printer-status')).toHaveTextContent('準備完了');
    expect(within(dialog).getByTestId('print-printer-kind')).toHaveTextContent(
      'Microsoft Print To PDF',
    );
    expect(within(dialog).getByTestId('print-printer-where')).toHaveTextContent('PORTPROMPT:');
    expect(within(dialog).getByTestId('print-printer-comment')).toBeEmptyDOMElement();
    // 用紙サイズ (元リソースの 1641) は A4 を表示するコンボ。
    expect(within(dialog).getByTestId('print-paper-size')).toHaveValue('A4');
    // 実物は文書名を出さない。
    expect(within(dialog).queryByTestId('print-document-name')).toBeNull();
  });

  it('グループは実物の実測どおりの寸法で並ぶ (プリンタ 476x128 / 印刷範囲 252x96 / 印刷部数 210x96 / 印刷形式 476x90 / Tips 476x56)', () => {
    const { dialog } = renderPrint();

    for (const [legend, width, height] of [
      ['プリンタ', '476px', '128px'],
      ['印刷範囲', '252px', '96px'],
      ['印刷部数', '210px', '96px'],
      ['印刷形式', '476px', '90px'],
      ['Tips', '476px', '56px'],
    ] as const) {
      const group = groupOf(dialog, legend);
      expect(group.style.width).toBe(width);
      expect(group.style.height).toBe(height);
    }

    // 印刷範囲 (1072) と印刷部数 (1073) は 1 段に並ぶ。
    expect(
      groupOf(dialog, '印刷範囲').compareDocumentPosition(groupOf(dialog, '印刷部数')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('説明文エリアは高さを固定する (形式を変えても縮まない)', async () => {
    const { user, dialog } = renderPrint();
    const description = within(dialog).getByTestId('print-format-description');

    // いちばん長い文言 (2 行) が入る高さで固定する。
    expect(description.style.height).toBe('32px');

    for (const name of ['白地図印刷(W)', 'サークルカット印刷(U)', 'マップ印刷(M)']) {
      await user.click(within(dialog).getByRole('radio', { name }));
      expect(within(dialog).getByTestId('print-format-description').style.height).toBe('32px');
    }
  });

  it('本文はスクロールさせず、リサイズ ハンドルとサイズ グリップを出さない', () => {
    const { dialog } = renderPrint();
    const body = dialog.querySelector('.window-body') as HTMLElement;
    const content = body.firstElementChild as HTMLElement;

    // はみ出さない前提にして、スクロールバーを出さない (元実装の本文は 436px で収まる)。
    expect(content.style.overflow).toBe('hidden');
    expect(body.style.overflow).toBe('hidden');
    // 右下のサイズ グリップは statusBar を渡さないので描かれない。
    expect(dialog.querySelector('[class*="sizeGrip"]')).toBeNull();
    expect(dialog.querySelector('.status-bar')).toBeNull();
    // リサイズ ハンドルは resizable={false} で描かれない (実物もサイズ変更不可)。
    expect(dialog.querySelector('[class*="resizeHandle"]')).toBeNull();
  });

  // 実物のダイアログはタイトルバーに × だけを出し、端のドラッグでもサイズを変えられない
  // (Window の minimizable / maximizable / resizable)。
  it('タイトルバーのボタンは × だけで、リサイズ ハンドルを持たない', () => {
    const { dialog } = renderPrint();

    const labels = Array.from(dialog.querySelectorAll('.title-bar-controls button')).map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Close']);
    expect(dialog.querySelectorAll('[class*="resize"]')).toHaveLength(0);
  });

  it('印刷形式は 4 つのラジオで、実物のラベルを出す (アイコンは付けない)', () => {
    const { dialog } = renderPrint();

    for (const [name, controlId] of [
      ['サークルリストID(K)', 1046],
      ['サークルカット印刷(U)', 1048],
      ['マップ印刷(M)', 1049],
      ['白地図印刷(W)', 1053],
    ] as const) {
      const radio = within(dialog).getByRole('radio', { name });
      expect(dialog.querySelector(`[data-ctrl-id="${controlId}"]`)).toBe(radio);
      // 実物のラジオにアイコンは無い。
      expect(radio.parentElement?.querySelector('label img')).toBeNull();
    }

    expect(within(dialog).getByRole('radio', { name: 'サークルリストID(K)' })).toBeChecked();
    // 説明文は実物のスタティック 1050 と同じ凹んだ枠 (SS_SUNKEN) に入る。
    const description = within(dialog).getByTestId('print-format-description');
    expect(description.className).toContain('sunken-panel');
    expect(description).toHaveTextContent(
      'チェックリストに登録されているサークルを、画像なしの一覧表形式で印刷します。',
    );
  });

  it('印刷形式を選び直すと説明文が入れ替わる', async () => {
    const { user, dialog } = renderPrint();

    for (const [name, text] of [
      ['サークルリストID(K)', 'チェックリストに登録されているサークルを、画像なしの一覧表形式で印刷します。'],
      ['サークルカット印刷(U)', 'チェックリストに登録されているサークルを、サークルカット画像付きで印刷します。'],
      ['マップ印刷(M)', '会場マップを、チェックリストに登録されているサークルの配置情報と共に印刷します。'],
      ['白地図印刷(W)', '会場マップのみを印刷します。'],
    ] as const) {
      await user.click(within(dialog).getByRole('radio', { name }));
      expect(within(dialog).getByTestId('print-format-description')).toHaveTextContent(text);
      expect(within(dialog).getByRole('radio', { name })).toBeChecked();
    }
  });

  it('印刷部数の絵は右下ではなく左下に置く (スタティック 1086)', () => {
    const { dialog } = renderPrint();
    const icon = within(dialog).getByTestId('print-copies-icon');
    const copies = within(dialog).getByTestId('print-copies');
    const collate = within(dialog).getByTestId('print-collate');

    expect(icon).toHaveAttribute('data-ctrl-id', '1086');
    expect(icon).toHaveAttribute('width', '40');
    expect(icon).toHaveAttribute('height', '34');
    expect(icon.getAttribute('src')).toContain('data:image/svg+xml');
    // 部数 / 部単位の行より後ろ (下) に置く。
    expect(copies.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(collate.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('印刷範囲は 2 つの数値入力と有効範囲を出し、ページ指定を選べる', async () => {
    const { user, dialog } = renderPrint({ maxPage: 42 });

    expect(within(dialog).getByText('(有効範囲 : 1-42)')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: 'すべて(A)' })).toBeChecked();
    expect(within(dialog).getByTestId('print-page-from')).toHaveValue('1');
    expect(within(dialog).getByTestId('print-page-to')).toHaveValue('1');

    await user.click(within(dialog).getByRole('radio', { name: 'ページ指定(G) :' }));
    await user.clear(within(dialog).getByTestId('print-page-from'));
    await user.type(within(dialog).getByTestId('print-page-from'), '5');

    expect(within(dialog).getByRole('radio', { name: 'ページ指定(G) :' })).toBeChecked();
    expect(within(dialog).getByTestId('print-page-from')).toHaveValue('5');
  });

  it('部数は上下スピン相当で 1 ずつ増減する (1 未満にならない)', async () => {
    const { user, dialog } = renderPrint();

    expect(within(dialog).getByTestId('print-copies')).toHaveValue('1');

    await user.click(within(dialog).getByTestId('print-copies-up'));
    expect(within(dialog).getByTestId('print-copies')).toHaveValue('2');

    await user.click(within(dialog).getByTestId('print-copies-down'));
    await user.click(within(dialog).getByTestId('print-copies-down'));
    expect(within(dialog).getByTestId('print-copies')).toHaveValue('1');
  });

  it('OK は選んだ設定 (プリンタ / 形式 / 範囲 / 部数 / 部単位 / GDI+) をまとめて渡す', async () => {
    const { user, props, dialog } = renderPrint();

    await user.selectOptions(within(dialog).getByTestId('print-printer'), PRINTERS[1]);
    await user.click(within(dialog).getByRole('radio', { name: 'サークルカット印刷(U)' }));
    await user.click(within(dialog).getByRole('radio', { name: 'ページ指定(G) :' }));
    await user.clear(within(dialog).getByTestId('print-page-from'));
    await user.type(within(dialog).getByTestId('print-page-from'), '3');
    await user.clear(within(dialog).getByTestId('print-page-to'));
    await user.type(within(dialog).getByTestId('print-page-to'), '9');
    await user.clear(within(dialog).getByTestId('print-copies'));
    await user.type(within(dialog).getByTestId('print-copies'), '4');
    await user.click(within(dialog).getByTestId('print-collate'));
    await user.click(within(dialog).getByTestId('print-no-gdiplus'));
    await user.click(within(dialog).getByTestId('print-submit'));

    expect(props.onPrint).toHaveBeenCalledTimes(1);
    expect(props.onPrint).toHaveBeenCalledWith({
      printer: PRINTERS[1],
      format: 'cut',
      range: { all: false, from: 3, to: 9 },
      copies: 4,
      collate: true,
      noGdiPlus: true,
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('既定の OK はすべて(A)・部数 1・部単位なし・GDI+ なしを渡す', async () => {
    const { user, props, dialog } = renderPrint({ maxPage: 7 });

    await user.click(within(dialog).getByTestId('print-submit'));

    expect(props.onPrint).toHaveBeenCalledWith({
      printer: PRINTERS[0],
      format: 'list',
      range: { all: true, from: 1, to: 1 },
      copies: 1,
      collate: false,
      noGdiPlus: false,
    });
  });

  it('プレビュー / 詳細設定 / 詳細説明は選んだ形式を渡してコールバックを呼ぶ', async () => {
    const onPreview = vi.fn();
    const onDetails = vi.fn();
    const onHelp = vi.fn();
    const { user, props, dialog } = renderPrint({ onPreview, onDetails, onHelp });

    await user.click(within(dialog).getByTestId('print-preview'));
    expect(onPreview).toHaveBeenCalledWith('list');

    await user.click(within(dialog).getByRole('radio', { name: '白地図印刷(W)' }));
    await user.click(within(dialog).getByTestId('print-details'));
    expect(onDetails).toHaveBeenCalledWith('blankMap');

    await user.click(within(dialog).getByTestId('print-help'));
    expect(onHelp).toHaveBeenCalledTimes(1);

    expect(props.onPrint).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('コールバック未指定でもプレビュー / 詳細設定 / 詳細説明は無効にならない', async () => {
    const { user, dialog } = renderPrint();

    for (const testId of ['print-preview', 'print-details', 'print-help']) {
      const button = within(dialog).getByTestId(testId);
      expect(button).toBeEnabled();
      await user.click(button);
    }
  });

  it('用紙・余白の変更は onPageSetup を呼ぶ (元リソース 1656)', async () => {
    const { user, props, dialog } = renderPrint();

    await user.click(within(dialog).getByTestId('print-page-setup'));

    expect(props.onPageSetup).toHaveBeenCalledTimes(1);
    expect(props.onPrint).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('プロパティは Web 版では開けない (無効)', () => {
    const { dialog } = renderPrint();

    expect(within(dialog).getByRole('button', { name: 'プロパティ(P)...' })).toBeDisabled();
  });

  it('キャンセルは onClose を呼び、印刷はしない', async () => {
    const { user, props, dialog } = renderPrint();

    await user.click(within(dialog).getByTestId('print-cancel'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onPrint).not.toHaveBeenCalled();
  });
});

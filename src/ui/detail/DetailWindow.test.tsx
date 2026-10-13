import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Circle } from '../../domain/types';
import { CHECK_COLOR_HEX, CHECK_COLOR_IDS, checkSwatchIcon } from '../check-colors';
import { ChecklistWindow } from '../checklist/ChecklistWindow';
import { MapWindow } from '../map/MapWindow';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import { DetailWindow } from './DetailWindow';
import type { DetailWindowProps } from './DetailWindow';

function makeCircle(id: number, patch: Partial<Circle> = {}): Circle {
  return {
    id,
    comiketNo: 96,
    pageNo: 104,
    cutIndex: 1,
    day: 1,
    blockId: 1,
    spaceNo: id,
    spaceNoSub: 0,
    genreId: 1,
    circleName: `サークル${id}`,
    circleKana: `さーくる${id}`,
    penName: `ペン${id}`,
    bookName: `本${id}`,
    url: '',
    mailAddr: '',
    description: '',
    memo: '',
    updateId: 0,
    updateData: '',
    circlems: '',
    rss: '',
    updateFlag: 0,
    twitter: '',
    pixiv: '',
    ...patch,
  };
}

/** URL と Twitter だけ登録済みのサークル (メール / WebCatalog / Circle.ms / Pixiv は空)。 */
const CIRCLE = makeCircle(7, {
  circleName: 'SMYSLE',
  circleKana: 'ｽﾐｽﾚ',
  penName: 'ミナト つばさ',
  bookName: '夏のカタログ',
  day: 1,
  blockId: 2,
  spaceNo: 12,
  spaceNoSub: 0,
  genreId: 1,
  description: '（ダミー）評論・考察本を頒布予定です。\n2 日目は委託頒布のみ。',
  url: 'https://example.com/hana',
  twitter: 'hana_shokai',
});

/**
 * 実測値 (px)。カットの原寸は `解析/ui_capture/4-サークル詳細.png` と
 * `解析/ui_capture/analysis/img2-detail.txt` (細いウィンドウでも原寸) から。
 */
/** カット画像の原寸 (ComiketInfo.cutSizeW)。カット欄と枠もこの幅にする。 */
const CUT_WIDTH = 178;
/** カット画像の原寸高 (ComiketInfo.cutSizeH)。 */
const CUT_HEIGHT = 253;

/** 元実装のサークル詳細情報の並び。 */
const INFO_LABELS = [
  'No.',
  'サークル名',
  '読み',
  '執筆者',
  '発行誌',
  'ジャンル',
  '参加日',
  '位置',
  'ページ番号',
  'カット番号',
  'チェック色',
  '補足',
  '更新',
  '更新ID',
] as const;

/** 実測 (`解析/ui_capture/windows.tsv`) のリンク行のラベル。 */
const LINK_LABELS = ['URL', 'Mail', 'WebCatalog', 'Twitter', 'Pixiv', 'Circle.ms'] as const;

function renderDetail(overrides: Partial<DetailWindowProps> = {}) {
  const props: DetailWindowProps = {
    circle: CIRCLE,
    genreName: '創作(少年)',
    checked: false,
    checkColor: 0,
    memo: '',
    onToggleCheck: vi.fn(),
    onMemoChange: vi.fn(),
    onSetColor: vi.fn(),
    onGoogleSearch: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  const view = render(<DetailWindow {...props} />);
  // 1 つのテストで複数回描画しても取り違えないようコンテナ内に限定する。
  return { user, props, detail: within(view.container).getByTestId('detail-window') };
}

/** 「ラベル：値」の 1 行を分ける (全角コロンが無ければラベル扱い)。 */
function splitLine(line: string): [string, string] {
  const index = line.indexOf('：');
  return index < 0 ? [line, ''] : [line.slice(0, index), line.slice(index + 1)];
}

/** 詳細情報の [項目名, 値] を行の並び順で取り出す。 */
function infoRowPairs(detail: HTMLElement): [string, string][] {
  const info = within(detail).getByTestId('detail-info');
  return within(info)
    .getAllByTestId('detail-info-row')
    .map((row) => splitLine(row.textContent ?? ''));
}

/** 詳細情報の 1 項目の値。 */
function infoValue(detail: HTMLElement, label: string): string {
  const pair = infoRowPairs(detail).find(([name]) => name === label);
  expect(pair, `${label} の行がある`).toBeDefined();
  return pair?.[1] ?? '';
}

/** リンク行の [ラベル, 値, リンク] を実物の並び順で取り出す。 */
function linkRowData(
  detail: HTMLElement,
): { label: string; value: string; link: HTMLAnchorElement | null }[] {
  const links = within(detail).getByTestId('detail-links');
  return within(links)
    .getAllByTestId('detail-link-row')
    .map((row) => {
      const [label, value] = splitLine(row.textContent ?? '');
      return { label, value, link: row.querySelector('a') };
    });
}

describe('DetailWindow', () => {
  it('タイトルにサークル名を出し、カット画像を /cuts/<id>.png で表示する', () => {
    const { detail } = renderDetail();

    expect(screen.getByText('サークル詳細 - SMYSLE')).toBeInTheDocument();
    const cut = within(detail).getByTestId('detail-cut-image');
    expect(cut).toHaveAttribute('src', '/cuts/7.png');
    expect(cut).toHaveAttribute('width', '178');
    expect(cut).toHaveAttribute('height', '253');
    expect(within(detail).queryByTestId('detail-cut-placeholder')).toBeNull();
  });

  it('カット欄と枠はカット画像の原寸 178x253 に合わせ、画像の周りに余白を出さない', () => {
    const { detail } = renderDetail();
    const column = within(detail).getByTestId('detail-cut');
    const frame = within(detail).getByTestId('detail-cut-frame');
    const cut = within(detail).getByTestId('detail-cut-image');

    // 実物のカット域は 214x302 だが、カット画像の原寸は 178x253 (catalog の cutSizeW/H)。
    // 214px の欄に置くと画像の右と下に白い余白が出るので、欄も枠も原寸にする。
    expect(column.style.flex).toBe(`0 0 ${CUT_WIDTH}px`);
    expect(frame.style.width).toBe(`${CUT_WIDTH}px`);
    expect(frame.style.height).toBe(`${CUT_HEIGHT}px`);
    // 枠は幅 100% + aspectRatio ではなく画像と同じ実寸なので、余白が出る余地が無い。
    expect(frame.style.aspectRatio).toBe('');
    expect(frame.style.maxHeight).toBe('');
    // 画像は 178x253 の実寸 (原寸) を持つ。
    expect(cut).toHaveAttribute('width', String(CUT_WIDTH));
    expect(cut).toHaveAttribute('height', String(CUT_HEIGHT));
    // 枠に合わせて拡大縮小する (切り取らない)。実寸どおりなので余白は出ない。
    expect(cut.style.objectFit).toBe('contain');
    expect(cut.style.width).toBe('100%');
    expect(cut.style.height).toBe('100%');
  });

  it('カットと詳細情報の帯は高さ 30% で、カットの実寸と情報の行が切れない最小の高さを持つ', () => {
    const { detail } = renderDetail();
    const main = within(detail).getByTestId('detail-main');

    // 実測 302/995 = 30%。15 行 x 12px + 枠と余白 6px = 186px より、
    // カットの実寸 (178x253) の方が高いので、帯の下限は 253px になる。
    expect(main.style.flex).toBe('0 0 30%');
    expect(main.style.minHeight).toBe(`${CUT_HEIGHT}px`);
    expect(main.style.display).toBe('flex');
  });

  it('情報欄の先頭に、曜日とスペースを太字で出す (実物は「土曜日 東G30b」)', () => {
    const { detail } = renderDetail({ dayLabel: '土曜日', areaLabel: '東G30b' });
    const info = within(detail).getByTestId('detail-info');
    const position = within(info).getByTestId('detail-position');

    // 情報欄の 1 行目に置き、既存の 14 項目はその下に続く。
    expect(info.firstElementChild).toBe(position);
    expect(position.textContent).toBe('土曜日 東G30b');
    expect(position.style.fontWeight).toBe('700');

    const rows = within(info).getAllByTestId('detail-info-row');
    expect(rows).toHaveLength(INFO_LABELS.length);
    expect(position.compareDocumentPosition(rows[0])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('曜日と地区が渡されないときは元実装の表記 (n日目 B 12a) に落とす', () => {
    const { detail } = renderDetail();

    expect(within(detail).getByTestId('detail-position').textContent).toBe('1日目 B 12a');
  });

  it('抽選漏れ (day 0) の配置情報は「抽選漏れ」だけにする', () => {
    const { detail } = renderDetail({
      circle: makeCircle(10, { day: 0, blockId: 0, spaceNo: 0 }),
      dayLabel: '土曜日',
      areaLabel: '東G30b',
    });

    // 曜日もスペースも無いので、App が渡したラベルは使わない。
    expect(within(detail).getByTestId('detail-position').textContent).toBe('抽選漏れ');
  });

  it('詳細情報は表ではなく「ラベル：値」の行として並べる', () => {
    const { detail } = renderDetail();
    const info = within(detail).getByTestId('detail-info');

    // 実物は読み取り専用の複数行 Edit なので、表 (table/tr/th/td) は使わない。
    expect(info.querySelector('table')).toBeNull();
    expect(within(info).queryByRole('row')).toBeNull();

    const pairs = infoRowPairs(detail);
    expect(pairs.map(([label]) => label)).toEqual([...INFO_LABELS]);
    expect(pairs).toHaveLength(INFO_LABELS.length);
    // 1 行は 1 つのテキスト行として「ラベル：値」になり、行の data-label で引ける。
    const rows = within(info).getAllByTestId('detail-info-row');
    expect(rows.map((row) => row.getAttribute('data-label'))).toEqual([...INFO_LABELS]);
    expect(rows.map((row) => row.textContent)).toEqual([
      'No.：7',
      'サークル名：SMYSLE',
      '読み：ｽﾐｽﾚ',
      '執筆者：ミナト つばさ',
      '発行誌：夏のカタログ',
      'ジャンル：創作(少年)',
      '参加日：1日目',
      '位置：1日目 B 12a',
      'ページ番号：104',
      'カット番号：1',
      'チェック色：標準色',
      '補足：（ダミー）評論・考察本を頒布予定です。\n2 日目は委託頒布のみ。',
      '更新：—',
      '更新ID：—',
    ]);
  });

  it('詳細情報に各項目の値を表示する', () => {
    const { detail } = renderDetail();

    expect(infoValue(detail, 'No.')).toBe('7');
    expect(infoValue(detail, 'サークル名')).toBe('SMYSLE');
    expect(infoValue(detail, '読み')).toBe('ｽﾐｽﾚ');
    expect(infoValue(detail, '執筆者')).toBe('ミナト つばさ');
    expect(infoValue(detail, '発行誌')).toBe('夏のカタログ');
    expect(infoValue(detail, 'ジャンル')).toBe('創作(少年)');
    expect(infoValue(detail, '参加日')).toBe('1日目');
    // 位置は「1日目 B 12a」(day / blockId の英字 / spaceNo + a|b)。
    expect(infoValue(detail, '位置')).toBe('1日目 B 12a');
    expect(infoValue(detail, 'ページ番号')).toBe('104');
    expect(infoValue(detail, 'カット番号')).toBe('1');
    expect(infoValue(detail, 'チェック色')).toBe('標準色');
    expect(infoValue(detail, '補足')).toBe(
      '（ダミー）評論・考察本を頒布予定です。\n2 日目は委託頒布のみ。',
    );
    expect(infoValue(detail, '更新')).toBe('—');
    expect(infoValue(detail, '更新ID')).toBe('—');
    // メモは「サークルメモ」欄だけに出す (同じ画面に 2 回出さない)。
    expect(infoRowPairs(detail).map(([label]) => label)).not.toContain('メモ');
  });

  it('長い値は折り返さず省略記号で切る (スクロールバーを出さない)', () => {
    const { detail } = renderDetail();
    const info = within(detail).getByTestId('detail-info');
    const row = within(info).getAllByTestId('detail-info-row')[1];

    expect(row.style.whiteSpace).toBe('nowrap');
    expect(row.style.overflow).toBe('hidden');
    const value = within(row).getByText('SMYSLE');
    // 折り返さない指定は行 (親) が持ち、値は省略記号で切る。
    expect(row.style.whiteSpace).toBe('nowrap');
    expect(value.style.overflow).toBe('hidden');
    expect(value.style.textOverflow).toBe('ellipsis');
    expect(value.style.minWidth).toBe('0px');
    // 省略された値は title で読める。
    expect(value).toHaveAttribute('title', 'SMYSLE');
  });

  it('ジャンル名が空なら genreId を表示する', () => {
    const { detail } = renderDetail({ genreName: '' });

    expect(infoValue(detail, 'ジャンル')).toBe('1');
  });

  it('抽選漏れ (day 0) は参加日・位置とも「抽選漏れ」にする', () => {
    const { detail } = renderDetail({
      circle: makeCircle(10, { day: 0, blockId: 0, spaceNo: 0 }),
    });
    const info = within(detail).getByTestId('detail-info');

    expect(infoValue(detail, '参加日')).toBe('抽選漏れ');
    expect(infoValue(detail, '位置')).toBe('抽選漏れ');
    // 先頭の配置情報も含めて 3 か所 (参加日 / 位置 / 配置情報)。
    expect(within(info).getAllByText('抽選漏れ')).toHaveLength(3);
    expect(within(info).getByTestId('detail-position').textContent).toBe('抽選漏れ');
  });

  it('未登録の項目は — を出す', () => {
    const { detail } = renderDetail({
      circle: makeCircle(11, {
        pageNo: 0,
        cutIndex: 0,
        updateFlag: 0,
        updateId: 0,
        description: '',
        circleKana: '',
      }),
    });

    expect(infoValue(detail, 'ページ番号')).toBe('—');
    expect(infoValue(detail, 'カット番号')).toBe('—');
    expect(infoValue(detail, '読み')).toBe('—');
    expect(infoValue(detail, '補足')).toBe('—');
    expect(infoValue(detail, '更新')).toBe('—');
    expect(infoValue(detail, '更新ID')).toBe('—');
  });

  it('更新フラグが立っていれば更新日 (日付が空なら「更新あり」) を出す', () => {
    const withoutDate = renderDetail({ circle: makeCircle(12, { updateFlag: 1, updateId: 3 }) });
    expect(infoValue(withoutDate.detail, '更新')).toBe('更新あり');
    expect(infoValue(withoutDate.detail, '更新ID')).toBe('3');

    const withDate = renderDetail({
      circle: makeCircle(13, { updateFlag: 1, updateData: '2024/08/10', updateId: 5 }),
    });
    expect(infoValue(withDate.detail, '更新')).toBe('2024/08/10');
    expect(infoValue(withDate.detail, '更新ID')).toBe('5');
  });

  it('チェック色は既定で標準色、指定があればその名前を出す', () => {
    expect(infoValue(renderDetail().detail, 'チェック色')).toBe('標準色');
    expect(infoValue(renderDetail({ checkColorLabel: '色3' }).detail, 'チェック色')).toBe('色3');
  });

  it('リンク行は実物どおり 6 行で、ラベルは幅 60px の左揃え', () => {
    const { detail } = renderDetail();
    const links = within(detail).getByTestId('detail-links');
    const rows = within(links).getAllByTestId('detail-link-row');

    expect(rows.map((row) => splitLine(row.textContent ?? '')[0])).toEqual([...LINK_LABELS]);
    expect(rows).toHaveLength(LINK_LABELS.length);
    // 実測 y 357..446 の 6 行 (1 行 14px / ピッチ 15px = 行間 1px)。
    expect(links.style.rowGap).toBe('1px');
    for (const row of rows) {
      expect(row.style.height).toBe('14px');
      expect(within(row).getByText(`${splitLine(row.textContent ?? '')[0]}：`).style.flex).toBe(
        '0 0 60px',
      );
    }
  });

  it('値が入っている行だけを別タブ用のリンクにする', () => {
    const { detail } = renderDetail();
    const rows = linkRowData(detail);

    expect(rows[0]).toMatchObject({ label: 'URL', value: 'https://example.com/hana' });
    expect(rows[0].link).toHaveAttribute('href', 'https://example.com/hana');
    expect(rows[0].link).toHaveAttribute('target', '_blank');
    expect(rows[0].link).toHaveAttribute('rel', 'noreferrer');

    expect(rows[3]).toMatchObject({ label: 'Twitter', value: 'hana_shokai' });
    expect(rows[3].link).toHaveAttribute('href', 'https://twitter.com/hana_shokai');

    // 空の項目は行だけ出して、リンクにはしない。
    expect(rows[1]).toMatchObject({ label: 'Mail', value: '', link: null });
    expect(rows[2]).toMatchObject({ label: 'WebCatalog', value: '', link: null });
    expect(rows[4]).toMatchObject({ label: 'Pixiv', value: '', link: null });
    expect(rows[5]).toMatchObject({ label: 'Circle.ms', value: '', link: null });
  });

  it('mailAddr / pixiv / circlems は専用の URL に変換する', () => {
    const { detail } = renderDetail({
      circle: makeCircle(9, {
        circlems: 'https://circle.ms/hana',
        pixiv: '1234567',
        mailAddr: 'hana@example.com',
      }),
    });
    const rows = linkRowData(detail);

    expect(rows[1]).toMatchObject({ label: 'Mail', value: 'hana@example.com' });
    expect(rows[1].link).toHaveAttribute('href', 'mailto:hana@example.com');
    expect(rows[4]).toMatchObject({ label: 'Pixiv', value: '1234567' });
    expect(rows[4].link).toHaveAttribute('href', 'https://www.pixiv.net/users/1234567');
    // 実物は WebCatalog と Circle.ms の 2 行で、どちらも circlems を使う。
    expect(rows[2]).toMatchObject({ label: 'WebCatalog', value: 'https://circle.ms/hana' });
    expect(rows[2].link).toHaveAttribute('href', 'https://circle.ms/hana');
    expect(rows[5]).toMatchObject({ label: 'Circle.ms', value: 'https://circle.ms/hana' });
    expect(rows[5].link).toHaveAttribute('href', 'https://circle.ms/hana');
  });

  it('リンクが 1 つも無くても実物どおり 6 行のラベルを出す', () => {
    const { detail } = renderDetail({ circle: makeCircle(8) });
    const rows = linkRowData(detail);

    expect(rows.map((row) => row.label)).toEqual([...LINK_LABELS]);
    expect(rows.every((row) => row.value === '' && row.link === null)).toBe(true);
    expect(within(detail).getByTestId('detail-links')).toHaveTextContent('Circle.ms：');
  });

  it('カットの左上にスペース番号のボックスを出す (未チェックは色を塗らない)', () => {
    const { detail } = renderDetail();

    const box = within(detail).getByTestId('detail-cut-space');
    expect(box).toHaveTextContent('12a');
    // 実物のカット枠 (635x903) の左上ボックス (x 22..164 / y 22..164) を比率で重ねる。
    expect(box.style.left).toBe(`${(22 / 635) * 100}%`);
    expect(box.style.background).toBe('');
  });

  it('チェック済みはカットの左上ボックスをチェックリストの色で塗る', () => {
    const { detail } = renderDetail({ checked: true, checkColor: 3 });

    const box = within(detail).getByTestId('detail-cut-space');
    expect(box).toHaveStyle({ background: CHECK_COLOR_HEX[3] });
    expect(box).toHaveTextContent('12a');
  });

  it('標準色 (0) は実物の会場マップと同じ緑で塗る', () => {
    const { detail } = renderDetail({ checked: true, checkColor: 0 });

    expect(within(detail).getByTestId('detail-cut-space')).toHaveStyle({ background: '#00c060' });
  });

  it('メモはメモ欄にそのまま入る (書き換えはその場でできる)', () => {
    const { detail } = renderDetail({ memo: '2日目は委託頒布のみ' });
    const memo = within(detail).getByTestId('detail-memo') as HTMLTextAreaElement;

    // 実物の「メモの編集」ダイアログは無く、メモ欄そのものが入力欄になっている。
    expect(memo.tagName).toBe('TEXTAREA');
    expect(memo.value).toBe('2日目は委託頒布のみ');
    expect(within(detail).queryByTestId('detail-memo-edit')).toBeNull();
  });

  it('メモ欄を書き換えると onMemoChange に渡す', async () => {
    const { user, props, detail } = renderDetail({ memo: '' });
    const memo = within(detail).getByTestId('detail-memo');

    // 表示は呼ぶ側 (App) が持つ state なので、1 文字ずつ onChange で渡る。
    await user.type(memo, '東');
    expect(props.onMemoChange).toHaveBeenLastCalledWith('東');
  });

  it('メモ欄は「サークルメモ：」の下で残りの高さ全部を使う', () => {
    const { detail } = renderDetail({ memo: '東館 先に寄る\n12:00 頃' });
    const memo = within(detail).getByTestId('detail-memo');

    expect(within(detail).getByText('サークルメモ：')).toBeInTheDocument();
    expect(memo.style.flex).toBe('1 1 auto');
    expect(memo.style.minHeight).toBe('0px');
    expect(memo.style.width).toBe('100%');
    expect(memo.style.overflow).toBe('auto');
    expect((memo as HTMLTextAreaElement).value).toBe('東館 先に寄る\n12:00 頃');
  });

  it('中身は overflow: hidden で残りの高さを使う (スクロールバーを出さない)', () => {
    const { detail } = renderDetail();
    const body = within(detail).getByTestId('detail-body');

    expect(body.style.overflow).toBe('hidden');
    // ツールバーが本文の外 (`.window-body` の直下) に出たので、残りの高さは flex で取る。
    expect(body.style.flex).toBe('1 1 auto');
    expect(body.style.height).toBe('');
    expect(body.style.display).toBe('flex');
    expect(body.style.flexDirection).toBe('column');
    expect(within(detail).getByTestId('detail-info').style.overflow).toBe('hidden');
    expect(within(detail).getByTestId('detail-links').style.overflow).toBe('hidden');
    expect(detail.querySelector<HTMLElement>('.window-body')?.style.overflow).toBe('hidden');
  });

  it('ツールバーは本文の外の第 1 子で、本文 (detail-body) はその下に続く', () => {
    const { detail } = renderDetail();
    const windowBody = detail.querySelector<HTMLElement>('.window-body');
    const toolbar = within(detail).getByTestId('detail-toolbar');
    const body = within(detail).getByTestId('detail-body');

    // 実測: 他の 4 ウィンドウ (サークルカット / チェックリスト / サークル一覧 / 会場マップ) は
    // ツールバーが `.window-body` の直下の第 1 子。詳細も同じ構造にする (以前は本文の中にあり
    // 4px 内側へずれていた)。
    expect(windowBody?.firstElementChild).toBe(toolbar);
    expect(windowBody?.children[1]).toBe(body);
    expect(toolbar.parentElement).toBe(windowBody);
    expect(body.parentElement).toBe(windowBody);
    expect(toolbar.contains(body)).toBe(false);

    // 本文はカット / 情報 / リンク / メモを今までどおり持つ。
    expect(within(body).getByTestId('detail-main')).toBeInTheDocument();
    expect(within(body).getByTestId('detail-links')).toBeInTheDocument();
    expect(within(body).getByTestId('detail-memo')).toBeInTheDocument();
  });

  it('本文はツールバーの帯と同じ位置から始まり、左右に余白を持つ', () => {
    const { detail } = renderDetail();
    const body = within(detail).getByTestId('detail-body');

    // 左右 2px は他のウィンドウの本文と同じ値 (`.window-body` の padding 2px の内側に 2px)。
    expect(body.style.paddingLeft).toBe('2px');
    expect(body.style.paddingRight).toBe('2px');
    // 上はツールバーとの間隔、下はウィンドウ枠との間隔。
    expect(body.style.paddingTop).toBe('4px');
    expect(body.style.paddingBottom).toBe('4px');
    // 本文の幅は `.window-body` いっぱいに広がる (ツールバーと同じ帯の広さ)。
    expect(body.style.margin).toBe('');
    expect(body.style.width).toBe('');
  });

  it('ツールバーは Googleで検索 / 設定 / 色1〜色9 / チェック解除 の 12 個のボタンを並べる', () => {
    const { detail } = renderDetail();
    const toolbar = within(detail).getByTestId('detail-toolbar');

    const names = within(toolbar)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual([
      'Googleで検索',
      '設定',
      ...[...CHECK_COLOR_IDS].map((color) => `色${color}`),
      'チェックリストから外す',
    ]);
    expect(within(toolbar).getAllByRole('button')).toHaveLength(12);

    // 色 1〜9 の後ろの区切り線を挟んで、右端はアイコンだけの「チェック解除」。
    const remove = within(toolbar).getByTestId('detail-check-remove');
    expect(remove.querySelector('img')).toHaveAttribute('src', TOOLBAR_ICONS.checkRemove);
    expect(remove).toHaveAttribute('title', 'チェックリストから外す');
    // 実物は x 351..366 のアイコンだけで、文字は無い。
    expect(remove.textContent).toBe('');

    // 実物に無い「チェックに追加」「メモを編集」はツールバーに出さない。
    expect(within(toolbar).queryByText('チェックに追加')).toBeNull();
    expect(within(toolbar).queryByText('メモを編集')).toBeNull();
    expect(within(toolbar).queryByTestId('detail-toggle-check')).toBeNull();
    expect(within(toolbar).queryByTestId('detail-edit-memo')).toBeNull();
  });

  it('「チェック解除」は登録済みのときだけ押せて、onToggleCheck を呼ぶ', async () => {
    const { user, props, detail } = renderDetail({ checked: true });
    const remove = within(detail).getByTestId('detail-check-remove');

    expect(remove).toBeEnabled();
    await user.click(remove);
    expect(props.onToggleCheck).toHaveBeenCalledTimes(1);

    // 未登録のサークルでは外すものが無いので押せない (実物も登録済みのときだけ働く)。
    const unchecked = renderDetail({ circle: makeCircle(8), checked: false });
    expect(within(unchecked.detail).getByTestId('detail-check-remove')).toBeDisabled();
  });

  it('ツールバーの文字ボタンは押しやすい大きさで、色ボタンはサークルカットと同じ 22x22', () => {
    const { detail } = renderDetail();
    const toolbar = within(detail).getByTestId('detail-toolbar');
    const search = within(toolbar).getByTestId('detail-google-search');
    const settings = within(toolbar).getByTestId('detail-settings');

    // 実測 1184x24 のツールバー帯。`.window-body` の直下 (帯の左端) に置き、ボタンは
    // 5 ウィンドウ共通の左右の余白 2px から始める。帯 (外周の溝 = 上辺の外の暗 1px /
    // 上辺の明 1px / 明と暗の間の silver 1px / 下辺の暗 2px) と段の並びはライブラリの
    // `ToolbarBand` / `ToolbarRow` が持つ。jsdom のテストは CSS を読まないので、
    // 見た目ではなく構造で確かめる。
    expect(toolbar.className).toContain('bandContainer');
    expect(toolbar.children[0]?.className).toContain('bandRow');

    // 実測の 86x20 / 30x20 は小さすぎるので、帯の内側いっぱい (ライブラリと同じ 22px) +
    // 左右の余白を持つ大きさに広げる。
    for (const [button, label] of [
      [search, 'Googleで検索'],
      [settings, '設定'],
    ] as const) {
      expect(button.textContent).toBe(label);
      // 帯 25px (明 1px + silver 1px + 暗 1px) の内側に収まるライブラリと同じ 22px のボタン。
      expect(Number.parseFloat(button.style.height)).toBe(22);
      expect(button.style.padding).toBe('0px 9px');
      expect(button.style.paddingLeft).toBe('9px');
      expect(button.style.paddingRight).toBe('9px');
      expect(button.style.minHeight).toBe('22px');
      // 幅は文字に合わせて伸ばす (98.css の min-width 75px は打ち消す)。
      expect(button.style.width).toBe('');
      expect(button.style.minWidth).toBe('0px');
    }

    // 実測の色ボタンは 12x9 の色矩形 + 1px の黒枠 (14x11) だったが、ユーザー指示で
    // サークルカット ウィンドウの色ボタンに合わせて 22x22 のアイコン ボタンに統一した。
    // 間隔も 5 ウィンドウ共通の色パレット (実測のピッチ 23px = 1px 間隔) に揃える。
    const swatch = within(toolbar).getByTestId('detail-color-1');
    expect(swatch.style.width).toBe('22px');
    expect(swatch.style.height).toBe('22px');
    expect(swatch.style.padding).toBe('0px');
    expect(swatch.textContent).toBe('');
    expect(swatch.querySelector('img')?.getAttribute('src')).toBe(
      checkSwatchIcon(CHECK_COLOR_HEX[1]),
    );
    expect(within(toolbar).getByTestId('detail-color-palette').style.gap).toBe('1px');

    // 右端の「チェック解除」はサークルカット ウィンドウと同じ 22x22・アイコンだけのボタン。
    const remove = within(toolbar).getByTestId('detail-check-remove');
    expect(remove.style.width).toBe('22px');
    expect(remove.style.height).toBe('22px');
    expect(remove.style.padding).toBe('0px');
    expect(remove.textContent).toBe('');
    expect(remove.querySelector('img')?.style.width).toBe('16px');
    expect(remove.querySelector('img')?.style.height).toBe('15px');
  });

  it('ツールバーはサークルカット ウィンドウと同じ帯 (ToolbarBand の 1 段) で、段の間の溝は入らない', () => {
    const { detail } = renderDetail();
    const toolbar = within(detail).getByTestId('detail-toolbar');

    // 外周の溝 (上辺の外の暗 1px / 上辺の明 1px / 明と暗の間の silver 1px / 下辺の暗 2px) は
    // ライブラリの `ToolbarBand` が持つ。jsdom のテストは CSS を読まないので、
    // 帯であることと段が 1 個だけであることを構造で確かめる。
    expect(toolbar.className).toContain('bandContainer');
    expect(Array.from(toolbar.children)).toHaveLength(1);
    expect(toolbar.children[0].className).toContain('bandRow');
    // 段が 1 つなので、段と段の間の横 Groove は入らない。
    expect(
      Array.from(toolbar.children).filter(
        (child) => child.getAttribute('aria-orientation') === 'horizontal',
      ),
    ).toHaveLength(0);
  });

  it('色ボタンには実物の色を入れ、押すとその色で onSetColor を呼ぶ', async () => {
    const { user, props, detail } = renderDetail();
    const toolbar = within(detail).getByTestId('detail-toolbar');

    for (const color of CHECK_COLOR_IDS) {
      const button = within(toolbar).getByRole('button', { name: `色${color}` });
      expect(button).toHaveAttribute('title', `色${color}`);
      expect(button).toHaveAttribute('data-color', String(color));
      // 色はサークルカット ウィンドウと同じアイコン (ui/check-colors.ts) で描く。
      expect(button.textContent).toBe('');
      expect(button.querySelector('img')?.getAttribute('src')).toBe(
        checkSwatchIcon(CHECK_COLOR_HEX[color]),
      );
    }
    // 実測の先頭 2 色 (橙 / マゼンタ) もそのまま入っている。
    expect(
      within(toolbar).getByTestId('detail-color-1').querySelector('img')?.getAttribute('src'),
    ).toBe(checkSwatchIcon('#ff944a'));
    expect(
      within(toolbar).getByTestId('detail-color-2').querySelector('img')?.getAttribute('src'),
    ).toBe(checkSwatchIcon('#ff00ff'));

    await user.click(within(toolbar).getByRole('button', { name: '色4' }));
    expect(props.onSetColor).toHaveBeenCalledTimes(1);
    expect(props.onSetColor).toHaveBeenCalledWith(4);
  });

  it('「Googleで検索」は onGoogleSearch を呼び、「設定」は押せない', async () => {
    const { user, props, detail } = renderDetail();
    const toolbar = within(detail).getByTestId('detail-toolbar');

    const settings = within(toolbar).getByRole('button', { name: '設定' });
    expect(settings).toBeDisabled();
    await user.click(settings);
    expect(props.onGoogleSearch).not.toHaveBeenCalled();
    expect(props.onSetColor).not.toHaveBeenCalled();

    await user.click(within(toolbar).getByRole('button', { name: 'Googleで検索' }));
    expect(props.onGoogleSearch).toHaveBeenCalledTimes(1);
  });

  it('Googleで検索 が onGoogleSearch を呼ぶ', async () => {
    const { user, props, detail } = renderDetail();

    await user.click(within(detail).getByTestId('detail-google-search'));
    expect(props.onGoogleSearch).toHaveBeenCalledTimes(1);
  });

  it('circle が null なら未選択を表示し、ツールバーのボタンは色ボタンも含めて無効', async () => {
    const onSetColor = vi.fn();
    const { user, detail } = renderDetail({ circle: null, genreName: '', onSetColor });

    expect(screen.getByText('サークル詳細')).toBeInTheDocument();
    expect(within(detail).getByTestId('detail-empty')).toHaveTextContent(
      'サークルが選択されていません',
    );
    expect(within(detail).getByTestId('detail-cut-placeholder')).toHaveTextContent('カット未選択');
    expect(within(detail).queryByTestId('detail-cut-image')).toBeNull();
    // 未選択でもカット欄は選択時と同じ実寸 (178x253) にして、余白の有無を変えない。
    expect(within(detail).getByTestId('detail-cut-frame').style.width).toBe(`${CUT_WIDTH}px`);
    expect(within(detail).queryByTestId('detail-info-row')).toBeNull();
    // 未選択では配置情報の行も出さず、従来どおりの案内文だけにする。
    expect(within(detail).queryByTestId('detail-position')).toBeNull();

    const toolbar = within(detail).getByTestId('detail-toolbar');
    expect(within(toolbar).getByTestId('detail-google-search')).toBeDisabled();
    expect(within(toolbar).getByTestId('detail-settings')).toBeDisabled();
    const color1 = within(toolbar).getByTestId('detail-color-1');
    for (const color of CHECK_COLOR_IDS) {
      expect(within(toolbar).getByRole('button', { name: `色${color}` })).toBeDisabled();
    }
    // 未選択では色ボタンを押しても登録しない。
    await user.click(color1);
    expect(onSetColor).not.toHaveBeenCalled();

    // 未選択ではメモ欄も編集できない。
    expect(within(detail).getByTestId('detail-memo')).toBeDisabled();

    // リンク行のラベルは実物どおり (値は空) 出したままにする。
    expect(linkRowData(detail).map((row) => row.label)).toEqual([...LINK_LABELS]);
  });

  it('既定サイズで min/max 幅を Window に渡す', () => {
    const { detail } = renderDetail();

    expect(detail.style.minWidth).toBe('500px');
    expect(detail.style.maxWidth).toBe('560px');
  });

  it('min/max 幅は props で差し替えられる', () => {
    const { detail } = renderDetail({ minWidth: 520, maxWidth: 640 });

    expect(detail.style.minWidth).toBe('520px');
    expect(detail.style.maxWidth).toBe('640px');
  });

  it('geometry props を Window に渡す', () => {
    const { detail } = renderDetail({
      initialX: 10,
      initialY: 20,
      width: 400,
      height: 500,
      zIndex: 5,
    });

    expect(detail).toHaveStyle({ position: 'fixed', left: '10px', top: '20px' });
    expect(detail).toHaveStyle({ width: '400px', height: '500px' });
    expect(detail.style.zIndex).toBe('5');
  });

  it('既定のウィンドウサイズは 512x640', () => {
    const { detail } = renderDetail();

    expect(detail.style.width).toBe('512px');
    expect(detail.style.height).toBe('640px');
  });
});

/**
 * ツールバー帯の構造は 5 ウィンドウで揃える (ユーザー指示)。外周の溝 (上辺の外の暗 1px /
 * 上辺の明 1px / 明と暗の間の silver 1px / 下辺の暗 2px) と高さは、ライブラリの
 * `ToolbarBand` が 1 か所で持つ。ここでは 3 ウィンドウを同じ画面に出して、同じ 1 つの
 * 定義を共有していることを構造で確かめる (サークルカット / サークル一覧 の帯も
 * 各 test で確かめる)。
 */
describe('ツールバー帯の共通構造 (サークル詳細 / チェックリスト / 会場マップ)', () => {
  it('3 ウィンドウともライブラリの ToolbarBand で、同じ 1 つの定義を共有する', () => {
    const { detail } = renderDetail();
    render(
      <ChecklistWindow
        rows={[]}
        days={[1, 2, 3, 4, 0]}
        activeDay={1}
        counts={{}}
        colorNames={[]}
        locked={false}
        selectedIds={[]}
        onActiveDayChange={vi.fn()}
        onSelectionChange={vi.fn()}
        onToggleLock={vi.fn()}
        onSetColor={vi.fn()}
        onRemove={vi.fn()}
        onOrderBy={vi.fn()}
        onOpenDetail={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    render(
      <MapWindow
        info={null}
        maps={[]}
        activeMapId={1}
        onActiveMapChange={vi.fn()}
        entries={[]}
        imageUrl=""
        zoom={1}
        onZoomChange={vi.fn()}
        selectedId={null}
        onSelect={vi.fn()}
        onOpenDetail={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const detailToolbar = within(detail).getByTestId('detail-toolbar');
    const checklistToolbar = within(screen.getByTestId('checklist-window')).getByTestId(
      'checklist-toolbar',
    );
    const mapToolbar = within(screen.getByTestId('map-window')).getByTestId('map-toolbar');

    for (const toolbar of [detailToolbar, checklistToolbar, mapToolbar]) {
      // 3 ウィンドウともライブラリの `ToolbarBand` が描く帯 (段の並び・外周の溝はライブラリ CSS)。
      expect(toolbar.className).toContain('bandContainer');
      // ツールバーは `.window-body` の直下の第 1 子 (ウィンドウ枠から同じ位置)。
      expect(toolbar.parentElement?.className).toContain('window-body');
      expect(toolbar.parentElement?.firstElementChild).toBe(toolbar);
    }
    // 3 ウィンドウの帯が同じ className = 同じ 1 つの定義 (ToolbarBand) を共有していること。
    expect(
      new Set([detailToolbar.className, checklistToolbar.className, mapToolbar.className]).size,
    ).toBe(1);

    // 会場マップは帯の中にライブラリの Toolbar を 4 本入れる (実物と同じグループ分け:
    // ズームアウト / ズームイン / 表示 / アンチエイリアス) ので、その 4 本も 22px に詰める
    // (既定の padding 1px 2px のままだと 24px になり、帯 25px の溝の内側からはみ出す)。
    const innerToolbars = mapToolbar.querySelectorAll<HTMLElement>('[role="toolbar"]');
    expect(innerToolbars).toHaveLength(4);
    for (const inner of innerToolbars) {
      expect(inner.style.height).toBe('22px');
      expect(inner.style.padding).toBe('0px 2px');
    }
  });
});

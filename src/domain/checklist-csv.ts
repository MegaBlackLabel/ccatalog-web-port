import type { CheckColor, ChecklistEntry } from '../app/catalog-state';
import type { Circle } from './types';

/**
 * チェックリストの CSV (元実装のチェックリスト保存 / 読み込み)。
 * 列はチェックリストウィンドウの表と同じ並び (README「チェックリストの表」)。
 *
 * - version 2 … 色と位置を含む完全な列
 * - version 1 … 色と位置を持たない旧形式 (読み込み時に標準色で登録する)
 *
 * 元実装の実ファイルは解析していないので、Web 版の割り切りとしてこの並びで出す / 読む。
 */
export const CHECKLIST_CSV_HEADER_V2 = [
  'No',
  '色',
  'サークル名',
  '読み',
  '執筆者',
  '発行誌',
  '補足',
  'メモ',
  '位置',
  '日付',
  'ジャンル',
] as const;

const HEADER_V1 = ['No', 'サークル名', '読み', '執筆者', '発行誌', '補足', 'メモ', '日付', 'ジャンル'] as const;

/** チェックリスト 1 行の CSV 出力に使う値 (アプリ側がカタログから組み立てる)。 */
export type ChecklistCsvRow = {
  entry: ChecklistEntry;
  circle: Circle;
  genreName: string;
  /** 例「2a」。 */
  space: string;
  /** 例「1日目」。 */
  dayLabel: string;
  colorLabel: string;
  memo: string;
};

/** CSV のセルをエスケープする (引用符・カンマ・改行を含む値)。 */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function row(values: readonly (string | number)[]): string {
  return values.map((value) => cell(String(value))).join(',');
}

/** チェックリストを CSV にする。version 1 は色と位置を落とす。 */
export function toChecklistCsv(rows: readonly ChecklistCsvRow[], version: 1 | 2 = 2): string {
  const lines =
    version === 1
      ? [
          HEADER_V1.join(','),
          ...rows.map((item, index) =>
            row([
              index + 1,
              item.circle.circleName,
              item.circle.circleKana,
              item.circle.penName,
              item.circle.bookName,
              item.circle.description,
              item.memo,
              item.dayLabel,
              item.genreName,
            ]),
          ),
        ]
      : [
          CHECKLIST_CSV_HEADER_V2.join(','),
          ...rows.map((item, index) =>
            row([
              index + 1,
              item.colorLabel,
              item.circle.circleName,
              item.circle.circleKana,
              item.circle.penName,
              item.circle.bookName,
              item.circle.description,
              item.memo,
              item.space,
              item.dayLabel,
              item.genreName,
            ]),
          ),
        ];
  return lines.join('\r\n');
}

/** CSV の 1 行をセルへ分解する (引用符と二重引用符に対応)。 */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}

/** 読み込んだチェックリスト 1 行 (アプリ側がカタログと突き合わせる)。 */
export type ParsedChecklistRow = {
  circleName: string;
  circleKana: string;
  penName: string;
  memo: string;
  /** 色が書かれていない形式 (Ver1) は 0 = 標準色。 */
  color: CheckColor;
};

/** 「色3」のようなセルを色番号にする。数値だけのセルも受ける。 */
function parseColor(value: string | undefined): CheckColor {
  const matched = /(\d)/.exec(value ?? '');
  const color = matched ? Number(matched[1]) : 0;
  return color >= 1 && color <= 9 ? (color as CheckColor) : 0;
}

/** CSV を行 (レコード) に分ける。引用符の中の改行は行末にしない。 */
function splitRecords(text: string): string[] {
  const records: string[] = [];
  let record = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      // 引用符の中の "" は 1 つの引用符としてそのまま持ち越す。
      if (quoted && text[index + 1] === '"') {
        record += '""';
        index += 1;
        continue;
      }
      quoted = !quoted;
      record += char;
      continue;
    }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      records.push(record);
      record = '';
      continue;
    }
    record += char;
  }
  records.push(record);
  return records;
}

/**
 * CSV を読み込む。ヘッダー行は列名から位置を決めるので、Ver1 / Ver2 のどちらでも読める。
 * サークル名が空の行は捨てる。
 */
export function parseChecklistCsv(text: string): ParsedChecklistRow[] {
  const lines = splitRecords(text).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitRow(lines[0]).map((value) => value.trim());
  const column = (name: string) => header.indexOf(name);

  return lines
    .slice(1)
    .map((line) => splitRow(line))
    .map((cells) => ({
      circleName: (cells[column('サークル名')] ?? '').trim(),
      circleKana: (cells[column('読み')] ?? '').trim(),
      penName: (cells[column('執筆者')] ?? '').trim(),
      memo: column('メモ') >= 0 ? (cells[column('メモ')] ?? '').trim() : '',
      color: column('色') >= 0 ? parseColor(cells[column('色')]) : 0,
    }))
    .filter((parsed) => parsed.circleName.length > 0);
}

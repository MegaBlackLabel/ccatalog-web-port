// 検索用正規化テーブル。ccatalog.exe (C96) から抽出したものをそのまま持つ。手で編集しない。
// 生成: D:/develop/comiket/解析/gen_normalize.py
//
// 根拠:
//   * 構築     : FUN_00496230 @0x496230 が table[src] = dst を作り、その後 table[del] = 0 を設定
//   * 変換前   : .exe オフセット 0x1ad4c0 (VA 0x5aeac0) — 332 文字
//   * 変換後   : .exe オフセット 0x1ad368 (VA 0x5ae968) — 332 文字
//   * 削除対象 : .exe オフセット 0x1ad360 (VA 0x5ae960) — 3 文字
//   * 適用箇所 : FUN_00495d90 (SJIS を考慮して 1 文字ずつ変換)
//                -> SQL 関数 `normalize` / `ncnt` と、あいまい検索時の検索語前処理 FUN_00475cb0

/** 正規化前の文字。TARGET_CHARS と添字が対応する。 */
export const SOURCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ１２３４５６７８９０あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをんぁぃぅぇぉっゃゅょがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲンァィゥェォッャュョガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポｧｨｩｪｫｯｬｭｮー・、。ｰ[]{}，．：；？！´｀＾￣＿〇ー―‐／＼～｜‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－×＝＜＞￥＄％＃＆＊＠★●◎◆■▲▼※';

/** 正規化後の文字。SOURCE_CHARS と添字が対応する。 */
export const TARGET_CHARS = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz1234567890ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｲｴｦﾝｱｲｳｴｵﾂﾔﾕﾖｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾊﾋﾌﾍﾎﾊﾋﾌﾍﾎｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｲｴｦﾝｱｲｳｴｵﾂﾔﾕﾖｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾊﾋﾌﾍﾎﾊﾋﾌﾍﾎｱｲｳｴｵﾂﾔﾕﾖ-･,.-()(),.:;?!\'`^~_◯---/＼-|`\'""()()()()()()｢｣｢｣()+-x=<>\\$%#&*@☆○○◇□△▽*';

/** 単独の濁点・半濁点。正規化すると削除される。 */
export const DELETE_CHARS = 'ﾞ゛゜';

const NORMALIZE_MAP: Record<string, string> = Object.create(null);
for (let i = 0; i < SOURCE_CHARS.length; i += 1) {
  NORMALIZE_MAP[SOURCE_CHARS[i]] = TARGET_CHARS[i];
}

/** 1 文字だけ正規化する。削除対象なら空文字を返す。 */
export function normalizeChar(ch: string): string {
  if (DELETE_CHARS.includes(ch)) return '';
  return NORMALIZE_MAP[ch] ?? ch;
}

/**
 * ccatalog.exe と同じ正規化。
 * 英字は ASCII 小文字、数字は半角、かなは半角カナの基底字（濁点・小書きは畳む）へ。
 */
export function normalize(text: string): string {
  let out = '';
  for (const ch of text) out += normalizeChar(ch);
  return out;
}

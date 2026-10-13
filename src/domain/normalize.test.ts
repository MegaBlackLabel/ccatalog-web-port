import { describe, expect, it } from 'vitest';
import { DELETE_CHARS, normalize, normalizeChar } from './normalize';

describe('normalize — ccatalog.exe の検索正規化テーブル (FUN_00496230 / FUN_00495d90)', () => {
  it('大小・全半角の英字を ASCII 小文字へ畳む', () => {
    expect(normalize('SMYSLE')).toBe('smysle');
    expect(normalize('Ａｎｉｍｅ')).toBe('anime');
    expect(normalize('ａｂｃ')).toBe('abc');
  });

  it('全角数字を半角へ畳む', () => {
    expect(normalize('１２３４５６７８９０')).toBe('1234567890');
  });

  it('ひらがな・カタカナ・小書き・濁点を半角カナの基底字へ畳む', () => {
    expect(normalize('あにめ')).toBe('ｱﾆﾒ');
    expect(normalize('アニメ')).toBe('ｱﾆﾒ');
    expect(normalize('ｱﾆﾒ')).toBe('ｱﾆﾒ');
    expect(normalize('がぎぐげご')).toBe('ｶｷｸｹｺ');
    expect(normalize('ぱぴぷぺぽ')).toBe('ﾊﾋﾌﾍﾎ');
    expect(normalize('っぁぃぅ')).toBe('ﾂｱｲｳ');
    expect(normalize('ゐゑを')).toBe('ｲｴｦ');
  });

  it('約物・括弧・記号を ASCII へ畳む', () => {
    expect(normalize('ー・、。')).toBe('-･,.');
    expect(normalize('（Ａ）［Ｂ］｛Ｃ｝')).toBe('(a)(b)(c)');
    expect(normalize('☆★○●◎◆■▲▼')).toBe('☆☆○○○◇□△▽');
    expect(normalize('￥＼／')).toBe('\\＼/');
  });

  it('単独の濁点・半濁点は削除する', () => {
    expect(DELETE_CHARS).toBe('ﾞ゛゜');
    expect(normalize('ﾞ゛゜')).toBe('');
    expect(normalizeChar('ﾞ')).toBe('');
  });

  it('テーブルに無い文字はそのまま残す（漢字・英字以外）', () => {
    expect(normalize('刀剣乱舞')).toBe('刀剣乱舞');
    expect(normalize('ゝ')).toBe('ゝ');
  });

  it('テーブルは .exe から抽出した 332 対 + 削除 3 文字', () => {
    expect(normalize('ドールズフロントライン')).toBe('ﾄ-ﾙｽﾌﾛﾝﾄﾗｲﾝ');
  });
});

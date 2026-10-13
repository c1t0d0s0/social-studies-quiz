import { describe, expect, it } from 'vitest';
import { addDays } from '../src/core/date';
import { countCorrect, dailyQuiz, unitQuiz } from '../src/core/quiz';
import { QUIZ_LENGTH } from '../src/core/rewards';
import { GRADES } from '../src/core/snapshot';
import { UNITS, unitById, unitsOf } from '../src/data/units';
import { kanjiBeyondGrade3 } from './kanji';

const ALL = UNITS.flatMap((u) => u.questions.map((q) => ({ unit: u, q })));
/** ふりがなの付いた漢字 (「漢字(かんじ)」) を取りのぞく */
const withoutRuby = (text: string) => text.replace(/[一-龠々ヶノ]+\([ぁ-ん]+\)/g, '');

describe('問題データ', () => {
  it('単元と問題の id が重複しない', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
    expect(new Set(ALL.map(({ q }) => q.id)).size).toBe(ALL.length);
    for (const u of UNITS) expect(u.id, u.id).toMatch(new RegExp(`^g${u.grade}-[a-z]+$`));
  });

  it('どの学年も、110 問以上ある。どの単元も、1 回分 (10 問) 以上ある', () => {
    for (const grade of GRADES) {
      const units = unitsOf(grade);
      expect(units.length, `${grade}年の単元の数`).toBeGreaterThanOrEqual(8);
      expect(units.reduce((sum, u) => sum + u.questions.length, 0), `${grade}年の問題の数`).toBeGreaterThanOrEqual(110);
    }
    for (const u of UNITS) expect(u.questions.length, u.id).toBeGreaterThanOrEqual(QUIZ_LENGTH);
  });

  it('問題文・選択肢 4 つ・解説がそろっていて、選択肢は重複しない', () => {
    for (const { q } of ALL) {
      expect(q.q, q.id).toMatch(/(でしょう。|ですか。)$/);
      expect(q.choices, q.id).toHaveLength(4);
      expect(new Set(q.choices).size, q.id).toBe(4);
      for (const c of q.choices) expect(c.length, q.id).toBeGreaterThan(0);
      expect(q.explain, q.id).toMatch(/。$/);
    }
  });

  it('同じ問題文が 2 回出てこない', () => {
    const seen = new Map<string, string>();
    for (const { q } of ALL) {
      expect(seen.get(q.q), `${q.id} と同じ問題文`).toBeUndefined();
      seen.set(q.q, q.id);
    }
  });

  it('ふりがなの書き方が正しい (かっこが閉じていて、読みは漢字の数以上ある)', () => {
    for (const { unit, q } of ALL) {
      for (const text of [unit.title, q.q, ...q.choices, q.explain]) {
        const opens = [...text].filter((c) => c === '(').length;
        const closes = [...text].filter((c) => c === ')').length;
        expect(opens, `${q.id}: ${text}`).toBe(closes);
        for (const [, kanji, kana] of text.matchAll(/([一-龠々ヶノ]+)\(([ぁ-ん]+)\)/g)) {
          expect(kana.length, `${q.id}: ${kanji}(${kana})`).toBeGreaterThanOrEqual(kanji.length);
        }
      }
    }
  });

  it('3 年生の問題は、3 年生までに習わない漢字にふりがなが付いている', () => {
    for (const { unit, q } of ALL.filter(({ unit }) => unit.grade === 3)) {
      for (const text of [unit.title, q.q, ...q.choices, q.explain]) {
        expect(kanjiBeyondGrade3(withoutRuby(text)), `${q.id}: ${text}`).toEqual([]);
      }
    }
  });
});

describe('今日のチャレンジ', () => {
  const days = Array.from({ length: 366 }, (_, i) => addDays('2026-10-01', i));

  it('1 年分、どの学年も 10 問で、同じ問題が重ならず、4 つの選択肢の中に正解がある', () => {
    for (const grade of GRADES) {
      for (const date of days) {
        const quiz = dailyQuiz(UNITS, grade, date);
        expect(quiz.items, quiz.id).toHaveLength(QUIZ_LENGTH);
        expect(new Set(quiz.items.map((i) => i.question.id)).size, quiz.id).toBe(QUIZ_LENGTH);
        for (const item of quiz.items) {
          expect(item.unit.grade).toBe(grade);
          expect(item.choices[item.answer]).toBe(item.question.choices[0]);
          expect([...item.choices].sort()).toEqual([...item.question.choices].sort());
        }
      }
    }
  });

  it('同じ日・同じ学年なら、いつ作っても同じ問題になる。日や学年がちがえば、ちがう問題になる', () => {
    expect(dailyQuiz(UNITS, 5, '2026-10-13')).toEqual(dailyQuiz(UNITS, 5, '2026-10-13'));
    expect(dailyQuiz(UNITS, 5, '2026-10-13').sig).not.toBe(dailyQuiz(UNITS, 5, '2026-10-14').sig);
    expect(dailyQuiz(UNITS, 5, '2026-10-13').sig).not.toBe(dailyQuiz(UNITS, 6, '2026-10-13').sig);
  });

  it('1 回の 10 問は、単元がかたよらない (同じ単元からは 2 問まで)', () => {
    for (const grade of GRADES) {
      for (const date of days.slice(0, 60)) {
        const counts = new Map<string, number>();
        for (const item of dailyQuiz(UNITS, grade, date).items) counts.set(item.unit.id, (counts.get(item.unit.id) ?? 0) + 1);
        expect(Math.max(...counts.values()), `${grade}年 ${date}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('1 年の間に、その学年の全部の問題が 1 回は出る', () => {
    for (const grade of GRADES) {
      const seen = new Set(days.flatMap((date) => dailyQuiz(UNITS, grade, date).items.map((i) => i.question.id)));
      const total = unitsOf(grade).reduce((sum, u) => sum + u.questions.length, 0);
      expect(seen.size, `${grade}年`).toBe(total);
    }
  });

  it('正解の位置は、1〜4 番にばらけている', () => {
    const counts = [0, 0, 0, 0];
    for (const date of days.slice(0, 100)) for (const item of dailyQuiz(UNITS, 3, date).items) counts[item.answer]++;
    for (const n of counts) expect(n).toBeGreaterThan(180); // 1000 問なら、どれも 250 問くらい
  });
});

describe('単元の練習', () => {
  it('その単元から 10 問。日がかわると、問題か順番が変わる', () => {
    for (const unit of UNITS) {
      const quiz = unitQuiz(unit, '2026-10-13');
      expect(quiz.id).toBe(`unit-${unit.id}`);
      expect(quiz.items, unit.id).toHaveLength(QUIZ_LENGTH);
      expect(new Set(quiz.items.map((i) => i.question.id)).size).toBe(QUIZ_LENGTH);
      for (const item of quiz.items) expect(item.unit).toBe(unit);
      expect(unitQuiz(unit, '2026-10-13').sig).toBe(quiz.sig);
      expect(unitQuiz(unit, '2026-10-14').sig).not.toBe(quiz.sig);
    }
  });

  it('正解した数を数える', () => {
    const quiz = unitQuiz(unitById('g3-map')!, '2026-10-13');
    const right = quiz.items.map((i) => i.answer);
    expect(countCorrect(quiz, right)).toBe(10);
    expect(countCorrect(quiz, right.map((a, i) => (i < 3 ? (a + 1) % 4 : a)))).toBe(7);
    expect(countCorrect(quiz, right.slice(0, 4))).toBe(4); // 途中まで
  });
});

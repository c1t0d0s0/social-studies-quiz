import { describe, expect, it } from 'vitest';
import { addDays } from '../src/core/date';
import { existsSync } from 'node:fs';
import { DAILY_EXTRA, countCorrect, dailyQuiz, unitQuiz, type Figure } from '../src/core/quiz';
import { QUIZ_LENGTH } from '../src/core/rewards';
import { GRADES } from '../src/core/snapshot';
import { COUNTRIES, FLAG_GROUPS } from '../src/data/countries';
import { PREF_PATHS } from '../src/data/figures/pref-paths';
import { SYMBOL_SVG } from '../src/data/figures/symbol-svg';
import { PREFS } from '../src/data/prefs';
import { BASIC_SYMBOLS } from '../src/data/symbols-basic';
import { SYMBOLS } from '../src/data/symbols';
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

  it('手書きの単元は、どれも 40 問以上ある (4 回やらないと一巡しない)', () => {
    for (const u of UNITS.filter((u) => !u.daily)) expect(u.questions.length, u.id).toBeGreaterThanOrEqual(40);
  });

  it('どの学年も、110 問以上ある。どの単元も、1 回分 (10 問) 以上ある', () => {
    for (const grade of GRADES) {
      const units = unitsOf(grade);
      expect(units.length, `${grade}年の単元の数`).toBeGreaterThanOrEqual(8);
      expect(units.reduce((sum, u) => sum + u.questions.length, 0), `${grade}年の問題の数`).toBeGreaterThanOrEqual(110);
    }
    for (const u of UNITS) expect(u.questions.length, u.id).toBeGreaterThanOrEqual(QUIZ_LENGTH);
  });

  it('問題文・選択肢 (正解と、まちがいの候補 3 つ以上)・解説がそろっていて、選択肢は重複しない', () => {
    for (const { unit, q } of ALL) {
      expect(q.q, q.id).toMatch(/(でしょう。|ですか。)$/);
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(4);
      // 手書きの問題は、ちょうど 4 つ
      if (!unit.daily) expect(q.choices, q.id).toHaveLength(4);
      expect(new Set(q.choices).size, q.id).toBe(q.choices.length);
      for (const c of q.choices) expect(c.length, q.id).toBeGreaterThan(0);
      if (q.choiceFigures) expect(q.choiceFigures, q.id).toHaveLength(q.choices.length);
      if (q.choiceNotes) expect(q.choiceNotes, q.id).toHaveLength(q.choices.length);
      expect(q.explain, q.id).toMatch(/[。！]$/);
    }
  });

  it('同じ問題 (問題文と図の組み合わせ) が 2 回出てこない', () => {
    const seen = new Map<string, string>();
    // チャレンジ単元は、ふつうの単元と同じ図を出すので、単元の中だけで比べる
    for (const { unit, q } of ALL) {
      const key = JSON.stringify([unit.daily === 'none' ? unit.id : '', q.q, q.figure]);
      expect(seen.get(key), `${q.id} と同じ問題`).toBeUndefined();
      seen.set(key, q.id);
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
    // 全部の記号を出すチャレンジ単元は、元の名前と由来をそのまま使うので、ここでは見ない
    for (const { unit, q } of ALL.filter(({ unit }) => unit.grade === 3 && unit.daily !== 'none')) {
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
          expect(item.choices).toHaveLength(4);
          expect(new Set(item.choices).size).toBe(4);
          for (const c of item.choices) expect(item.question.choices).toContain(c);
        }
      }
    }
  });

  it('同じ日・同じ学年なら、いつ作っても同じ問題になる。日や学年がちがえば、ちがう問題になる', () => {
    expect(dailyQuiz(UNITS, 5, '2026-10-13')).toEqual(dailyQuiz(UNITS, 5, '2026-10-13'));
    expect(dailyQuiz(UNITS, 5, '2026-10-13').sig).not.toBe(dailyQuiz(UNITS, 5, '2026-10-14').sig);
    expect(dailyQuiz(UNITS, 5, '2026-10-13').sig).not.toBe(dailyQuiz(UNITS, 6, '2026-10-13').sig);
  });

  it('1 回の 10 問は、単元がかたよらない (ふつうの単元からは 2 問まで。図やちしきの単元は合わせて 3 問)', () => {
    for (const grade of GRADES) {
      const hasExtra = unitsOf(grade).some((u) => u.daily === 'extra');
      for (const date of days.slice(0, 60)) {
        const items = dailyQuiz(UNITS, grade, date).items;
        const counts = new Map<string, number>();
        for (const item of items.filter((i) => !i.unit.daily)) counts.set(item.unit.id, (counts.get(item.unit.id) ?? 0) + 1);
        expect(Math.max(...counts.values()), `${grade}年 ${date}`).toBeLessThanOrEqual(2);
        expect(items.filter((i) => i.unit.daily === 'extra'), `${grade}年 ${date}`).toHaveLength(hasExtra ? DAILY_EXTRA : 0);
        expect(items.filter((i) => i.unit.daily === 'none')).toHaveLength(0); // チャレンジ単元からは出ない
      }
    }
    expect(GRADES.filter((g) => unitsOf(g).some((u) => u.daily === 'extra'))).toEqual([3, 4, 6]);
  });

  it('ふつうの単元の問題は、一巡するまで同じ問題が出ない (前の日の続きから出る)', () => {
    for (const grade of GRADES) {
      const core = unitsOf(grade).filter((u) => !u.daily);
      const size = Math.min(...core.map((u) => u.questions.length));
      // いちばん小さい単元が一巡するより短い期間。1 日にどの単元からも 2 問までしか出ない
      const span = days.slice(0, Math.floor(size / 2));
      const ids = span.flatMap((date) => dailyQuiz(UNITS, grade, date).items.filter((i) => !i.unit.daily).map((i) => i.question.id));
      expect(new Set(ids).size, `${grade}年`).toBe(ids.length);
      // どの単元からも、同じくらいの数が出る
      const counts = core.map((u) => ids.filter((id) => id.startsWith(`${u.id}-`)).length);
      expect(Math.max(...counts) - Math.min(...counts), `${grade}年`).toBeLessThanOrEqual(1);
    }
  });

  it('1 年の間に、その学年のふつうの単元の問題が全部 1 回は出る', () => {
    for (const grade of GRADES) {
      const seen = new Set(days.flatMap((date) => dailyQuiz(UNITS, grade, date).items.filter((i) => !i.unit.daily).map((i) => i.question.id)));
      const total = unitsOf(grade).filter((u) => !u.daily).reduce((sum, u) => sum + u.questions.length, 0);
      expect(seen.size, `${grade}年`).toBe(total);
    }
  });

  it('正解の位置は、1〜4 番にばらけている', () => {
    const counts = [0, 0, 0, 0];
    for (const date of days.slice(0, 100)) for (const item of dailyQuiz(UNITS, 3, date).items) counts[item.answer]++;
    for (const n of counts) expect(n).toBeGreaterThan(180); // 1000 問なら、どれも 250 問くらい
  });
});

describe('図を見て答える単元', () => {
  const FIGURE = ALL.filter(({ q }) => q.figure || q.choiceFigures);
  const figuresOf = (kind: Figure['kind']) => FIGURE.flatMap(({ q }) => [q.figure, ...(q.choiceFigures ?? [])]).filter((f) => f?.kind === kind);

  it('全部の図に、絵のデータがある', () => {
    for (const { q } of FIGURE) {
      for (const f of [q.figure, ...(q.choiceFigures ?? [])]) {
        if (!f) continue;
        if (f.kind === 'pref') expect(PREF_PATHS[f.id]?.length ?? 0, q.id).toBeGreaterThan(100);
        else if (f.kind === 'symbol') expect(SYMBOL_SVG[f.id], q.id).toMatch(/^<svg /);
        else expect(existsSync(`public/flags/${f.code.toLowerCase()}.svg`), `${q.id}: ${f.code}`).toBe(true);
      }
    }
    expect(Object.keys(PREF_PATHS)).toHaveLength(47);
    expect(Object.keys(SYMBOL_SVG).sort()).toEqual(SYMBOLS.map((s) => s.id).sort());
  });

  it('47 都道府県・国連加盟 193 か国・地図記号 134 種が、どれも問題になっている', () => {
    const asked = (unitIds: string[], kind: Figure['kind']) =>
      new Set(
        unitIds
          .flatMap((id) => unitById(id)!.questions)
          .map((q) => q.figure)
          .filter((f) => f?.kind === kind)
          .map((f) => JSON.stringify(f)),
      ).size;
    expect(asked(['g4-shape'], 'pref')).toBe(PREFS.length);
    expect(asked(['g6-flagasia', 'g6-flageurope', 'g6-flagafrica', 'g6-flagamericas', 'g6-flagoceania'], 'flag')).toBe(193);
    expect(COUNTRIES.filter((c) => c.un)).toHaveLength(193);
    expect(asked(['g6-flagx'], 'flag')).toBe(COUNTRIES.length);
    expect(asked(['g3-symbolx'], 'symbol')).toBe(SYMBOLS.length);
    expect(asked(['g3-symbol'], 'symbol')).toBe(BASIC_SYMBOLS.length);
    expect(figuresOf('pref').length).toBeGreaterThan(0);
  });

  it('図の選択肢は、名前と図が同じ国・都道府県・記号をさしている', () => {
    const nameOf = (f: Figure) =>
      f.kind === 'pref' ? PREFS[f.id - 1].name : f.kind === 'flag' ? COUNTRIES.find((c) => c.code === f.code)!.name : SYMBOLS.find((s) => s.id === f.id)!.name;
    for (const { unit, q } of FIGURE) {
      if (!q.choiceFigures || unit.id === 'g3-symbol') continue; // 3 年の記号は、名前を 3 年生向けに書きかえている
      expect(q.choiceFigures.map(nameOf), q.id).toEqual(q.choices);
    }
    const basic = unitById('g3-symbol')!;
    for (const q of basic.questions) {
      const ids = (q.choiceFigures ?? [q.figure!]).map((f) => (f.kind === 'symbol' ? f.id : ''));
      const labels = ids.map((id) => BASIC_SYMBOLS.find((b) => b.id === id)!.label);
      expect(q.choiceFigures ? labels : labels[0], q.id).toEqual(q.choiceFigures ? q.choices : q.choices[0]);
    }
  });

  it('形がほぼ同じ地図記号は、同じ問題の選択肢にならばない', () => {
    const group = new Map(SYMBOLS.map((s) => [s.name, s.lookalike]));
    for (const q of unitById('g3-symbolx')!.questions) {
      const groups = q.choices.map((c) => group.get(c)).filter(Boolean);
      expect(new Set(groups).size, q.id).toBe(groups.length);
    }
    expect(SYMBOLS.filter((s) => s.lookalike).length).toBeGreaterThan(5);
  });

  it('図柄が同じ国旗は、同じ問題の選択肢にならばない', () => {
    const group = new Map(COUNTRIES.map((c) => [c.name, FLAG_GROUPS.findIndex((g) => g.includes(c.code))]));
    for (const { q } of FIGURE.filter(({ unit }) => unit.id.startsWith('g6-flag'))) {
      const groups = q.choices.map((c) => group.get(c)!).filter((g) => g >= 0);
      expect(new Set(groups).size, q.id).toBe(groups.length);
    }
    // 国旗の絵は、国と地域の全部にある
    for (const c of COUNTRIES) expect(existsSync(`public/flags/${c.code.toLowerCase()}.svg`), c.code).toBe(true);
  });

  it('まちがいの候補が多い問題は、出るたびに選択肢の組み合わせが変わる', () => {
    const unit = unitById('g6-flagasia')!;
    const target = unit.questions[0];
    const seen = new Set<string>();
    for (let round = 0; round < 200; round++) {
      const item = unitQuiz(unit, round).items.find((i) => i.question === target);
      if (!item) continue;
      expect(item.choices[item.answer]).toBe(target.choices[0]);
      expect(item.choiceFigures).toBeUndefined();
      seen.add([...item.choices].sort().join());
    }
    expect(seen.size).toBeGreaterThan(1);
    // 図の選択肢は、名前と同じならびでえらばれる
    const byFigure = [0, 1, 2, 3].flatMap((round) => unitQuiz(unit, round).items).find((i) => i.choiceFigures)!;
    expect(byFigure.choiceFigures).toHaveLength(4);
    expect(byFigure.choiceFigures!.map((f) => (f.kind === 'flag' ? COUNTRIES.find((c) => c.code === f.code)!.name : ''))).toEqual(byFigure.choices);
  });
});

describe('単元の練習', () => {
  it('その単元から 10 問。回が同じなら同じ問題、回が進むとちがう問題になる', () => {
    for (const unit of UNITS) {
      const quiz = unitQuiz(unit, 0);
      expect(quiz.id).toBe(`unit-${unit.id}`);
      expect(quiz.round).toBe(0);
      expect(quiz.items, unit.id).toHaveLength(QUIZ_LENGTH);
      expect(new Set(quiz.items.map((i) => i.question.id)).size).toBe(QUIZ_LENGTH);
      for (const item of quiz.items) expect(item.unit).toBe(unit);
      expect(unitQuiz(unit, 0).sig).toBe(quiz.sig);
      expect(unitQuiz(unit, 1).sig).not.toBe(quiz.sig);
    }
  });

  it('一巡するまで、同じ問題は出ない (40 問の単元なら、4 回で全部が 1 回ずつ出る)', () => {
    for (const unit of UNITS) {
      const rounds = Math.floor(unit.questions.length / QUIZ_LENGTH);
      const ids = Array.from({ length: rounds }, (_, r) => unitQuiz(unit, r).items.map((i) => i.question.id)).flat();
      expect(new Set(ids).size, unit.id).toBe(rounds * QUIZ_LENGTH);
    }
  });

  it('何巡しても、1 回の 10 問の中に同じ問題は出ない (巡のさかいでも)', () => {
    for (const unit of UNITS.filter((u) => !u.daily)) {
      for (let round = 0; round < 30; round++) {
        const ids = unitQuiz(unit, round).items.map((i) => i.question.id);
        expect(new Set(ids).size, `${unit.id} ${round}回目`).toBe(QUIZ_LENGTH);
      }
    }
    // 2 巡目は、1 巡目とちがうならびになる
    const unit = unitById('g3-map')!;
    const first = [0, 1, 2, 3].flatMap((r) => unitQuiz(unit, r).items.map((i) => i.question.id));
    const second = [4, 5, 6, 7].flatMap((r) => unitQuiz(unit, r).items.map((i) => i.question.id));
    expect(second).not.toEqual(first);
  });

  it('正解した数を数える', () => {
    const quiz = unitQuiz(unitById('g3-map')!, 0);
    const right = quiz.items.map((i) => i.answer);
    expect(countCorrect(quiz, right)).toBe(10);
    expect(countCorrect(quiz, right.map((a, i) => (i < 3 ? (a + 1) % 4 : a)))).toBe(7);
    expect(countCorrect(quiz, right.slice(0, 4))).toBe(4); // 途中まで
  });
});

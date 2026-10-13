import { QUIZ_LENGTH } from './rewards';
import { rngFromString, shuffle, type Rng } from './rng';
import type { Grade } from './snapshot';

export interface Question {
  id: string;
  /** 問題文。ふりがなは「漢字(かんじ)」と書く */
  q: string;
  /** 選択肢。データでは 1 つ目が正解で、出すときにならべかえる */
  choices: string[];
  /** 答えたあとに出す解説 */
  explain: string;
}

export interface Unit {
  /** g3-map など */
  id: string;
  grade: Grade;
  title: string;
  questions: Question[];
}

/** 出題する 1 問。選択肢はならべかえてある */
export interface QuizItem {
  question: Question;
  unit: Unit;
  choices: string[];
  /** choices の中の、正解の番号 */
  answer: number;
}

export interface Quiz {
  /** daily-g3-2026-10-13, unit-g3-map など。記録のキーにもなる */
  id: string;
  kind: 'daily' | 'unit';
  grade: Grade;
  items: QuizItem[];
  /** どの問題がどの順で出ているか。途中経過がこのクイズのものかを見分ける */
  sig: string;
}

export const dailyId = (grade: Grade, date: string) => `daily-g${grade}-${date}`;
export const unitQuizId = (unitId: string) => `unit-${unitId}`;

function toItem(question: Question, unit: Unit, rng: Rng): QuizItem {
  const choices = shuffle(question.choices, rng);
  return { question, unit, choices, answer: choices.indexOf(question.choices[0]) };
}

function build(id: string, kind: Quiz['kind'], grade: Grade, picked: [Question, Unit][], rng: Rng): Quiz {
  const items = picked.map(([q, u]) => toItem(q, u, rng));
  return { id, kind, grade, items, sig: items.map((i) => `${i.question.id}:${i.answer}`).join('|') };
}

/**
 * 今日のチャレンジ。その学年の全部の単元から、かたよらないように 10 問をえらぶ。
 * 日付と学年が同じなら、だれが開いても同じ問題になる。
 */
export function dailyQuiz(units: readonly Unit[], grade: Grade, date: string): Quiz {
  const id = dailyId(grade, date);
  const rng = rngFromString(id);
  const pools = shuffle(
    units.filter((u) => u.grade === grade),
    rng,
  ).map((unit) => ({ unit, rest: shuffle(unit.questions, rng) }));
  const picked: [Question, Unit][] = [];
  // 単元を順にまわって 1 問ずつ取る (単元の数が 10 より少なければ、2 周目に入る)
  for (let i = 0; picked.length < QUIZ_LENGTH && pools.some((p) => p.rest.length > 0); i++) {
    const pool = pools[i % pools.length];
    const q = pool.rest.pop();
    if (q) picked.push([q, pool.unit]);
  }
  return build(id, 'daily', grade, shuffle(picked, rng), rng);
}

/** 単元の練習。その単元から 10 問。日がかわると、ちがう問題・ちがう順になる */
export function unitQuiz(unit: Unit, date: string): Quiz {
  const id = unitQuizId(unit.id);
  const rng = rngFromString(`${id}-${date}`);
  const picked = shuffle(unit.questions, rng)
    .slice(0, QUIZ_LENGTH)
    .map((q): [Question, Unit] => [q, unit]);
  return build(id, 'unit', unit.grade, picked, rng);
}

/** 正解した数 */
export function countCorrect(quiz: Quiz, answers: readonly number[]): number {
  return quiz.items.filter((item, i) => answers[i] === item.answer).length;
}

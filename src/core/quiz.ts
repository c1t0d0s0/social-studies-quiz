import { QUIZ_LENGTH } from './rewards';
import { rngFromString, shuffle, type Rng } from './rng';
import type { Grade } from './snapshot';

/** 問題や選択肢に出す図。絵のデータは大きいので、出すときに読みこむ (ui/figure.ts) */
export type Figure = { kind: 'symbol'; id: string } | { kind: 'pref'; id: number } | { kind: 'flag'; code: string };

export interface Question {
  id: string;
  /** 問題文。ふりがなは「漢字(かんじ)」と書く */
  q: string;
  /** 問題文といっしょに出す図 */
  figure?: Figure;
  /**
   * 選択肢。データでは 1 つ目が正解で、残りはまちがいの候補。
   * 候補が 3 つより多いときは、出すときにその中から 3 つをえらぶ (やるたびに組み合わせが変わる)。
   */
  choices: string[];
  /** 選択肢を図で出すときの図 (choices と同じならび)。choices の文字は、答えたあとに図の下に出す */
  choiceFigures?: Figure[];
  /** 選択肢の下に小さくそえる文字 (よみがななど。choices と同じならび) */
  choiceNotes?: string[];
  /** 答えたあとに出す解説 */
  explain: string;
}

export interface Unit {
  /** g3-map など */
  id: string;
  grade: Grade;
  title: string;
  questions: Question[];
  /**
   * 今日のチャレンジでのあつかい。何も書かなければ、ふつうの単元。
   * extra: 図やちしきの単元。まとめて 3 問だけ出す (単元の数が多くても、そればかりにならないように)
   * none: チャレンジ単元。今日のチャレンジには出さない
   */
  daily?: 'extra' | 'none';
}

/** 出題する 1 問。選択肢はならべかえてある */
export interface QuizItem {
  question: Question;
  unit: Unit;
  choices: string[];
  choiceFigures?: Figure[];
  choiceNotes?: string[];
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

/** 1 回のクイズで、今日のチャレンジに出す図やちしきの単元 (extra) の問題の数 */
export const DAILY_EXTRA = 3;
const CHOICES = 4;

/** 出す選択肢をえらんで、ならべかえる。もどり値は、データの choices の中の番号 */
function pickChoices(question: Question, rng: Rng): number[] {
  const wrong = shuffle(
    question.choices.slice(1).map((_, i) => i + 1),
    rng,
  ).slice(0, CHOICES - 1);
  return shuffle([0, ...wrong], rng);
}

function toItem(question: Question, unit: Unit, rng: Rng): QuizItem & { picked: number[] } {
  const picked = pickChoices(question, rng);
  const take = <T>(list: T[] | undefined) => list && picked.map((i) => list[i]);
  return {
    question,
    unit,
    choices: picked.map((i) => question.choices[i]),
    choiceFigures: take(question.choiceFigures),
    choiceNotes: take(question.choiceNotes),
    answer: picked.indexOf(0),
    picked,
  };
}

function build(id: string, kind: Quiz['kind'], grade: Grade, questions: [Question, Unit][], rng: Rng): Quiz {
  const built = questions.map(([q, u]) => toItem(q, u, rng));
  const items = built.map(({ picked: _picked, ...item }): QuizItem => item);
  return { id, kind, grade, items, sig: built.map((i) => `${i.question.id}:${i.picked.join('.')}`).join('|') };
}

/** 単元を順にまわって 1 問ずつ、合わせて count 問を取る (単元の数が足りなければ、2 周目に入る) */
function takeAround(units: readonly Unit[], count: number, rng: Rng): [Question, Unit][] {
  const pools = shuffle(units, rng).map((unit) => ({ unit, rest: shuffle(unit.questions, rng) }));
  const picked: [Question, Unit][] = [];
  for (let i = 0; picked.length < count && pools.some((p) => p.rest.length > 0); i++) {
    const pool = pools[i % pools.length];
    const q = pool.rest.pop();
    if (q) picked.push([q, pool.unit]);
  }
  return picked;
}

/**
 * 今日のチャレンジ。その学年の単元から、かたよらないように 10 問をえらぶ。
 * 図やちしきの単元 (extra) がある学年は、そこから 3 問、ふつうの単元から 7 問。
 * 日付と学年が同じなら、だれが開いても同じ問題になる。
 */
export function dailyQuiz(units: readonly Unit[], grade: Grade, date: string): Quiz {
  const id = dailyId(grade, date);
  const rng = rngFromString(id);
  const mine = units.filter((u) => u.grade === grade);
  const extra = takeAround(
    mine.filter((u) => u.daily === 'extra'),
    DAILY_EXTRA,
    rng,
  );
  const core = takeAround(
    mine.filter((u) => !u.daily),
    QUIZ_LENGTH - extra.length,
    rng,
  );
  return build(id, 'daily', grade, shuffle([...core, ...extra], rng), rng);
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

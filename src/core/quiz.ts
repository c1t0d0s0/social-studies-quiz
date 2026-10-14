import { dayIndex } from './date';
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
  /** 単元の練習が何回目か (0 から数える)。今日のチャレンジにはない */
  round?: number;
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

// ---- 問題のならび ----
// 単元の問題を、決まった順にならべかえた列を 1 巡目・2 巡目…とつなげた「終わりのない列」として考える。
// 今日のチャレンジも単元の練習も、この列の続きから出すので、一巡するまで同じ問題は出ない。

const decks = new Map<string, Question[]>();

/** 単元の問題を、cycle 巡目の順にならべる */
function deckOrder(unit: Unit, cycle: number): Question[] {
  const key = `${unit.id}#${cycle}`;
  let order = decks.get(key);
  if (!order || order.length !== unit.questions.length) {
    // 問題を前半と後半の 2 組に分け (分け方はいつも同じ)、巡ごとに、それぞれの組の中だけでならべかえる。
    // こうすると、巡のさかいをまたいでも、同じ問題がまた出るまでに少なくとも半分の問題がはさまる
    const base = shuffle(unit.questions, rngFromString(unit.id));
    const half = Math.ceil(base.length / 2);
    const rng = rngFromString(key);
    order = [...shuffle(base.slice(0, half), rng), ...shuffle(base.slice(half), rng)];
    decks.set(key, order);
  }
  return order;
}

/** 列の position 番目の問題。同じ巡の中に同じ問題は 1 回しかなく、巡が変わるとならびも変わる */
export function deck(unit: Unit, position: number): Question {
  const size = unit.questions.length;
  const cycle = Math.floor(position / size);
  return deckOrder(unit, cycle)[position - cycle * size];
}

/**
 * 今日のチャレンジの 1 日分のわく (1 日 perDay 問) を、単元に順にまわして取る。
 * day 日目の k 問目は、通し番号 day × perDay + k のわく。わくは単元を順にまわるので、
 * 「その単元の何番目の問題か」も計算で決まる (記録を持たなくても、前の日の続きになる)。
 */
function takeDaily(units: readonly Unit[], perDay: number, day: number, seed: string): [Question, Unit][] {
  if (units.length === 0) return [];
  // 単元をまわる順は、学年ごとにいつも同じ
  const order = shuffle(units, rngFromString(seed));
  const picked: [Question, Unit][] = [];
  for (let k = 0; k < perDay; k++) {
    const slot = day * perDay + k;
    const index = slot % order.length;
    const unit = order[index];
    // これより前に、この単元にまわってきたわくの数
    let position = Math.floor((slot + order.length - 1 - index) / order.length);
    let question = deck(unit, position);
    // 同じ日に同じ問題が重なるのは、単元が少なくて、巡のさかいをまたぐときだけ。そのときは次の巡の同じ場所の問題にする
    for (let tries = 0; tries < 3 && picked.some(([q]) => q === question); tries++) {
      position += unit.questions.length;
      question = deck(unit, position);
    }
    picked.push([question, unit]);
  }
  return picked;
}

/**
 * 今日のチャレンジ。その学年の単元から、かたよらないように 10 問を出す。
 * 図やちしきの単元 (extra) がある学年は、そこから 3 問、ふつうの単元から 7 問。
 * 日付と学年が同じなら、だれが開いても同じ問題になる。
 */
export function dailyQuiz(units: readonly Unit[], grade: Grade, date: string): Quiz {
  const id = dailyId(grade, date);
  const day = dayIndex(date);
  const mine = units.filter((u) => u.grade === grade);
  const extra = takeDaily(
    mine.filter((u) => u.daily === 'extra'),
    DAILY_EXTRA,
    day,
    `extra-g${grade}`,
  );
  const core = takeDaily(
    mine.filter((u) => !u.daily),
    QUIZ_LENGTH - extra.length,
    day,
    `core-g${grade}`,
  );
  const rng = rngFromString(id);
  return build(id, 'daily', grade, shuffle([...core, ...extra], rng), rng);
}

/**
 * 単元の練習。round 回目 (0 から数える) は、列の round × 10 番目から 10 問。
 * 40 問の単元なら、4 回やると全部の問題が 1 回ずつ出る。
 */
export function unitQuiz(unit: Unit, round: number): Quiz {
  const id = unitQuizId(unit.id);
  const picked: [Question, Unit][] = [];
  const length = Math.min(QUIZ_LENGTH, unit.questions.length);
  // 巡のさかいで同じ問題が重なったら、その先の問題に送る
  for (let position = round * QUIZ_LENGTH; picked.length < length; position++) {
    const question = deck(unit, position);
    if (!picked.some(([q]) => q === question)) picked.push([question, unit]);
  }
  return { ...build(id, 'unit', unit.grade, picked, rngFromString(`${id}-${round}`)), round };
}

/** 正解した数 */
export function countCorrect(quiz: Quiz, answers: readonly number[]): number {
  return quiz.items.filter((item, i) => answers[i] === item.answer).length;
}

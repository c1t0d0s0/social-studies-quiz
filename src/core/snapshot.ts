// ---- 手元の記録の形 ----

export type Grade = 3 | 4 | 5 | 6;
export const GRADES: readonly Grade[] = [3, 4, 5, 6];
export const isGrade = (v: unknown): v is Grade => v === 3 || v === 4 || v === 5 || v === 6;

/** クイズ 1 回分の途中経過 */
export interface Progress {
  /** どの問題がどの順で出ているか。問題が入れかわっていたら、途中経過は使わない */
  sig: string;
  /** 答えた順に、えらんだ選択肢の番号 (0〜3) */
  answers: number[];
  done: boolean;
  /** 単元の練習が何回目か (0 から数える)。「もう一回」のたびに進み、次の 10 問になる。今日のチャレンジにはない */
  round?: number;
  /** さいごに保存した時刻 (ミリ秒)。2 か所の記録を合わせるときに使う */
  at?: number;
}

export interface OwnedCard {
  id: string;
  /** 交換したときに使ったポイント。あとで値段を変えても残高がずれないように残す */
  paid: number;
}

export interface Settings {
  grade: Grade | null;
  sound: boolean | null;
  /** 学年や音をさいごに変えた時刻 (ミリ秒) */
  at: number;
}

/** 1 人分の記録の全部。ログインなしの記録も、ログイン中の人の記録も、この形であつかう */
export interface Snapshot {
  stamps: string[];
  clears: string[];
  cards: OwnedCard[];
  settings: Settings;
  progress: Record<string, Progress>;
}

export function emptySnapshot(): Snapshot {
  return { stamps: [], clears: [], cards: [], settings: { grade: null, sound: null, at: 0 }, progress: {} };
}

/** 記録が 1 つでもあるか (設定だけのときは「ない」とみなす) */
export function hasRecords(s: Snapshot): boolean {
  return (
    s.stamps.length > 0 ||
    s.clears.length > 0 ||
    s.cards.length > 0 ||
    Object.values(s.progress).some((p) => p.done || p.answers.length > 0)
  );
}

// ---- Firestore に保存する形 (小学生向けの学習アプリで共通。Wordlynx と同じ) ----
//
//   users/{uid}                                その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
//   users/{uid}/apps/{appId}                   アプリごとの記録のまとめ (AppDoc)
//   users/{uid}/apps/{appId}/progress/{itemId} 教材 1 つごとの途中経過 (ProgressDoc)

export const SCHEMA = 1;
export const APP_ID = 'social-studies-quiz';

export interface UserDoc {
  schema: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppDoc {
  schema: number;
  updatedAt: number;
  /** その日の目標を達成した日 (YYYY-MM-DD)。このアプリではスタンプ */
  activeDays: string[];
  /** やりとげた教材の id。このアプリではクリアしたクイズ */
  completed: string[];
  /** 手に入れたごほうび。このアプリではスズメカード */
  inventory: Record<string, { paid: number }>;
  /** 使ったポイント。このアプリでは使わない (ほかのアプリと形をそろえるために置く) */
  spent: Record<string, number>;
  /** アプリごとの設定。中身はアプリが決める */
  settings: Record<string, unknown>;
}

export interface ProgressDoc {
  schema: number;
  updatedAt: number;
  status: 'playing' | 'done';
  /** 途中経過の中身。アプリが決める */
  data: Record<string, unknown>;
}

export function toAppDoc(s: Snapshot, now: number): AppDoc {
  return {
    schema: SCHEMA,
    updatedAt: now,
    activeDays: s.stamps,
    completed: s.clears,
    inventory: Object.fromEntries(s.cards.map((c) => [c.id, { paid: c.paid }])),
    spent: {},
    settings: { grade: s.settings.grade, sound: s.settings.sound, at: s.settings.at },
  };
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Firestore から読んだものは形がくずれているかもしれないので、1 つずつ確かめながらもどす */
export function fromAppDoc(doc: Partial<AppDoc> | null | undefined): Snapshot {
  const s = emptySnapshot();
  if (!doc) return s;
  s.stamps = strings(doc.activeDays);
  s.clears = strings(doc.completed);
  for (const [id, item] of Object.entries(doc.inventory ?? {})) {
    if (typeof item?.paid === 'number' && item.paid >= 0) s.cards.push({ id, paid: item.paid });
  }
  const st = doc.settings ?? {};
  s.settings = {
    grade: isGrade(st.grade) ? st.grade : null,
    sound: typeof st.sound === 'boolean' ? st.sound : null,
    at: typeof st.at === 'number' ? st.at : 0,
  };
  return s;
}

export function toProgressDoc(p: Progress, now: number): ProgressDoc {
  return {
    schema: SCHEMA,
    updatedAt: p.at ?? now,
    status: p.done ? 'done' : 'playing',
    data: { sig: p.sig, answers: p.answers, ...(p.round ? { round: p.round } : {}) },
  };
}

export function fromProgressDoc(doc: Partial<ProgressDoc> | null | undefined): Progress | null {
  const d = doc?.data;
  if (!d || typeof d.sig !== 'string' || !Array.isArray(d.answers)) return null;
  return {
    sig: d.sig,
    answers: d.answers.filter((n): n is number => typeof n === 'number'),
    done: doc?.status === 'done',
    ...(typeof d.round === 'number' && d.round > 0 ? { round: d.round } : {}),
    at: typeof doc?.updatedAt === 'number' ? doc.updatedAt : undefined,
  };
}

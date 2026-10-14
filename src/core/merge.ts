import { normalizeStamps } from './rewards';
import type { OwnedCard, Progress, Settings, Snapshot } from './snapshot';

// 2 か所にある記録 (たとえば、この端末と Firestore) を 1 つに合わせる。
// どの関数も、同じものを 2 回合わせても変わらず、a と b を入れかえても同じ結果になる。
// そのため、何回やっても・どの順でやっても、記録がこわれたり二重にふえたりしない。

/** 決め手がないときに、いつも同じほうをえらぶための比べ方 */
const pickStable = <T>(a: T, b: T): T => (JSON.stringify(a) <= JSON.stringify(b) ? a : b);

/** 途中経過: 単元の練習の回がちがえば、進んでいるほう。問題が同じなら、クリア済みを優先。どちらも途中なら、多く答えているほう */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = (a.at ?? 0) !== (b.at ?? 0) ? ((a.at ?? 0) > (b.at ?? 0) ? a : b) : pickStable(a, b);
  if ((a.round ?? 0) !== (b.round ?? 0)) return (a.round ?? 0) > (b.round ?? 0) ? a : b;
  // 問題そのものが入れかわっているときは、新しく保存されたほう
  if (a.sig !== b.sig) return newer;
  const base = a.done !== b.done ? (a.done ? a : b) : a.answers.length !== b.answers.length ? (a.answers.length > b.answers.length ? a : b) : newer;
  const merged: Progress = { ...base };
  const at = Math.max(a.at ?? 0, b.at ?? 0);
  if (at > 0) merged.at = at;
  return merged;
}

/** カード: 両方を合わせる。同じカードは、払った額の小さいほう */
export function mergeCards(a: readonly OwnedCard[], b: readonly OwnedCard[]): OwnedCard[] {
  const paid = new Map<string, number>();
  for (const c of [...a, ...b]) paid.set(c.id, Math.min(c.paid, paid.get(c.id) ?? Infinity));
  return [...paid].map(([id, p]) => ({ id, paid: p })).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}

/** 学年と音: あとから変えたほう */
function mergeSettings(a: Settings, b: Settings): Settings {
  const [newer, older] =
    a.at !== b.at
      ? a.at > b.at
        ? [a, b]
        : [b, a]
      : JSON.stringify([a.grade, a.sound]) <= JSON.stringify([b.grade, b.sound])
        ? [a, b]
        : [b, a];
  return {
    // まだえらんでいない項目 (null) は、もう一方の値でおぎなう
    grade: newer.grade ?? older.grade,
    sound: newer.sound ?? older.sound,
    at: Math.max(a.at, b.at),
  };
}

export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const progress: Record<string, Progress> = {};
  for (const id of [...new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])].sort()) {
    const pa = a.progress[id];
    const pb = b.progress[id];
    progress[id] = pa && pb ? mergeProgress(pa, pb) : (pa ?? pb);
  }
  return {
    stamps: normalizeStamps([...a.stamps, ...b.stamps]),
    clears: [...new Set([...a.clears, ...b.clears])].sort(),
    cards: mergeCards(a.cards, b.cards),
    settings: mergeSettings(a.settings, b.settings),
    progress,
  };
}

/** 記録の中身が同じか (ならび順のちがいは気にしない) */
export function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

export function sameSummary(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify({ ...canonical(a), progress: null }) === JSON.stringify({ ...canonical(b), progress: null });
}

function canonical(s: Snapshot): Snapshot {
  return mergeSnapshots(s, s);
}

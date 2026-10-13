import { describe, expect, it } from 'vitest';
import { mergeCards, mergeProgress, mergeSnapshots, sameSnapshot } from '../src/core/merge';
import { CLEAR_POINTS, earnedPoints } from '../src/core/rewards';
import {
  emptySnapshot,
  fromAppDoc,
  fromProgressDoc,
  hasRecords,
  toAppDoc,
  toProgressDoc,
  type Progress,
  type Snapshot,
} from '../src/core/snapshot';

const snap = (part: Partial<Snapshot>): Snapshot => ({ ...emptySnapshot(), ...part });
const prog = (answers: number[], part: Partial<Progress> = {}): Progress => ({ sig: 's', answers, done: false, ...part });
/** 残高の計算 (storage.ts の balance と同じ式) */
const balance = (s: Snapshot) => s.clears.length * CLEAR_POINTS + earnedPoints(s.stamps).total - s.cards.reduce((sum, c) => sum + c.paid, 0);

describe('2 か所の記録を合わせる', () => {
  it('スタンプとクリアは、両方を合わせた集合になる', () => {
    const a = snap({ stamps: ['2026-10-01', '2026-10-02'], clears: ['unit-g3-map', 'daily-g3-2026-10-01'] });
    const b = snap({ stamps: ['2026-10-02', '2026-10-03'], clears: ['unit-g3-town', 'unit-g3-map'] });
    const m = mergeSnapshots(a, b);
    expect(m.stamps).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(m.clears).toEqual(['daily-g3-2026-10-01', 'unit-g3-map', 'unit-g3-town']);
  });

  it('カードは両方を合わせ、同じカードは払った額の小さいほう', () => {
    expect(mergeCards([{ id: 'c01', paid: 100 }, { id: 'c03', paid: 300 }], [{ id: 'c01', paid: 40 }, { id: 'c02', paid: 80 }])).toEqual([
      { id: 'c01', paid: 40 },
      { id: 'c02', paid: 80 },
      { id: 'c03', paid: 300 },
    ]);
  });

  it('途中経過は、クリア済みを優先する', () => {
    const done = prog([0, 1, 2], { done: true, at: 1 });
    const playing = prog([0, 1], { at: 9 });
    expect(mergeProgress(done, playing).done).toBe(true);
    expect(mergeProgress(playing, done).answers).toEqual([0, 1, 2]);
  });

  it('どちらも途中なら、多く答えているほう', () => {
    const more = prog([3, 1], { at: 1 });
    const less = prog([3], { at: 9 });
    expect(mergeProgress(more, less).answers).toEqual([3, 1]);
    expect(mergeProgress(less, more).answers).toEqual([3, 1]);
    expect(mergeProgress(less, more).at).toBe(9);
  });

  it('問題が入れかわっていたら、新しく保存されたほう', () => {
    const old = prog([0, 1, 2], { sig: 'old', done: true, at: 1 });
    const fresh = prog([2], { sig: 'new', at: 5 });
    expect(mergeProgress(old, fresh).sig).toBe('new');
    expect(mergeProgress(fresh, old).sig).toBe('new');
  });

  it('学年と音は、あとから変えたほう。まだえらんでいない項目はおぎなう', () => {
    const a = snap({ settings: { grade: 4, sound: null, at: 100 } });
    const b = snap({ settings: { grade: 6, sound: false, at: 50 } });
    expect(mergeSnapshots(a, b).settings).toEqual({ grade: 4, sound: false, at: 100 });
    expect(mergeSnapshots(b, a).settings).toEqual({ grade: 4, sound: false, at: 100 });
  });
});

describe('合わせる処理の性質', () => {
  // 2 台で別々に遊んだ、少しずつちがう記録
  const a = snap({
    stamps: ['2026-10-01', '2026-10-02', '2026-10-03'],
    clears: ['unit-g3-map', 'daily-g3-2026-10-01'],
    cards: [{ id: 'c01', paid: 40 }],
    settings: { grade: 3, sound: true, at: 10 },
    progress: { 'unit-g3-map': prog([0, 1, 2], { done: true, at: 3 }), 'unit-g3-town': prog([1], { at: 4 }) },
  });
  const b = snap({
    stamps: ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'],
    clears: ['unit-g3-map', 'unit-g5-rice'],
    cards: [{ id: 'c01', paid: 40 }, { id: 'c02', paid: 80 }],
    settings: { grade: 5, sound: false, at: 20 },
    progress: { 'unit-g3-town': prog([1, 2], { at: 2 }), 'unit-g3-farm': prog([3], { at: 5 }) },
  });
  const c = snap({ stamps: ['2026-09-30'], clears: ['unit-g6-edo'], progress: { 'unit-g3-farm': prog([3, 3, 3], { done: true, at: 1 }) } });

  it('同じものを 2 回合わせても変わらない', () => {
    const once = mergeSnapshots(a, b);
    expect(sameSnapshot(mergeSnapshots(once, b), once)).toBe(true);
    expect(sameSnapshot(mergeSnapshots(once, a), once)).toBe(true);
    expect(sameSnapshot(mergeSnapshots(a, a), a)).toBe(true);
  });

  it('入れかえても、合わせる順を変えても、同じ結果になる', () => {
    expect(sameSnapshot(mergeSnapshots(a, b), mergeSnapshots(b, a))).toBe(true);
    const x = mergeSnapshots(mergeSnapshots(a, b), c);
    const y = mergeSnapshots(a, mergeSnapshots(b, c));
    const z = mergeSnapshots(mergeSnapshots(c, a), b);
    expect(sameSnapshot(x, y)).toBe(true);
    expect(sameSnapshot(x, z)).toBe(true);
  });

  it('合わせたあとの残高は、二重にふえない', () => {
    const m = mergeSnapshots(a, b);
    // スタンプは 10/1〜10/7 の 7 日連続で 1000pt。クリアは 3 つで 60pt
    expect(earnedPoints(m.stamps).total).toBe(1000);
    expect(balance(m)).toBe(1000 + 60 - (40 + 80));
    // 何回合わせても同じ
    expect(balance(mergeSnapshots(mergeSnapshots(m, a), b))).toBe(balance(m));
  });

  it('空の記録と合わせても変わらない', () => {
    expect(sameSnapshot(mergeSnapshots(a, emptySnapshot()), a)).toBe(true);
    expect(hasRecords(emptySnapshot())).toBe(false);
    expect(hasRecords(snap({ settings: { grade: 4, sound: true, at: 5 } }))).toBe(false); // 設定だけ
    expect(hasRecords(snap({ progress: { x: prog([]) } }))).toBe(false); // まだ答えていない途中経過
    expect(hasRecords(snap({ progress: { x: prog([2]) } }))).toBe(true);
    expect(hasRecords(a)).toBe(true);
  });
});

describe('Firestore の形との変換', () => {
  const s = snap({
    stamps: ['2026-10-01'],
    clears: ['unit-g3-map'],
    cards: [{ id: 'c01', paid: 40 }],
    settings: { grade: 5, sound: false, at: 7 },
  });

  it('学習アプリ共通の名前で保存する', () => {
    const doc = toAppDoc(s, 1234);
    expect(doc).toEqual({
      schema: 1,
      updatedAt: 1234,
      activeDays: ['2026-10-01'],
      completed: ['unit-g3-map'],
      inventory: { c01: { paid: 40 } },
      spent: {},
      settings: { grade: 5, sound: false, at: 7 },
    });
    // 名前やメールアドレスにあたる項目はない
    expect(JSON.stringify(doc)).not.toMatch(/email|name|photo/i);
  });

  it('保存して読みもどすと、元の記録になる', () => {
    expect(sameSnapshot(fromAppDoc(toAppDoc(s, 1)), s)).toBe(true);
    const p = prog([0, 3, 1], { at: 99 });
    const doc = toProgressDoc(p, 1);
    expect(doc).toMatchObject({ schema: 1, status: 'playing', updatedAt: 99 });
    expect(fromProgressDoc(doc)).toEqual(p);
    expect(toProgressDoc(prog([0], { done: true }), 5)).toMatchObject({ status: 'done', updatedAt: 5 });
  });

  it('形がくずれたデータを読んでも、こわれない', () => {
    expect(sameSnapshot(fromAppDoc(null), emptySnapshot())).toBe(true);
    const broken = fromAppDoc({ activeDays: 'x', completed: [1, 'unit-g3-map'], inventory: { c01: { paid: -5 }, c02: null }, settings: { grade: 9 } } as never);
    expect(broken.stamps).toEqual([]);
    expect(broken.clears).toEqual(['unit-g3-map']);
    expect(broken.cards).toEqual([]);
    expect(broken.settings.grade).toBeNull();
    expect(fromProgressDoc({ status: 'done' })).toBeNull();
    expect(fromProgressDoc({ data: { sig: 1 } } as never)).toBeNull();
  });
});

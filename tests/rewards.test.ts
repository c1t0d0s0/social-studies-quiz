import { beforeEach, describe, expect, it } from 'vitest';
import { addDays } from '../src/core/date';
import { CLEAR_POINTS, currentRun, earnedPoints, monthView, rewardFor } from '../src/core/rewards';
import { addClear, addStamp, balance, buyCard, getCards, getClears, getGrade, getStamps, gradeFromSearch, setGrade } from '../src/core/storage';
import { CARDS } from '../src/data/cards';
import { GRADES } from '../src/core/snapshot';
import { dailyId, unitQuizId } from '../src/core/quiz';
import { UNITS } from '../src/data/units';
import { kanjiBeyondGrade3 } from './kanji';

/** start から n 日ぶんの連続した日付 */
const days = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i));

// テスト用の localStorage
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
});
beforeEach(() => store.clear());

describe('ポイントの計算', () => {
  it('7 日連続するたびに 1000pt', () => {
    expect(earnedPoints(days('2026-10-05', 6)).total).toBe(0);
    expect(earnedPoints(days('2026-10-05', 7)).total).toBe(1000);
    expect(earnedPoints(days('2026-10-05', 13)).total).toBe(1000);
    expect(earnedPoints(days('2026-10-05', 14)).total).toBe(2000);
  });

  it('とぎれたら数え直す', () => {
    const gap = [...days('2026-10-05', 6), ...days('2026-10-12', 6)]; // 10/11 がぬけている
    expect(earnedPoints(gap).total).toBe(0);
    expect(earnedPoints([...gap, '2026-10-11']).total).toBe(1000); // うめると 13 日連続
    expect(earnedPoints([...days('2026-10-01', 7), ...days('2026-10-10', 7)]).total).toBe(2000);
  });

  it('1 か月すべてそろうと +5000pt (月ごとに数える)', () => {
    const october = days('2026-10-01', 31);
    expect(earnedPoints(october)).toEqual({ weeks: 4, months: ['2026-10'], total: 9000 });
    expect(earnedPoints(october.slice(1)).months).toEqual([]); // 10/1 がない
    expect(earnedPoints(october.slice(0, 30)).months).toEqual([]); // 10/31 がない
    // 10/15 から 31 日つづけても、どの月もそろっていない
    expect(earnedPoints(days('2026-10-15', 31))).toEqual({ weeks: 4, months: [], total: 4000 });
  });

  it('月の長さがちがっても正しい', () => {
    expect(earnedPoints(days('2026-11-01', 30)).months).toEqual(['2026-11']);
    expect(earnedPoints(days('2026-02-01', 28)).months).toEqual(['2026-02']);
    expect(earnedPoints(days('2028-02-01', 28)).months).toEqual([]); // うるう年は 29 日まで
    expect(earnedPoints(days('2028-02-01', 29)).months).toEqual(['2028-02']);
  });

  it('月や年をまたいで続く', () => {
    // 12/1 から 62 日 = 12 月と 1 月がそろい、7 日連続が 8 回
    expect(earnedPoints(days('2026-12-01', 62))).toEqual({ weeks: 8, months: ['2026-12', '2027-01'], total: 18000 });
    expect(earnedPoints(days('2026-12-29', 7)).total).toBe(1000);
  });

  it('同じ日が重なっていても、順番がばらばらでも同じ結果', () => {
    const d = days('2026-10-05', 7);
    expect(earnedPoints([...d, ...d].reverse()).total).toBe(1000);
  });

  it('つづいている日数', () => {
    const d = days('2026-10-05', 3); // 10/5〜10/7
    expect(currentRun(d, '2026-10-07')).toBe(3);
    expect(currentRun(d, '2026-10-08')).toBe(3); // 今日がまだでも、きのうまで続いている
    expect(currentRun(d, '2026-10-09')).toBe(0);
    expect(monthView(d, '2026-10').map((on, i) => (on ? i + 1 : 0)).filter(Boolean)).toEqual([5, 6, 7]);
    expect(monthView(d, '2026-10')).toHaveLength(31);
  });

  it('スタンプを足したときにもらえる分', () => {
    const six = days('2026-10-05', 6);
    expect(rewardFor(six, '2026-10-11')).toEqual({ added: true, run: 7, weekPoints: 1000, monthPoints: 0 });
    expect(rewardFor(six, '2026-10-10')).toEqual({ added: false, run: 6, weekPoints: 0, monthPoints: 0 });
    // 月の最後の日: 31 日目は 7 の倍数ではないので月の分だけ
    expect(rewardFor(days('2026-10-01', 30), '2026-10-31')).toEqual({ added: true, run: 31, weekPoints: 0, monthPoints: 5000 });
    // 2 月 28 日: 28 日目なので週の分と月の分の両方
    expect(rewardFor(days('2026-02-01', 27), '2026-02-28')).toEqual({ added: true, run: 28, weekPoints: 1000, monthPoints: 5000 });
  });
});

describe('スタンプとカードの保存', () => {
  it('同じ日に 2 回クリアしてもスタンプは 1 個', () => {
    expect(addStamp('2026-10-09').added).toBe(true);
    expect(addStamp('2026-10-09').added).toBe(false);
    expect(getStamps()).toEqual(['2026-10-09']);
  });

  it('7 日目のスタンプで 1000pt たまる', () => {
    days('2026-10-03', 6).forEach((d) => addStamp(d));
    expect(balance()).toBe(0);
    expect(addStamp('2026-10-09')).toMatchObject({ added: true, run: 7, weekPoints: 1000 });
    expect(balance()).toBe(1000);
    expect(addStamp('2026-10-09').weekPoints).toBe(0);
    expect(balance()).toBe(1000);
  });

  it('カードと交換するとポイントがへる', () => {
    days('2026-10-03', 7).forEach((d) => addStamp(d));
    // 7 日つづいて 1000pt。800pt のカードと交換すると 200pt のこる
    const card = CARDS[4];
    expect(card.price).toBe(800);
    expect(buyCard(card)).toBe(true);
    expect(balance()).toBe(200);
    expect(buyCard(card)).toBe(false); // もう持っている
    expect(buyCard(CARDS[3])).toBe(false); // 500pt には足りない
    expect(buyCard(CARDS[1])).toBe(true); // 80pt は交換できる
    expect(balance()).toBe(120);
    expect(getCards()).toEqual([
      { id: card.id, paid: 800 },
      { id: CARDS[1].id, paid: 80 },
    ]);
  });

});

describe('クリアのポイント', () => {
  it('クイズを 1 つクリアすると 20pt。同じクイズは 1 回だけ', () => {
    expect(balance()).toBe(0);
    expect(addClear(unitQuizId('g3-map'))).toBe(20);
    expect(balance()).toBe(20);
    expect(addClear(unitQuizId('g3-map'))).toBe(0); // やりなおしてもう一度クリアしても増えない
    expect(balance()).toBe(20);
    expect(addClear(unitQuizId('g4-water'))).toBe(20);
    expect(addClear(dailyId(3, '2026-10-09'))).toBe(20);
    expect(addClear(dailyId(4, '2026-10-09'))).toBe(20); // 学年がちがえば、別のクイズ
    expect(addClear(dailyId(3, '2026-10-10'))).toBe(20); // 次の日の今日のチャレンジ
    expect(balance()).toBe(100);
    expect(getClears()).toHaveLength(5);
  });

  it('スタンプのポイントと合わせてたまり、カードと交換できる', () => {
    for (const d of days('2026-10-03', 7)) {
      addStamp(d);
      addClear(dailyId(5, d));
    }
    expect(balance()).toBe(1000 + 7 * 20);
    // 1140pt で、はじめの 4 枚 (40 + 80 + 300 + 500 = 920pt) をまとめて交換できる
    for (const card of CARDS.slice(0, 4)) expect(buyCard(card)).toBe(true);
    expect(balance()).toBe(220);
    expect(buyCard(CARDS[4])).toBe(false); // 5 枚目 (800pt) にはまだ足りない
  });

  it('2 つクリアすれば、スタンプがなくても 1 枚目のカード (40pt) と交換できる', () => {
    addClear(unitQuizId('g3-map'));
    expect(buyCard(CARDS[0])).toBe(false); // 20pt
    addClear(unitQuizId('g3-town'));
    expect(buyCard(CARDS[0])).toBe(true);
    expect(balance()).toBe(0);
  });
});

describe('学年', () => {
  it('はじめは 3 年生。えらんだ学年をおぼえている', () => {
    expect(getGrade()).toBe(3);
    setGrade(6);
    expect(getGrade()).toBe(6);
  });

  it('URL の ?grade=3〜6 から学年を取り出す', () => {
    expect(gradeFromSearch('?grade=3')).toBe(3);
    expect(gradeFromSearch('?grade=4')).toBe(4);
    expect(gradeFromSearch('?grade=5')).toBe(5);
    expect(gradeFromSearch('?grade=6')).toBe(6);
    expect(gradeFromSearch('?foo=1&grade=5')).toBe(5);
    expect(gradeFromSearch('')).toBeNull();
    expect(gradeFromSearch('?grade=2')).toBeNull();
    expect(gradeFromSearch('?grade=7')).toBeNull();
    expect(gradeFromSearch('?grade=abc')).toBeNull();
  });
});

describe('カード', () => {
  it('20 種類で、id と名前が重複しない', () => {
    expect(CARDS).toHaveLength(20);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(20);
    expect(new Set(CARDS.map((c) => c.name)).size).toBe(20);
  });

  it('値段は安い順にだんだん高くなり、合計は 28,420pt', () => {
    const prices = CARDS.map((c) => c.price);
    expect(prices).toEqual([40, 80, 300, 500, 800, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2200, 2400, 2600, 3000]);
    for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    expect(TOTAL).toBe(28420);
  });

  it('見た目がすべてちがう', () => {
    expect(new Set(CARDS.map((c) => JSON.stringify([c.look, c.bg]))).size).toBe(20);
  });

  it('名前の漢字は 3 年生まで', () => {
    for (const c of CARDS) expect(kanjiBeyondGrade3(c.name), c.name).toEqual([]);
  });
});

// ---- カードの値段のバランス ----
// ポイントのもらい方から、「何日目に何枚持てるか」を計算して確かめる

const TOTAL = CARDS.reduce((sum, c) => sum + c.price, 0);

/** start から n 日つづけてクリアした人が、n 日目までにもらうポイント */
function income(start: string, n: number, perDay: number, stagePoints: number): number {
  return earnedPoints(days(start, n)).total + n * perDay + stagePoints;
}

/** 安い順に買っていったとき、points で何枚持てるか */
function affordable(points: number): number {
  let left = points;
  let count = 0;
  for (const card of CARDS) {
    if (left < card.price) break;
    left -= card.price;
    count++;
  }
  return count;
}

// 1 つの学年の今日のチャレンジだけを毎日やる人 (単元の練習はしない)。
// 月の途中の 10/16 から始めるので、92 日目 (1/15) までに「1 か月そろった」は 11 月と 12 月の 2 回
const EASY_START = '2026-10-16';
const easyOnly = (n: number) => income(EASY_START, n, CLEAR_POINTS, 0);
// いちばん多くもらえる人: 4 学年分の今日のチャレンジを毎日、全部の単元も最初の日にクリア
const ALL_UNITS = UNITS.length * CLEAR_POINTS;
const maxPlayer = (start: string, n: number) => income(start, n, GRADES.length * CLEAR_POINTS, ALL_UNITS);

describe('カードの値段のバランス', () => {
  it('1 つの学年を毎日の人は、はじめの 5 枚を 2 週間以内に手に入れられる', () => {
    const owned = (day: number) => affordable(easyOnly(day));
    expect(owned(1)).toBe(0);
    expect(owned(2)).toBe(1);
    expect(owned(6)).toBe(2);
    expect(owned(7)).toBe(4);
    expect(owned(13)).toBe(4);
    expect(owned(14)).toBe(5);
  });

  it('そのあとは、1 枚ごとに少しずつ時間がかかる', () => {
    // 月そろいの 5000pt が入らない、いちばんおそい場合で数える (1 日 20pt と 7 日ごとの 1000pt だけ)
    const slow = (n: number) => n * CLEAR_POINTS + Math.floor(n / 7) * 1000;
    const dayOf = (count: number) => {
      let day = 1;
      while (affordable(slow(day)) < count) day++;
      return day;
    };
    expect([6, 7, 8, 9, 10].map(dayOf)).toEqual([21, 28, 35, 42, 49]);
    const gaps = Array.from({ length: 15 }, (_, i) => dayOf(i + 6) - dayOf(i + 5)); // 6〜20 枚目
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(7);
    const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    // 後ろのカードほど、前のカードからの日数が長い
    expect(average(gaps.slice(10))).toBeGreaterThan(average(gaps.slice(5, 10)));
    expect(average(gaps.slice(5, 10))).toBeGreaterThan(average(gaps.slice(0, 5)));
    // 6〜10 枚目は 7 日に 1 枚、最後の 5 枚は平均でその 2 倍
    expect(gaps.slice(0, 5)).toEqual([7, 7, 7, 7, 7]);
    expect(average(gaps.slice(10))).toBeGreaterThanOrEqual(14);
  });

  it('いちばん多くもらえる人でも、いつ始めても 11 週間 (77 日) では全部そろわない', () => {
    // うるう年もふくめ、2 年分の開始日をすべて試す
    let start = '2027-01-01';
    let fastest = Infinity;
    for (let i = 0; i < 731; i++) {
      // 日がたつほどポイントはふえるので、77 日目で足りなければ、それより前も足りない
      expect(maxPlayer(start, 77), `${start} から 77 日目`).toBeLessThan(TOTAL);
      let n = 78;
      while (maxPlayer(start, n) < TOTAL) n++;
      fastest = Math.min(fastest, n);
      start = addDays(start, 1);
    }
    // いちばん早い人で、78 日かかる (単元がふえると、単元のクリアでもらえるポイントがふえて、少し早くなる)
    expect(fastest).toBe(78);
  }, 60_000);

  it('月の 1 日から始めれば、1 つの学年だけを毎日の人も 3 か月目の末に全部そろう', () => {
    expect(income('2026-10-01', 91, CLEAR_POINTS, 0)).toBeLessThan(TOTAL);
    expect(income('2026-10-01', 92, CLEAR_POINTS, 0)).toBe(29840);
    expect(income('2026-10-01', 92, CLEAR_POINTS, 0)).toBeGreaterThanOrEqual(TOTAL);
  });

  it('月の途中から始めた人も、4 か月ほどで全部そろう', () => {
    let n = 1;
    while (easyOnly(n) < TOTAL) n++;
    expect(n).toBeGreaterThan(92);
    expect(n).toBeLessThanOrEqual(125);
  });
});

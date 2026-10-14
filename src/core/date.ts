/** 日本時間での今日の日付 (YYYY-MM-DD) */
export function jstDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 2020-01-01 から何日目か。今日のチャレンジで、問題を前の日の続きから出すために使う */
export function dayIndex(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.UTC(2020, 0, 1)) / 86_400_000);
}

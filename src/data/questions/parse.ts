import type { Question, Unit } from '../../core/quiz';
import type { Grade } from '../../core/snapshot';

/**
 * 単元を 1 つ作る。問題は 1 行に 1 問で、次のように書く。
 *
 *   問題文|正解|まちがい|まちがい|まちがい|解説
 *
 * ふりがなは「漢字(かんじ)」と半角かっこで書く。空の行は読みとばす。
 * 問題の id は「単元の id - 何行目か」なので、行をとちゅうに足すと、それより後ろの id がずれる
 * (記録には問題の id をのこしていないので、ずれてもこまらない)。
 */
export function defineUnit(id: string, grade: Grade, title: string, raw: string): Unit {
  const questions: Question[] = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [q, ...rest] = line.split('|').map((part) => part.trim());
      return { id: `${id}-${i + 1}`, q, choices: rest.slice(0, -1), explain: rest[rest.length - 1] ?? '' };
    });
  return { id, grade, title, questions };
}

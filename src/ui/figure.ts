import type { Figure } from '../core/quiz';
import { h } from './dom';

// 都道府県の形と地図記号の絵は大きいので、はじめて図を出すときに別ファイルとして読みこむ
let prefPaths: Promise<Record<number, string>> | null = null;
let symbolSvg: Promise<Record<string, string>> | null = null;
const loadPrefPaths = () => (prefPaths ??= import('../data/figures/pref-paths').then((m) => m.PREF_PATHS));
const loadSymbolSvg = () => (symbolSvg ??= import('../data/figures/symbol-svg').then((m) => m.SYMBOL_SVG));

/** 国旗の絵の場所 (public/flags)。base が './' なので、相対パスで書く */
export const flagUrl = (code: string) => `flags/${code.toLowerCase()}.svg`;

/**
 * 図の要素。絵そのものは答えの手がかりなので、読み上げ用の名前は付けない (何番目の選択肢かは、ボタンの側で伝える)。
 * 地図記号と都道府県の形は、読みこみが終わってから中身が入る。
 */
export function figure(fig: Figure, cls = ''): HTMLElement {
  const el = h('span', { class: `fig fig-${fig.kind} ${cls}`.trim(), 'aria-hidden': 'true' });
  if (fig.kind === 'flag') {
    el.append(h('img', { src: flagUrl(fig.code), alt: '', decoding: 'async', draggable: 'false' }));
  } else if (fig.kind === 'pref') {
    void loadPrefPaths().then((paths) => {
      el.innerHTML = `<svg viewBox="0 0 300 300"><path fill-rule="evenodd" d="${paths[fig.id] ?? ''}"/></svg>`;
    });
  } else {
    void loadSymbolSvg().then((svgs) => {
      el.innerHTML = svgs[fig.id] ?? '';
    });
  }
  return el;
}

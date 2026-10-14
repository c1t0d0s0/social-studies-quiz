import { COUNTRIES, REGION_NAMES, type WorldRegion } from '../data/countries';
import { PREFS, PREF_REGIONS } from '../data/prefs';
import { BASIC_SYMBOLS } from '../data/symbols-basic';
import { SYMBOLS, SYMBOL_CATEGORIES } from '../data/symbols';
import type { Figure } from '../core/quiz';
import { h, homeButton, withRuby } from './dom';
import { figure } from './figure';
import { T } from './text';

export type ZukanKind = keyof typeof T.zukan;
export const isZukanKind = (v: string | undefined): v is ZukanKind => v === 'symbols' || v === 'prefs' || v === 'flags';

/** 図鑑にならべる 1 まい */
interface Entry {
  figure: Figure;
  name: string;
  kana?: string;
  /** しぼりこみに使うグループ (分類・地方・地域) */
  group: string;
  note?: string;
}

const FLAG_REGIONS: WorldRegion[] = ['asia', 'europe', 'africa', 'americas', 'oceania', 'other'];
const basicLabel = new Map(BASIC_SYMBOLS.map((b) => [b.id, b]));

function entries(kind: ZukanKind): { groups: string[]; list: Entry[] } {
  if (kind === 'symbols') {
    return {
      groups: [...SYMBOL_CATEGORIES],
      list: SYMBOLS.map((s) => ({ figure: { kind: 'symbol', id: s.id }, name: s.name, kana: s.kana, group: s.category, note: basicLabel.get(s.id)?.explain ?? s.trivia })),
    };
  }
  if (kind === 'prefs') {
    return {
      groups: [...PREF_REGIONS],
      list: PREFS.map((p) => ({ figure: { kind: 'pref', id: p.id }, name: p.name, kana: p.kana, group: p.region, note: `${T.zukanCapital}${p.capital}。${p.hint}` })),
    };
  }
  return {
    groups: FLAG_REGIONS.map((r) => REGION_NAMES[r]),
    // 地域の中では、国連に加盟している国を先にならべる
    list: FLAG_REGIONS.flatMap((r) =>
      COUNTRIES.filter((c) => c.region === r)
        .sort((a, b) => Number(b.un) - Number(a.un))
        .map((c): Entry => ({ figure: { kind: 'flag', code: c.code }, name: c.name, group: REGION_NAMES[r] })),
    ),
  };
}

/** 図鑑。地図記号・都道府県の形・国旗を、名前といっしょに一覧する。分類でしぼりこめる */
export function renderZukan(root: HTMLElement, kind: ZukanKind): void {
  const { groups, list } = entries(kind);
  let active: string | null = null;

  const grid = h('ul', { class: `zukan-grid zukan-${kind}` });
  const count = h('span', { class: 'bar-meta' });
  const chips = h('div', { class: 'zukan-chips', role: 'group', 'aria-label': T.zukanTitle });

  const paint = () => {
    const shown = list.filter((e) => active === null || e.group === active);
    count.textContent = T.zukanCount(shown.length);
    grid.replaceChildren(
      ...shown.map((e) =>
        h(
          'li',
          { class: 'zukan-item' },
          figure(e.figure),
          h('p', { class: 'zukan-name' }, e.name, e.kana ? h('small', {}, e.kana) : null),
          e.note ? withRuby('p', 'zukan-note', e.note) : null,
        ),
      ),
    );
    for (const chip of chips.children) chip.setAttribute('aria-pressed', String((chip as HTMLElement).dataset.group === (active ?? '')));
  };

  for (const group of [null, ...groups]) {
    const chip = h('button', { type: 'button', class: 'chip', 'data-group': group ?? '' }, group ?? T.zukanAll);
    chip.addEventListener('click', () => {
      active = group;
      paint();
    });
    chips.append(chip);
  }
  paint();

  root.replaceChildren(
    h(
      'div',
      { class: 'zukan-page' },
      h('header', { class: 'bar' }, homeButton(T.goHome), withRuby('h1', '', T.zukan[kind]), count),
      h(
        'main',
        { class: 'zukan-main' },
        // ほかの図鑑へ
        h(
          'nav',
          { class: 'zukan-tabs' },
          ...(Object.keys(T.zukan) as ZukanKind[]).map((k) => {
            const link = withRuby('a', k === kind ? 'btn btn-primary' : 'btn', T.zukan[k]);
            link.setAttribute('href', `#/zukan/${k}`);
            return link;
          }),
        ),
        chips,
        grid,
        h('p', { class: 'page-foot' }, h('a', { class: 'btn btn-primary', href: '#/' }, T.goHome)),
      ),
    ),
  );
}

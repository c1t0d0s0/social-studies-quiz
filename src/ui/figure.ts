import type { Figure } from '../core/quiz';
import { climateById, type ClimateCity } from '../data/climate';
import { MAP_VIEWS, lonLatToXY, placeById, type Place } from '../data/japan-map';
import { h } from './dom';

// 都道府県の形・地図記号・日本地図の絵は大きいので、はじめて図を出すときに別ファイルとして読みこむ
let prefPaths: Promise<Record<number, string>> | null = null;
let symbolSvg: Promise<Record<string, string>> | null = null;
let japanPaths: Promise<Record<number, string>> | null = null;
const loadPrefPaths = () => (prefPaths ??= import('../data/figures/pref-paths').then((m) => m.PREF_PATHS));
const loadSymbolSvg = () => (symbolSvg ??= import('../data/figures/symbol-svg').then((m) => m.SYMBOL_SVG));
const loadJapanPaths = () => (japanPaths ??= import('../data/figures/japan-paths').then((m) => m.JAPAN_PATHS));

/** 国旗の絵の場所 (public/flags)。base が './' なので、相対パスで書く */
export const flagUrl = (code: string) => `flags/${code.toLowerCase()}.svg`;

/**
 * 図の要素。絵そのものは答えの手がかりなので、読み上げ用の名前は付けない (何番目の選択肢かは、ボタンの側で伝える)。
 * 地図記号・都道府県の形・日本地図は、読みこみが終わってから中身が入る。
 */
export function figure(fig: Figure, cls = ''): HTMLElement {
  const el = h('span', { class: `fig fig-${fig.kind} ${cls}`.trim(), 'aria-hidden': 'true' });
  if (fig.kind === 'flag') {
    el.append(h('img', { src: flagUrl(fig.code), alt: '', decoding: 'async', draggable: 'false' }));
  } else if (fig.kind === 'pref') {
    void loadPrefPaths().then((paths) => {
      el.innerHTML = `<svg viewBox="0 0 300 300"><path fill-rule="evenodd" d="${paths[fig.id] ?? ''}"/></svg>`;
    });
  } else if (fig.kind === 'map') {
    const place = placeById(fig.id);
    void loadJapanPaths().then((paths) => {
      el.innerHTML = place ? mapSvg(paths, place) : '';
    });
  } else if (fig.kind === 'climate') {
    const city = climateById(fig.id);
    el.innerHTML = city ? climateSvg(city) : '';
  } else {
    void loadSymbolSvg().then((svgs) => {
      el.innerHTML = svgs[fig.id] ?? '';
    });
  }
  return el;
}

const RED = '#d63c2c';
const n = (v: number) => Math.round(v * 10) / 10;

/** 日本地図に、場所の印を 1 つ付ける */
function mapSvg(paths: Record<number, string>, place: Place): string {
  const [vx, vy, vw, vh] = MAP_VIEWS[place.view];
  // 線の太さや点の大きさは、見せる広さに合わせる (main の幅 300 のときを 1 とする)
  const u = vw / 300;
  const pts = place.marker.at.map(lonLatToXY);
  const poly = pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
  let mark = '';
  switch (place.marker.shape) {
    case 'dot': {
      const [x, y] = pts[0];
      mark = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(4.5 * u)}" fill="${RED}" stroke="#fff" stroke-width="${n(1.5 * u)}"/>`;
      break;
    }
    case 'area': {
      const [x, y] = pts[0];
      const r = place.marker.r ?? 9;
      mark = `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${RED}" fill-opacity="0.4" stroke="${RED}" stroke-width="${n(1.5 * u)}"/>`;
      break;
    }
    case 'line':
    case 'arrow': {
      const line = (color: string, width: number) =>
        `<polyline points="${poly}" fill="none" stroke="${color}" stroke-width="${n(width * u)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      mark = line('#fff', 5.5) + line(RED, 3.5);
      if (place.marker.shape === 'arrow') {
        // 最後の向きに、矢じりを付ける
        const [x1, y1] = pts[pts.length - 2];
        const [x2, y2] = pts[pts.length - 1];
        const a = Math.atan2(y2 - y1, x2 - x1);
        const len = 12 * u;
        const tip = (d: number) => `${n(x2 - len * Math.cos(a + d))},${n(y2 - len * Math.sin(a + d))}`;
        mark += `<polygon points="${n(x2)},${n(y2)} ${tip(0.5)} ${tip(-0.5)}" fill="${RED}" stroke="#fff" stroke-width="${n(u)}"/>`;
      }
      break;
    }
  }
  const land = Object.values(paths)
    .map((d) => `<path d="${d}"/>`)
    .join('');
  return (
    `<svg viewBox="${vx} ${vy} ${vw} ${vh}">` +
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#d9ecf5"/>` +
    `<g fill="#f1ecd2" stroke="#b5ab86" stroke-width="${n(0.4 * u)}" stroke-linejoin="round">${land}</g>` +
    mark +
    '</svg>'
  );
}

/** 雨温図。月ごとの降水量を棒で、平均気温を折れ線で書く (左の目もりが気温、右の目もりが降水量) */
function climateSvg(city: ClimateCity): string {
  const [left, right, top, bottom] = [42, 282, 26, 196];
  const xOf = (month: number) => left + ((month + 0.5) * (right - left)) / 12;
  const tempY = (t: number) => bottom - ((t + 10) / 40) * (bottom - top); // -10〜30℃
  const rainY = (r: number) => bottom - (r / 500) * (bottom - top); // 0〜500mm
  const barW = (right - left) / 12 - 6;
  const parts: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = n(bottom - (i * (bottom - top)) / 4);
    parts.push(`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#c9d3cf" stroke-width="0.8"/>`);
    parts.push(`<text x="${left - 5}" y="${y + 4}" text-anchor="end">${-10 + i * 10}</text>`);
    parts.push(`<text x="${right + 5}" y="${y + 4}">${i * 125}</text>`);
  }
  city.rain.forEach((r, m) => {
    const y = n(rainY(r));
    parts.push(`<rect x="${n(xOf(m) - barW / 2)}" y="${y}" width="${n(barW)}" height="${n(bottom - y)}" fill="#5b9bd5"/>`);
  });
  const line = city.temp.map((t, m) => `${n(xOf(m))},${n(tempY(t))}`).join(' ');
  parts.push(`<polyline points="${line}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linejoin="round"/>`);
  city.temp.forEach((t, m) => parts.push(`<circle cx="${n(xOf(m))}" cy="${n(tempY(t))}" r="2.6" fill="${RED}"/>`));
  city.rain.forEach((_, m) => {
    if (m % 2 === 0 || m === 11) parts.push(`<text x="${n(xOf(m))}" y="${bottom + 15}" text-anchor="middle">${m + 1}</text>`);
  });
  parts.push(`<line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#1c2a4a" stroke-width="1"/>`);
  parts.push(`<text x="${left - 5}" y="${top - 12}" text-anchor="end" fill="${RED}">℃</text>`);
  parts.push(`<text x="${right + 5}" y="${top - 12}" fill="#2f6fa8">mm</text>`);
  parts.push(`<text x="${(left + right) / 2}" y="${bottom + 30}" text-anchor="middle">月</text>`);
  return `<svg viewBox="0 0 320 236" font-size="12" fill="#1c2a4a">${parts.join('')}</svg>`;
}

import type { Background, Card, Item, Look } from '../data/cards';
import { h, hanamaruPoints } from './dom';

// 目や輪郭は、画面の明暗に関係なくこの色にする (文字色に合わせると暗い画面で白目になる)
const LINE = '#1c2a4a';
const RED = '#e8546a';
const YELLOW = '#ffd23f';
const BEAK = '#5a4636';

const sparkle = (cx: number, cy: number, r: number, fill = YELLOW) =>
  `<path fill="${fill}" d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z"/>`;

const EYE_Y = 69;
const EYE_X = [42, 78];

function eyes(look: Look): string {
  const open = (x: number) =>
    look.eyeColor
      ? `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${look.eyeColor}" stroke="${LINE}" stroke-width="1.6"/>` +
        `<ellipse cx="${x}" cy="${EYE_Y}" rx="3.3" ry="6.4" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="2" fill="#fff"/>`
      : `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${LINE}"/>` +
        `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="3.1" fill="#fff"/>` +
        `<circle cx="${x - 2.6}" cy="${EYE_Y + 3.6}" r="1.5" fill="#fff"/>`;
  const arc = (x: number, up: boolean) =>
    `<path fill="none" stroke="${LINE}" stroke-width="2.8" stroke-linecap="round" d="M${x - 7} ${EYE_Y + (up ? 2 : -1)}Q${x} ${EYE_Y + (up ? -8 : 7)} ${x + 7} ${EYE_Y + (up ? 2 : -1)}"/>`;
  const [l, r] = EYE_X;
  switch (look.eyes ?? 'open') {
    case 'wink':
      return open(l) + arc(r, true);
    case 'sleep':
      return arc(l, false) + arc(r, false);
    case 'happy':
      return arc(l, true) + arc(r, true);
    case 'sparkle':
      return open(l) + open(r) + sparkle(l - 11, EYE_Y - 12, 4.5) + sparkle(r + 11, EYE_Y - 12, 4.5);
    case 'brave':
      return (
        open(l) +
        open(r) +
        `<path fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round" d="M33 56L50 60.5M87 56L70 60.5"/>`
      );
    default:
      return open(l) + open(r);
  }
}

/** くちばしと、のどの黒いもよう */
function beak(look: Look): string {
  const bib = `<path fill="${LINE}" d="M53 91Q60 94 67 91Q67.5 99 60 101Q52.5 99 53 91Z"/>`;
  if (look.mouth === 'open') {
    return (
      bib +
      `<g stroke="${LINE}" stroke-width="2" stroke-linejoin="round">` +
      `<path fill="#8a3b3b" d="M55 80L60 90L65 80Z"/>` +
      `<path fill="${BEAK}" d="M54 79.5Q60 75.5 66 79.5Q60 83 54 79.5Z"/>` +
      `<path fill="${BEAK}" d="M57 87Q60 86 63 87L60 91.5Z"/></g>`
    );
  }
  return (
    bib +
    `<path fill="${BEAK}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" d="M54 79.5Q60 75.5 66 79.5L60 88.5Z"/>` +
    `<path fill="none" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round" d="M56 81.5Q60 83.5 64 81.5"/>`
  );
}

// 頭の上にかぶるもの。これがあるときは、頭のてっぺんの羽をかかない
const HEADWEAR: Item[] = ['hat', 'headband', 'cap', 'wizard', 'crown'];

const ITEMS: Record<Item, string> = {
  ribbon:
    `<g transform="translate(87 31) rotate(18)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" fill="${RED}">` +
    `<path d="M0 0L-14 -8.5V8.5Z"/><path d="M0 0L14 -8.5V8.5Z"/><circle r="4"/></g>`,
  glasses:
    `<g fill="rgba(255,255,255,0.3)" stroke="${LINE}" stroke-width="2.6">` +
    `<circle cx="42" cy="69" r="11.5"/><circle cx="78" cy="69" r="11.5"/>` +
    `<path fill="none" stroke-linecap="round" d="M53.5 67.5Q60 63.5 66.5 67.5M30.5 67L21 63M89.5 67L99 63"/></g>`,
  pencil:
    `<g transform="rotate(30 97 34)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round">` +
    `<rect x="93" y="12" width="8" height="6" fill="#f7a3b0"/><rect x="93" y="18" width="8" height="26" fill="${YELLOW}"/>` +
    `<path fill="#f6e0b5" d="M93 44H101L97 54Z"/><path fill="${LINE}" stroke="none" d="M95.4 50H98.6L97 54Z"/></g>`,
  hat:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<ellipse cx="60" cy="31" rx="43" ry="7.5" fill="#f0d27a"/>` +
    `<path fill="#f5dc8e" d="M37 30C37 6 83 6 83 30Q60 36 37 30Z"/>` +
    `<path fill="${RED}" d="M37.2 24Q60 19 82.8 24L83 30Q60 36 37 30Z"/></g>`,
  scarf:
    `<g fill="${RED}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path d="M73 110L79 129L90 125L85 107Z"/><path d="M25 97Q60 113 95 97L97 107Q60 125 23 107Z"/></g>` +
    `<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" d="M38 107Q60 115 82 107"/>`,
  flower:
    `<g transform="translate(88 31)" stroke="${LINE}" stroke-width="1.6">` +
    [0, 72, 144, 216, 288].map((a) => `<circle r="5.4" cx="0" cy="-6.6" fill="#ff9fb5" transform="rotate(${a})"/>`).join('') +
    `<circle r="4" fill="${YELLOW}"/></g>`,
  book:
    `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">` +
    `<path fill="#fff" d="M32 100Q46 93 60 100Q74 93 88 100V120Q74 113 60 120Q46 113 32 120Z"/>` +
    `<path fill="none" d="M60 100V120"/></g>` +
    `<path fill="none" stroke="#9aa6b8" stroke-width="1.4" stroke-linecap="round" d="M38 104Q46 101 54 104M38 109Q46 106 54 109M66 104Q74 101 82 104M66 109Q74 106 82 109"/>`,
  headband:
    `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" fill="#fff">` +
    `<path d="M97 52L112 44L110 53L114 60L98 58Z"/><path d="M21 50Q60 33 99 50L99.5 59Q60 42 20.5 59Z"/></g>` +
    `<circle cx="60" cy="44.5" r="4.4" fill="#d63c2c"/>`,
  headphones:
    `<path fill="none" stroke="${LINE}" stroke-width="8" stroke-linecap="round" d="M19 62C19 12 101 12 101 62"/>` +
    `<path fill="none" stroke="#5b79d6" stroke-width="4.5" stroke-linecap="round" d="M19 62C19 12 101 12 101 62"/>` +
    `<g fill="${RED}" stroke="${LINE}" stroke-width="2.2"><rect x="9" y="55" width="14" height="27" rx="6.5"/><rect x="97" y="55" width="14" height="27" rx="6.5"/></g>`,
  cap:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path fill="#2f55a8" d="M38 33C24 33 11 37 6 44C24 45 46 41 62 35Z"/>` +
    `<path fill="#3f6fd1" d="M35 34C35 8 85 8 85 34Q60 28 35 34Z"/></g>` +
    `<circle cx="60" cy="13.5" r="2.6" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>` +
    `<path fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7" d="M60 16V30"/>`,
  wizard:
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">` +
    `<path fill="#5b3fa8" d="M34 33Q50 10 70 -12Q72 12 86 33Q60 39 34 33Z"/>` +
    `<ellipse cx="60" cy="33" rx="37" ry="6.5" fill="#4a3290"/></g>` +
    sparkle(57, 20, 5) +
    sparkle(69, 8, 3.2) +
    sparkle(72, 25, 2.6),
  crown:
    `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" d="M38 32L35 8L49 20L60 2L71 20L85 8L82 32Q60 26 38 32Z"/>` +
    `<circle cx="60" cy="21" r="3.6" fill="#d63c2c" stroke="${LINE}" stroke-width="1.4"/>` +
    `<circle cx="45.5" cy="24" r="2.6" fill="#4a90e2" stroke="${LINE}" stroke-width="1.2"/>` +
    `<circle cx="74.5" cy="24" r="2.6" fill="#3fb37f" stroke="${LINE}" stroke-width="1.2"/>`,
  zzz:
    `<g fill="#fff" font-family="sans-serif" font-weight="700">` +
    `<text x="90" y="34" font-size="13">z</text><text x="99" y="22" font-size="16">z</text><text x="110" y="8" font-size="19">z</text></g>`,
};

const FUR = '#b9763f';
const LIGHT = '#fbf3e2';
const WING = '#8c5a33';

/**
 * スズメ (たて 110 × よこ 120 の中にかく)。茶色い頭、白いほおの黒いもよう、のどの黒いもようが目じるし。
 * 目の位置や頭の大きさは小物 (ぼうし・めがねなど) に合わせてあるので、変えるときは ITEMS も見直すこと。
 */
export function sparrowBody(look: Look = {}): string {
  const items = look.items ?? [];
  const fur = look.fur ?? FUR;
  const light = look.light ?? LIGHT;
  const wing = look.wing ?? WING;
  const tuft = !items.some((i) => HEADWEAR.includes(i));
  return (
    `<path fill="none" stroke="#e8963a" stroke-width="3" stroke-linecap="round" d="M48 103V109M43 109H53M72 103V109M67 109H77"/>` +
    `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">` +
    `<path fill="${wing}" d="M22 62C8 72 6 92 17 103C25 97 29 82 27 66ZM98 62C112 72 114 92 103 103C95 97 91 82 93 66Z"/>` +
    (tuft ? `<path fill="${fur}" d="M54 30C53 22 56 17 59 21C60 15 65 15 65 21C68 18 71 22 68 30Z"/>` : '') +
    `<path fill="${fur}" d="M60 27C36 27 19 45 19 68C19 91 36 106 60 106C84 106 101 91 101 68C101 45 84 27 60 27Z"/></g>` +
    `<path fill="${light}" d="M60 58C50 51 34 53 25 64C21 85 37 103 60 103C83 103 99 85 95 64C86 53 70 51 60 58Z"/>` +
    `<path fill="none" stroke="${wing}" stroke-width="2" stroke-linecap="round" opacity="0.55" d="M46 39Q60 34 74 39M40 47Q60 40 80 47"/>` +
    `<ellipse cx="30" cy="83" rx="6.5" ry="5" fill="${LINE}"/><ellipse cx="90" cy="83" rx="6.5" ry="5" fill="${LINE}"/>` +
    eyes(look) +
    beak(look) +
    items.map((item) => ITEMS[item]).join('')
  );
}

/** タイトル画面のスズメ */
export function sparrow(): HTMLElement {
  const el = h('div', { class: 'sparrow' });
  el.innerHTML = `<svg viewBox="0 0 120 112" role="img" aria-label="スズメのキャラクター">${sparrowBody()}</svg>`;
  return el;
}

// ---- カードの絵柄 (たて 156 × よこ 120) ----

const W = 120;
const H = 156;
const circles = (points: number[][], fill: string) =>
  points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const fillRect = (fill: string) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;

function background(bg: Background): string {
  switch (bg) {
    case 'dots': {
      const dots: number[][] = [];
      for (let y = 0; y < 11; y++) for (let x = 0; x < 9; x++) dots.push([x * 15 + (y % 2) * 7.5, y * 15 + 6, 3.2]);
      return fillRect('#fff5c2') + circles(dots, '#ffe36e');
    }
    case 'grid': {
      let d = '';
      for (let x = 12; x < W; x += 12) d += `M${x} 0V${H}`;
      for (let y = 12; y < H; y += 12) d += `M0 ${y}H${W}`;
      return fillRect('#f3faf6') + `<path d="${d}" stroke="#b9dccf" stroke-width="1" fill="none"/>`;
    }
    case 'night':
      return (
        fillRect('#27305a') +
        `<circle cx="24" cy="24" r="11" fill="#ffe58a"/><circle cx="29" cy="20.5" r="10" fill="#27305a"/>` +
        circles([[52, 14, 1.4], [76, 26, 1.1], [14, 60, 1.2], [108, 52, 1.5], [100, 140, 1.3], [16, 132, 1.5], [62, 148, 1.1]], '#fff') +
        sparkle(90, 16, 4, '#ffe58a') +
        sparkle(106, 100, 3, '#ffe58a')
      );
    case 'pink':
      return fillRect('#ffe4ea') + circles([[18, 22, 13], [102, 34, 9], [96, 132, 16], [14, 120, 8], [60, 10, 6]], '#ffd0da');
    case 'sky':
      return (
        fillRect('#cdeaf8') +
        `<circle cx="98" cy="22" r="11" fill="${YELLOW}"/>` +
        `<g fill="#fff"><ellipse cx="26" cy="22" rx="15" ry="6.5"/><ellipse cx="34" cy="17" rx="9" ry="6"/>` +
        `<ellipse cx="92" cy="142" rx="17" ry="6.5"/><ellipse cx="20" cy="136" rx="12" ry="5"/></g>`
      );
    case 'snow':
      return (
        fillRect('#dcecf5') +
        `<ellipse cx="60" cy="160" rx="90" ry="22" fill="#fff"/>` +
        circles([[16, 16, 2.6], [44, 10, 1.8], [78, 20, 2.4], [104, 12, 1.9], [10, 58, 2], [110, 66, 2.6], [20, 104, 1.8], [102, 112, 2.2], [60, 24, 1.6]], '#fff')
      );
    case 'sakura': {
      const petals = [[16, 18, 20], [42, 10, -30], [86, 16, 50], [106, 34, -10], [10, 70, 70], [112, 86, 30], [18, 128, -40], [98, 138, 15], [58, 146, -60], [70, 28, 80]];
      return (
        fillRect('#fdeaf0') +
        petals.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#f7a8bd" transform="rotate(${a} ${x} ${y})"/>`).join('')
      );
    }
    case 'notes': {
      const notes = [[12, 28, 18], [94, 22, 15], [104, 70, 13], [8, 96, 14], [92, 146, 18], [24, 148, 13]];
      return (
        fillRect('#e9f1ff') +
        `<g fill="#7d94d6" font-family="sans-serif">` +
        notes.map(([x, y, s]) => `<text x="${x}" y="${y}" font-size="${s}">♪</text>`).join('') +
        `</g>`
      );
    }
    case 'hanamaru':
      return (
        fillRect('#fdfdfa') +
        `<polyline points="${hanamaruPoints()}" fill="none" stroke="#d63c2c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" transform="translate(-10 4) scale(1.4)"/>`
      );
    case 'stars':
      return (
        fillRect('#33285c') +
        [[16, 18, 6], [100, 14, 4.5], [108, 70, 5], [10, 84, 4], [20, 140, 5], [98, 140, 6.5], [60, 12, 3]].map(([x, y, r]) => sparkle(x, y, r)).join('') +
        circles([[40, 20, 1.2], [84, 30, 1], [112, 112, 1.3], [8, 116, 1.1]], '#fff')
      );
    case 'rainbow':
      return (
        fillRect('#eaf6ff') +
        ['#f2666c', '#f7a23b', '#ffd93b', '#69c56e', '#4aa3e8', '#8b6fd6']
          .map((c, i) => `<circle cx="60" cy="150" r="${112 - i * 9}" fill="none" stroke="${c}" stroke-width="9"/>`)
          .join('') +
        `<circle cx="60" cy="150" r="53.5" fill="#eaf6ff"/>`
      );
    case 'gold': {
      let rays = '';
      for (let i = 0; i < 12; i++) rays += `<path d="M60 84L${60 - 14} -40L${60 + 14} -40Z" fill="#f2d56a" transform="rotate(${i * 30} 60 84)"/>`;
      return fillRect('#f8e9ad') + rays + sparkle(16, 20, 6, '#fff') + sparkle(104, 28, 4.5, '#fff') + sparkle(102, 136, 6, '#fff') + sparkle(18, 132, 4, '#fff');
    }
    default:
      return fillRect('#fdfdfa') + `<rect x="8" y="8" width="104" height="140" rx="4" fill="none" stroke="#c5ddd3" stroke-width="1.2"/>`;
  }
}

const FRAMES = {
  plain: `<rect x="1.5" y="1.5" width="117" height="153" rx="7" fill="none" stroke="#6aa893" stroke-width="3"/>`,
  silver:
    `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#aeb8c4" stroke-width="5"/>` +
    `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#f1f4f7" stroke-width="1.2"/>`,
  gold:
    `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#d9a520" stroke-width="5"/>` +
    `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#fff3c4" stroke-width="1.2"/>`,
};

let clipSeq = 0;

/** 表向きのカードの絵 */
export function cardSvg(card: Card): string {
  const clip = `card-clip-${clipSeq++}`;
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${card.name}">` +
    `<clipPath id="${clip}"><rect width="${W}" height="${H}" rx="8"/></clipPath>` +
    `<g clip-path="url(#${clip})">${background(card.bg)}` +
    `<g transform="translate(9 37) scale(0.85)">${sparrowBody(card.look)}</g>` +
    `</g>${FRAMES[card.frame]}</svg>`
  );
}

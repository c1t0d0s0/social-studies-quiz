// 図を見て答える単元と、都道府県のちしきの単元。
// 手書きの問題 (g3.ts〜g6.ts) とちがい、地図記号・都道府県・日本地図・雨温図・国旗のデータから組み立てる。
import type { Figure, Question, Unit } from '../../core/quiz';
import type { Grade } from '../../core/snapshot';
import { CLIMATE_CITIES, type ClimateZone } from '../climate';
import { COUNTRIES, FLAG_GROUPS, REGION_NAMES, type Country, type WorldRegion } from '../countries';
import { PLACES, placeById, type Place, type PlaceGroup } from '../japan-map';
import prefQuestions from '../pref-questions.json';
import { PREFS, prefById, type Pref } from '../prefs';
import { BASIC_SYMBOLS } from '../symbols-basic';
import { SYMBOLS, type MapSymbol } from '../symbols';

/** 1 つ目に正解、そのあとにまちがいの候補をならべる (出すときに、候補から 3 つがえらばれる) */
interface Draft {
  q: string;
  figure?: Figure;
  choices: string[];
  choiceFigures?: Figure[];
  choiceNotes?: string[];
  explain: string;
}

function unit(id: string, grade: Grade, title: string, drafts: Draft[], daily: Unit['daily'] = 'extra'): Unit {
  const questions: Question[] = drafts.map((d, i) => ({ id: `${id}-${i + 1}`, ...d }));
  return { id, grade, title, questions, daily };
}

// ---- 地図記号 (3 年) ----

const symbolFigure = (id: string): Figure => ({ kind: 'symbol', id });
const symbolById = new Map(SYMBOLS.map((s) => [s.id, s]));

/**
 * 記号 1 つにつき、「記号 → 名前」と「名前 → 記号」の 2 問を作る。
 * まちがいの候補からは、形がほぼ同じ記号 (lookalike) を外す。候補どうしでも重ならないよう、同じグループからは 1 つだけ入れる。
 */
function symbolDrafts(
  pool: readonly MapSymbol[],
  text: { label: (s: MapSymbol) => string; note?: (s: MapSymbol) => string; explain: (s: MapSymbol) => string; toName: string; toSymbol: (label: string) => string },
): Draft[] {
  const drafts: Draft[] = [];
  for (const target of pool) {
    const seen = new Set<string>();
    const others = pool.filter((s) => {
      if (s.id === target.id || (s.lookalike && s.lookalike === target.lookalike)) return false;
      if (!s.lookalike) return true;
      if (seen.has(s.lookalike)) return false;
      seen.add(s.lookalike);
      return true;
    });
    const all = [target, ...others];
    const choices = all.map(text.label);
    const choiceNotes = text.note && all.map(text.note);
    const explain = text.explain(target);
    drafts.push({ q: text.toName, figure: symbolFigure(target.id), choices, choiceNotes, explain });
    drafts.push({ q: text.toSymbol(text.label(target)), choices, choiceNotes, choiceFigures: all.map((s) => symbolFigure(s.id)), explain });
  }
  return drafts;
}

const basicById = new Map(BASIC_SYMBOLS.map((b) => [b.id, b]));

const symbolBasic = unit(
  'g3-symbol',
  3,
  '地図記号(ちずきごう)を 見て 答えよう',
  symbolDrafts(
    BASIC_SYMBOLS.map((b) => symbolById.get(b.id)!),
    {
      label: (s) => basicById.get(s.id)!.label,
      explain: (s) => basicById.get(s.id)!.explain,
      toName: 'この 地図記号(ちずきごう)は、何を 表して いるでしょう。',
      toSymbol: (label) => `「${label}」を 表す 地図記号(ちずきごう)は どれでしょう。`,
    },
  ),
);

const symbolAll = unit(
  'g3-symbolx',
  3,
  '地図記号(ちずきごう) チャレンジ（全部で 134）',
  symbolDrafts(SYMBOLS, {
    label: (s) => s.name,
    note: (s) => s.kana,
    explain: (s) => `${s.name}（${s.kana}）。${s.trivia}`,
    toName: 'この 地図記号(ちずきごう)は、何を 表して いるでしょう。',
    toSymbol: (label) => `「${label}」を 表す 地図記号(ちずきごう)は どれでしょう。`,
  }),
  'none',
);

// ---- 都道府県 (4 年) ----

const prefFigure = (id: number): Figure => ({ kind: 'pref', id });
const withKana = (p: Pref) => `${p.name}(${p.kana})`;

/** まちがいの候補: 形が似ている都道府県と、同じ地方の都道府県 */
function prefRivals(target: Pref): Pref[] {
  const ids = new Set([...target.similar, ...PREFS.filter((p) => p.region === target.region).map((p) => p.id)]);
  ids.delete(target.id);
  return [...ids].map(prefById);
}

const shape = unit(
  'g4-shape',
  4,
  '都道府県の 形',
  PREFS.flatMap((target): Draft[] => {
    const all = [target, ...prefRivals(target)];
    const choices = all.map((p) => p.name);
    const explain = `${withKana(target)}は、${target.region}に あります。${target.hint}`;
    return [
      { q: 'この 形の 都道府県は どこでしょう。', figure: prefFigure(target.id), choices, explain },
      { q: `「${target.name}」の 形は どれでしょう。`, choices, choiceFigures: all.map((p) => prefFigure(p.id)), explain },
    ];
  }),
);

/** 都道府県と名前がちがう県庁所在地の読み (名前が同じ県は、問題にならないので出さない。東京都も出さない) */
const CAPITAL_KANA: Record<string, string> = {
  札幌市: 'さっぽろし',
  盛岡市: 'もりおかし',
  仙台市: 'せんだいし',
  水戸市: 'みとし',
  宇都宮市: 'うつのみやし',
  前橋市: 'まえばしし',
  横浜市: 'よこはまし',
  金沢市: 'かなざわし',
  甲府市: 'こうふし',
  名古屋市: 'なごやし',
  津市: 'つし',
  大津市: 'おおつし',
  神戸市: 'こうべし',
  松江市: 'まつえし',
  高松市: 'たかまつし',
  松山市: 'まつやまし',
  那覇市: 'なはし',
};
const capitalLabel = (p: Pref) => (CAPITAL_KANA[p.capital] ? `${p.capital}(${CAPITAL_KANA[p.capital]})` : p.capital);
/** 県庁所在地の名前が、都道府県の名前とちがう県 (埼玉県の「さいたま市」は、かなで書くのでふくめる) */
const CAPITAL_PREFS = PREFS.filter((p) => p.capital in CAPITAL_KANA || p.capital === 'さいたま市');

const capital = unit(
  'g4-capital',
  4,
  '県庁所在地(けんちょうしょざいち)',
  CAPITAL_PREFS.flatMap((target): Draft[] => {
    const others = CAPITAL_PREFS.filter((p) => p.id !== target.id);
    const office = target.id === 1 ? '道庁(どうちょう)' : '県庁(けんちょう)';
    const explain = `${withKana(target)}の ${office}は、${capitalLabel(target)}に あります。`;
    return [
      {
        q: `${target.name}の 県庁所在地(けんちょうしょざいち)は どこでしょう。`,
        choices: [target, ...others].map(capitalLabel),
        explain,
      },
      {
        q: `${capitalLabel(target)}が 県庁所在地(けんちょうしょざいち)の 都道府県は どこでしょう。`,
        choices: [target, ...others].map((p) => p.name),
        explain,
      },
      {
        q: 'この 形の 都道府県の 県庁所在地(けんちょうしょざいち)は どこでしょう。',
        figure: prefFigure(target.id),
        choices: [target, ...others].map(capitalLabel),
        explain: `この 形は ${withKana(target)}です。${explain}`,
      },
    ];
  }),
);

/** 都道府県クイズ (pref-quiz) のちしき問題。[都道府県の番号, 分類, 問題文, 解説] */
const PREF_QUESTIONS = prefQuestions as [number, string, string, string][];

function knowledge(id: string, title: string, categories: string[]): Unit {
  return unit(
    id,
    4,
    title,
    PREF_QUESTIONS.filter(([, category]) => categories.includes(category)).map(([prefId, , question, explanation]): Draft => {
      const target = prefById(prefId);
      return {
        q: question.replace(/どこ？$/, 'どこでしょう。'),
        choices: [target, ...prefRivals(target)].map((p) => p.name),
        explain: `答えは ${withKana(target)}。${explanation}`,
      };
    }),
  );
}

const goods = knowledge('g4-goods', '都道府県の 特産品(とくさんひん)', ['特産品・名物']);
const spots = knowledge('g4-spots', '都道府県の 名所', ['名所・観光地']);
const nature = knowledge('g4-nature', '都道府県の 自然と 日本一', ['自然・地理', '日本一の記録', '産業・日本一']);
const culture = knowledge('g4-culture', '都道府県の 歴史(れきし)と 文化', ['歴史・文化']);

// ---- 日本地図と雨温図 (5 年) ----

const mapFigure = (id: string): Figure => ({ kind: 'map', id });
const climateFigure = (id: string): Figure => ({ kind: 'climate', id });

/** 印の形で、問題文の「赤い ○○」を変える */
const markWord = (p: Place) => (p.marker.shape === 'line' ? '赤い 線' : p.marker.shape === 'arrow' ? '赤い 矢印' : p.marker.shape === 'area' ? '赤い 丸' : '赤い 点');

/**
 * 場所 1 つにつき、「地図 → 名前」と「名前 → 地図」の 2 問を作る。まちがいの候補は、同じなかま (平野なら平野) の場所。
 * noun は問題文に入れる、なかまの呼び方
 */
function placeDrafts(groups: [PlaceGroup, string][]): Draft[] {
  return groups.flatMap(([group, noun]) => {
    const pool = PLACES.filter((p) => p.group === group);
    return pool.flatMap((target): Draft[] => {
      const all = [target, ...pool.filter((p) => p !== target)];
      const choices = all.map((p) => p.name);
      return [
        { q: `地図の ${markWord(target)}で しめした ${noun}は どれでしょう。`, figure: mapFigure(target.id), choices, explain: `${target.name}。${target.explain}` },
        { q: `「${target.name}」を しめした 地図は どれでしょう。`, choices, choiceFigures: all.map((p) => mapFigure(p.id)), explain: `${target.name}。${target.explain}` },
      ];
    });
  });
}

const landMap = unit(
  'g5-mapland',
  5,
  '地図で 見る 山地・山脈と 平野',
  placeDrafts([
    ['山地・山脈', '山地・山脈'],
    ['平野', '平野'],
    ['盆地', '盆地(ぼんち)'],
  ]),
);

const waterMap = unit(
  'g5-mapwater',
  5,
  '地図で 見る 川・湖',
  placeDrafts([
    ['川', '川'],
    ['湖', '湖'],
  ]),
);

const coastMap = unit(
  'g5-mapcoast',
  5,
  '地図で 見る 半島・島と まわりの 海',
  placeDrafts([
    ['半島', '半島'],
    ['島', '島'],
    ['海', '海'],
    ['海流', '海流'],
  ]),
);

const industryMap = unit(
  'g5-mapindustry',
  5,
  '地図で 見る 工業地帯・工業地域',
  placeDrafts([
    ['工業地帯・地域', '工業地帯・工業地域'],
    ['工業都市', '都市'],
  ]),
);

const ZONES: ClimateZone[] = ['北海道の気候', '日本海側の気候', '太平洋側の気候', '中央高地の気候', '瀬戸内の気候', '南西諸島の気候'];
const zoneLabel = (z: ClimateZone) => z.replace('瀬戸内', '瀬戸内(せとうち)').replace('諸島', '諸島(しょとう)');

/**
 * 雨温図 1 つにつき 4 問。雨温図 → 気候 / 気候 → 雨温図 / 雨温図 → 都市 / 地図の都市 → 雨温図。
 * 雨温図の選択肢は、都市の名前を図の下に出す
 */
const rainChart = unit(
  'g5-rainchart',
  5,
  '雨温図(うおんず)と 日本の 気候',
  CLIMATE_CITIES.flatMap((target): Draft[] => {
    const all = [target, ...CLIMATE_CITIES.filter((c) => c !== target)];
    const zone = zoneLabel(target.zone);
    const explain = `${target.name}の 雨温図(うおんず)で、${zone}です。${target.feature}`;
    const cityChoices = all.map((c) => c.name);
    const charts = all.map((c) => climateFigure(c.id));
    return [
      {
        q: 'この 雨温図(うおんず)は、どの 気候の 地いきの ものでしょう。',
        figure: climateFigure(target.id),
        choices: [target.zone, ...ZONES.filter((z) => z !== target.zone)].map(zoneLabel),
        explain,
      },
      { q: `「${zone}」の 都市の 雨温図(うおんず)は どれでしょう。`, choices: cityChoices, choiceFigures: charts, explain },
      { q: 'この 雨温図(うおんず)は、どの 都市の ものでしょう。', figure: climateFigure(target.id), choices: cityChoices, explain },
      {
        q: '地図の 赤い 点の 都市の 雨温図(うおんず)は どれでしょう。',
        figure: mapFigure(placeById(target.id)!.id),
        choices: cityChoices,
        choiceFigures: charts,
        explain,
      },
    ];
  }),
);

// ---- 国旗 (6 年) ----

const flagFigure = (code: string): Figure => ({ kind: 'flag', code });
const flagGroupOf = (code: string) => FLAG_GROUPS.find((g) => g.includes(code));

/**
 * 国 1 つにつき、「国旗 → 国名」と「国名 → 国旗」の 2 問を作る。まちがいの候補は rivals(国) の中から。
 * 図柄が同じ旗 (フランスと海外県、インドネシアとモナコなど) は候補から外し、候補どうしでも重ならないようにする。
 */
function flagDrafts(pool: readonly Country[], rivals: (target: Country) => readonly Country[], noun: string): Draft[] {
  return pool.flatMap((target): Draft[] => {
    const mine = flagGroupOf(target.code);
    const seen = new Set<readonly string[]>();
    const others = rivals(target).filter((c) => {
      if (c.code === target.code) return false;
      const group = flagGroupOf(c.code);
      if (!group) return true;
      if (group === mine || seen.has(group)) return false;
      seen.add(group);
      return true;
    });
    const all = [target, ...others];
    const choices = all.map((c) => c.name);
    const where = target.region === 'other' ? '' : `${REGION_NAMES[target.region]}の`;
    const explain = `${target.name}は、${where}${target.un ? '国' : '国や地域の一つ'}です。`;
    return [
      { q: `この国旗は、どこの${noun}のものでしょう。`, figure: flagFigure(target.code), choices, explain },
      { q: `「${target.name}」の国旗はどれでしょう。`, choices, choiceFigures: all.map((c) => flagFigure(c.code)), explain },
    ];
  });
}

const UN = COUNTRIES.filter((c) => c.un);

function flagRegion(id: string, region: WorldRegion): Unit {
  const pool = UN.filter((c) => c.region === region);
  return unit(id, 6, `国旗 ${REGION_NAMES[region]}`, flagDrafts(pool, () => pool, '国'));
}

const flagAll = unit(
  'g6-flagx',
  6,
  '国旗チャレンジ（全部で 250）',
  // 地域の旗は、同じ地域の国や地域とならべる。南極などは、全部の中から
  flagDrafts(COUNTRIES, (target) => (target.region === 'other' ? COUNTRIES : COUNTRIES.filter((c) => c.region === target.region)), '国や地域'),
  'none',
);

export const FIGURE_UNITS: Unit[] = [
  symbolBasic,
  symbolAll,
  shape,
  capital,
  goods,
  spots,
  nature,
  culture,
  landMap,
  waterMap,
  coastMap,
  industryMap,
  rainChart,
  flagRegion('g6-flagasia', 'asia'),
  flagRegion('g6-flageurope', 'europe'),
  flagRegion('g6-flagafrica', 'africa'),
  flagRegion('g6-flagamericas', 'americas'),
  flagRegion('g6-flagoceania', 'oceania'),
  flagAll,
];

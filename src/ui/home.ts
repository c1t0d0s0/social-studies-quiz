import { jstDate } from '../core/date';
import { dailyQuiz, unitQuiz, unitQuizId, type Unit } from '../core/quiz';
import { currentRun } from '../core/rewards';
import { GRADES, type Grade } from '../core/snapshot';
import { balance, getGrade, getSound, getStamps, pruneOldDaily, setGrade, setSound, statusOf, unitRound } from '../core/storage';
import { UNITS, unitsOf } from '../data/units';
import { accountBox } from './account';
import { h, hanamaru, withRuby } from './dom';
import { sparrow } from './sparrow';
import { T } from './text';

/** 右の列を出す画面のはば (styles.css の .home と同じ値) */
const WIDE = '(min-width: 64rem)';

function gradeSwitch(root: HTMLElement, current: Grade): HTMLElement {
  return h(
    'div',
    { class: 'mode', role: 'group', 'aria-label': T.gradeSwitch },
    ...GRADES.map((grade) =>
      h(
        'button',
        {
          type: 'button',
          class: 'mode-option',
          'aria-pressed': String(grade === current),
          onclick: () => {
            if (grade === current) return;
            setGrade(grade);
            renderHome(root);
          },
        },
        h('span', { class: 'mode-label' }, T.grade(grade)),
      ),
    ),
  );
}

/** 効果音を鳴らすかどうかの切りかえ */
function soundSwitch(): HTMLElement {
  const btn = h('button', { type: 'button', class: 'btn sound-switch' });
  const paint = () => {
    const on = getSound();
    btn.textContent = on ? T.soundOn : T.soundOff;
    btn.setAttribute('aria-pressed', String(on));
  };
  btn.addEventListener('click', () => {
    setSound(!getSound());
    paint();
  });
  paint();
  return h('p', { class: 'settings' }, btn);
}

function unitTile(unit: Unit, index: number): HTMLElement {
  const status = statusOf(unitQuiz(unit, unitRound(unitQuizId(unit.id))));
  return h(
    'a',
    { class: `unit unit-${status}`, href: `#/unit/${unit.id}` },
    h('span', { class: 'unit-num', 'aria-hidden': 'true' }, String(index + 1)),
    withRuby('span', 'unit-title', unit.title),
    status === 'new'
      ? h('span', { class: 'unit-meta' }, unit.daily === 'none' ? h('b', { class: 'unit-hard' }, T.challengeMark) : null, T.count(unit.questions.length))
      : h('span', { class: 'unit-meta unit-status' }, status === 'done' ? T.cleared : T.playing),
    status === 'done' ? hanamaru('hanamaru hanamaru-small') : null,
  );
}

/**
 * 出題される分野 (この学年の単元)。今日のチャレンジに出る単元に色をつける。
 * 図やちしきの単元のように、1 つの単元から何問か出るときは、問題の数もそえる。
 */
function fieldsPanel(core: Unit[], extra: Unit[], todays: Map<string, number>): HTMLElement {
  const chip = (unit: Unit): HTMLElement => {
    const count = todays.get(unit.id) ?? 0;
    // ふりがなつきの名前は 1 つの要素にまとめる (ばらばらだと、チップの中で字の間があいてしまう)
    const name = withRuby('span', '', unit.title);
    if (count === 0) return h('li', { class: 'field-chip field-chip-off' }, name);
    return h(
      'li',
      { class: 'field-chip field-chip-today' },
      name,
      count > 1 ? h('span', { class: 'field-chip-count' }, T.fieldCount(count)) : null,
      h('span', { class: 'visually-hidden' }, T.fieldToday),
    );
  };
  const group = (title: string, units: Unit[]) =>
    units.length > 0 ? h('div', { class: 'field-group' }, h('h3', { class: 'field-title' }, title), h('ul', { class: 'field-chips' }, ...units.map(chip))) : null;
  return h(
    'section',
    { class: 'fields', 'aria-labelledby': 'fields-title' },
    h('h2', { id: 'fields-title' }, T.fieldsTitle),
    h('p', { class: 'fields-note' }, h('span', { class: 'field-chip field-chip-today' }, T.fieldColored), T.fieldsNote),
    group(T.fieldsCore, core),
    // チャレンジ単元は今日のチャレンジに出ないので、ここにはならべない
    group(T.fieldsExtra, extra.filter((u) => u.daily === 'extra')),
  );
}

export function renderHome(root: HTMLElement): void {
  const grade = getGrade();
  const today = jstDate();
  pruneOldDaily(today);
  const daily = dailyQuiz(UNITS, grade, today);
  const dailyStatus = statusOf(daily);
  // 今日のチャレンジに、どの単元から何問出るか
  const todays = new Map<string, number>();
  for (const item of daily.items) todays.set(item.unit.id, (todays.get(item.unit.id) ?? 0) + 1);
  const run = currentRun(getStamps(), today);
  const dailyAction = { new: T.start, playing: T.resume, done: T.review }[dailyStatus];
  const d = new Date(`${today}T00:00:00Z`);
  const core = unitsOf(grade).filter((u) => !u.daily);
  const extra = unitsOf(grade).filter((u) => u.daily);

  root.replaceChildren(
    h(
      'main',
      { class: 'home' },
      h(
        'div',
        { class: 'home-main' },
        h(
          'header',
          { class: 'hero' },
          sparrow(),
          h('div', { class: 'hero-text' }, h('h1', { class: 'brand' }, T.brand), h('p', { class: 'lead' }, T.lead)),
        ),
        gradeSwitch(root, grade),
        h(
          'section',
          { class: 'daily', 'aria-labelledby': 'daily-title' },
          h(
            'div',
            { class: 'daily-text' },
            h('h2', { id: 'daily-title' }, `${T.daily}（${T.grade(grade)}）`),
            h('p', { class: 'daily-date' }, T.dateLabel(d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCDay())),
            h('p', { class: 'daily-note' }, T.dailyNote(dailyStatus === 'done', run)),
          ),
          dailyStatus === 'done' ? hanamaru('hanamaru hanamaru-daily') : null,
          h('a', { class: 'btn btn-primary', href: `#/daily/${grade}` }, dailyAction),
        ),
        // スタンプカードとスズメカードは、それぞれのページで見る
        h(
          'nav',
          { class: 'reward-links', 'aria-label': T.rewardLinks },
          h('p', { class: 'points' }, h('span', { class: 'points-label' }, T.pointsLabel), h('b', { class: 'points-num' }, T.points(balance()))),
          h(
            'div',
            { class: 'reward-buttons' },
            h('a', { class: 'btn', href: '#/stamps' }, T.stampTitle),
            h('a', { class: 'btn', href: '#/cards' }, T.cardsTitle),
          ),
        ),
        h(
          'section',
          { 'aria-labelledby': 'units-title' },
          h('h2', { id: 'units-title' }, T.units(grade)),
          h('p', { class: 'section-note' }, T.unitsNote),
          h('div', { class: 'units' }, ...core.map((u, i) => unitTile(u, i))),
        ),
        // 図を見て答える単元と、都道府県のちしきの単元 (ない学年もある)
        extra.length > 0
          ? h(
              'section',
              { 'aria-labelledby': 'figure-title' },
              h('h2', { id: 'figure-title' }, T.figureUnits),
              withRuby('p', 'section-note', T.figureUnitsNote),
              h('div', { class: 'units' }, ...extra.map((u, i) => unitTile(u, core.length + i))),
            )
          : null,
        h(
          'section',
          { 'aria-labelledby': 'zukan-title' },
          h('h2', { id: 'zukan-title' }, T.zukanTitle),
          h('p', { class: 'section-note' }, T.zukanNote),
          h(
            'div',
            { class: 'zukan-links' },
            ...(Object.keys(T.zukan) as (keyof typeof T.zukan)[]).map((k) => {
              const link = withRuby('a', 'btn', T.zukan[k]);
              link.setAttribute('href', `#/zukan/${k}`);
              return link;
            }),
          ),
        ),
      ),
      // 記録の保存・出題される分野・あそびかた・音。広い画面では右の列にならべ、スクロールしなくても見えるようにする
      h(
        'aside',
        { class: 'home-side' },
        accountBox(T),
        fieldsPanel(core, extra, todays),
        h(
          'details',
          // 広い画面では場所があるので、はじめから開いておく
          { class: 'howto', open: matchMedia(WIDE).matches },
          h('summary', {}, T.howto),
          h('ul', {}, ...T.howtoItems.map((item) => h('li', {}, item))),
        ),
        soundSwitch(),
      ),
    ),
  );
}

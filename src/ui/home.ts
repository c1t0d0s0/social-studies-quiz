import { jstDate } from '../core/date';
import { dailyQuiz, unitQuiz, type Unit } from '../core/quiz';
import { currentRun } from '../core/rewards';
import { GRADES, type Grade } from '../core/snapshot';
import { balance, getGrade, getSound, getStamps, pruneOldDaily, setGrade, setSound, statusOf } from '../core/storage';
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

function unitTile(unit: Unit, index: number, today: string): HTMLElement {
  const status = statusOf(unitQuiz(unit, today));
  return h(
    'a',
    { class: `unit unit-${status}`, href: `#/unit/${unit.id}` },
    h('span', { class: 'unit-num', 'aria-hidden': 'true' }, String(index + 1)),
    withRuby('span', 'unit-title', unit.title),
    status === 'new'
      ? h('span', { class: 'unit-meta' }, T.count(unit.questions.length))
      : h('span', { class: 'unit-meta unit-status' }, status === 'done' ? T.cleared : T.playing),
    status === 'done' ? hanamaru('hanamaru hanamaru-small') : null,
  );
}

export function renderHome(root: HTMLElement): void {
  const grade = getGrade();
  const today = jstDate();
  pruneOldDaily(today);
  const dailyStatus = statusOf(dailyQuiz(UNITS, grade, today));
  const run = currentRun(getStamps(), today);
  const dailyAction = { new: T.start, playing: T.resume, done: T.review }[dailyStatus];
  const d = new Date(`${today}T00:00:00Z`);

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
          h('div', { class: 'units' }, ...unitsOf(grade).map((u, i) => unitTile(u, i, today))),
        ),
      ),
      // あそびかた・音・記録の保存。広い画面では右の列にならべ、スクロールしなくても見えるようにする
      h(
        'aside',
        { class: 'home-side' },
        accountBox(T),
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

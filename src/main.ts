import './styles.css';
import { restoreStore, startCloud } from './cloud';
import { jstDate } from './core/date';
import { dailyQuiz, unitQuiz } from './core/quiz';
import { isGrade } from './core/snapshot';
import { UNITS, unitById } from './data/units';
import { renderCards } from './ui/cards';
import { renderHome } from './ui/home';
import { renderQuiz } from './ui/quiz';
import { renderStamps } from './ui/stamps';
import { T } from './ui/text';

// 前にログインしていた人がいれば、通信を待たずに、この端末に残っているその人の写しで画面を出す
restoreStore();

const app = document.getElementById('app')!;
let cleanup: (() => void) | null = null;

function route(): void {
  cleanup?.();
  cleanup = null;

  // #/daily/5 は 5 年生の今日のチャレンジ、#/unit/g5-rice は単元の練習
  const today = jstDate();
  const daily = location.hash.match(/^#\/daily\/(\d)$/);
  const grade = Number(daily?.[1]);
  const unit = unitById(location.hash.match(/^#\/unit\/([a-z0-9-]+)$/)?.[1] ?? '');
  if (daily && isGrade(grade)) {
    cleanup = renderQuiz(app, dailyQuiz(UNITS, grade, today), `${T.daily}（${T.grade(grade)}）`, today);
  } else if (unit) {
    cleanup = renderQuiz(app, unitQuiz(unit, today), unit.title, today);
  } else if (location.hash === '#/cards') {
    renderCards(app);
  } else if (location.hash === '#/stamps') {
    renderStamps(app);
  } else {
    renderHome(app);
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

// 最初の画面を出してから、ログインと Firestore の準備をする (Firebase の設定がないビルドでは何もしない)
void startCloud({
  // ログインやほぞんの状態が変わった。状態を出しているのはタイトル画面だけ
  onStatus: () => {
    if (app.querySelector('.home')) renderHome(app);
  },
  // Firestore から取りこんで、手元の記録が変わった。今の画面をかき直す
  onData: route,
  askMigrate: () => confirm(T.askMigrate),
});

import { countCorrect, type Quiz, type QuizItem } from '../core/quiz';
import { UNIT_PASS, type StampReward } from '../core/rewards';
import { addClear, addStamp, balance, loadProgress, saveProgress, type Progress } from '../core/storage';
import { h, hanamaru, homeButton, withRuby } from './dom';
import { playChirp, playCorrect, playWrong, primeSound } from './sound';
import { T } from './text';

const MARKS = ['1', '2', '3', '4'];

/** 今回のクイズでもらえたもの (終えた直後にだけ出す) */
interface Reward {
  clearPoints: number;
  stamp?: StampReward;
}

/**
 * クイズの画面。1 問ずつ出し、答えるたびに正解と解説を見せる。
 * today をわたすと「今日のチャレンジ」としてあつかい、終えたときにスタンプを押す。
 * もどり値は、ほかの画面に移るときによぶ後かたづけ。
 */
export function renderQuiz(root: HTMLElement, quiz: Quiz, title: string, today: string): () => void {
  let progress = loadProgress(quiz);
  let onKey: ((ev: KeyboardEvent) => void) | null = null;
  const total = quiz.items.length;

  const frame = (meta: string, ...body: (Node | null)[]) =>
    root.replaceChildren(
      h(
        'div',
        { class: 'quiz' },
        h('header', { class: 'bar' }, homeButton(T.goHome), withRuby('h1', '', title), h('span', { class: 'bar-meta' }, meta)),
        h('main', { class: 'quiz-main' }, ...body),
      ),
    );

  function showQuestion(): void {
    const index = progress.answers.length;
    const item = quiz.items[index];
    const feedback = h('div', { class: 'quiz-feedback', role: 'status' });
    const buttons = item.choices.map((choice, i) => {
      const btn = h(
        'button',
        { type: 'button', class: 'choice', onclick: () => answer(i) },
        h('span', { class: 'choice-mark', 'aria-hidden': 'true' }, MARKS[i]),
        withRuby('span', 'choice-text', choice),
      );
      return btn;
    });
    let answered = false;

    function answer(picked: number): void {
      if (answered) return;
      answered = true;
      primeSound();
      const ok = picked === item.answer;
      progress = { ...progress, answers: [...progress.answers, picked] };
      saveProgress(quiz.id, progress);
      buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === item.answer) btn.classList.add('is-correct');
        else if (i === picked) btn.classList.add('is-wrong');
      });
      if (ok) playCorrect();
      else playWrong();
      const last = progress.answers.length === total;
      const next = h('button', { type: 'button', class: 'btn btn-primary quiz-next', onclick: () => (last ? finish() : showQuestion()) }, last ? T.finish : T.next);
      feedback.classList.add(ok ? 'is-ok' : 'is-ng');
      feedback.replaceChildren(h('p', { class: 'quiz-judge' }, ok ? T.correct : T.wrong));
      if (!ok) feedback.append(withRuby('p', 'quiz-answer', `${T.answerIs}${item.choices[item.answer]}`));
      feedback.append(withRuby('p', 'quiz-explain', item.question.explain), next);
      next.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    onKey = (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const n = MARKS.indexOf(ev.key);
      if (n >= 0 && n < buttons.length) answer(n);
    };

    frame(
      T.progress(index + 1, total),
      h('div', { class: 'quiz-meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(index / total) * 100}%` })),
      h(
        'section',
        { class: 'quiz-card' },
        h('p', { class: 'quiz-label' }, h('b', {}, T.questionLabel(index + 1)), withRuby('span', 'quiz-unit', item.unit.title)),
        withRuby('h2', 'quiz-q', item.question.q),
      ),
      h('div', { class: 'choices' }, ...buttons),
      feedback,
    );
    window.scrollTo(0, 0);
  }

  /** さいごの問題に答えた。記録をつけて、けっかを見せる */
  function finish(): void {
    progress = { ...progress, done: true };
    saveProgress(quiz.id, progress);
    const reward: Reward = { clearPoints: 0 };
    if (quiz.kind === 'daily') {
      // 今日のチャレンジは、さいごまでやればクリア (何問正解でも)
      reward.clearPoints = addClear(quiz.id);
      reward.stamp = addStamp(today);
    } else if (countCorrect(quiz, progress.answers) >= UNIT_PASS) {
      reward.clearPoints = addClear(quiz.id);
    }
    playChirp(reward.clearPoints > 0 || reward.stamp?.added ? 3 : 1);
    showResult(reward);
  }

  function reviewItem(item: QuizItem, picked: number, n: number): HTMLElement {
    const ok = picked === item.answer;
    return h(
      'li',
      { class: ok ? 'review is-ok' : 'review is-ng' },
      h('p', { class: 'review-head' }, h('span', { class: 'review-mark', 'aria-label': ok ? T.correct : T.wrong }, ok ? '○' : '×'), h('b', {}, T.questionLabel(n))),
      withRuby('p', 'review-q', item.question.q),
      withRuby('p', 'review-answer', `${T.answerIs}${item.choices[item.answer]}`),
      ok ? null : withRuby('p', 'review-picked', `${T.yourAnswer}${item.choices[picked]}`),
      withRuby('p', 'review-explain', item.question.explain),
    );
  }

  function showResult(reward?: Reward): void {
    onKey = null;
    const correct = countCorrect(quiz, progress.answers);
    const passed = quiz.kind === 'daily' || correct >= UNIT_PASS;
    const message = correct === total ? T.resultPerfect : quiz.kind === 'daily' ? T.resultDaily : passed ? T.resultGood : T.resultTry;

    // 今回もらえたポイントと、今日のチャレンジのスタンプを知らせる
    const stamp = reward?.stamp?.added ? reward.stamp : undefined;
    const gained = (reward?.clearPoints ?? 0) + (stamp ? stamp.weekPoints + stamp.monthPoints : 0);
    const rewardBox =
      gained > 0 || stamp
        ? h(
            'div',
            { class: 'result-stamp' },
            reward && reward.clearPoints > 0 ? h('p', { class: 'result-reward' }, T.rewardClear(reward.clearPoints)) : null,
            stamp ? h('p', { class: 'result-stamp-title' }, T.stampDone) : null,
            stamp && stamp.weekPoints > 0 ? h('p', { class: 'result-reward' }, T.rewardWeek(stamp.run)) : null,
            stamp && stamp.monthPoints > 0 ? h('p', { class: 'result-reward' }, T.rewardMonth(Number(today.slice(5, 7)))) : null,
            gained > 0 ? h('p', { class: 'result-balance' }, `${T.pointsLabel} ${T.points(balance())}`) : null,
            // 今日のチャレンジのあとは、スタンプがたまった様子を見られるスタンプカードへ案内する
            stamp ? h('a', { class: 'btn', href: '#/stamps' }, T.seeStamps) : h('a', { class: 'btn', href: '#/cards' }, T.seeCards),
          )
        : null;

    const retry = (): void => {
      const fresh: Progress = { sig: quiz.sig, answers: [], done: false };
      progress = fresh;
      saveProgress(quiz.id, fresh);
      showQuestion();
    };

    frame(
      T.progress(correct, total),
      h(
        'section',
        { class: 'quiz-result' },
        h(
          'div',
          { class: 'result-head' },
          passed && reward ? hanamaru() : null,
          h('div', {}, h('h2', {}, T.resultScore(correct, total)), h('p', { class: 'result-sub' }, message)),
        ),
        rewardBox,
      ),
      h('h2', { class: 'review-title' }, T.reviewTitle),
      h('ol', { class: 'review-list' }, ...quiz.items.map((item, i) => reviewItem(item, progress.answers[i], i + 1))),
      h(
        'div',
        { class: 'result-actions' },
        // 今日のチャレンジは 1 日 1 回。単元の練習は何回でもやりなおせる
        quiz.kind === 'unit' ? h('button', { type: 'button', class: 'btn', onclick: retry }, T.retry) : null,
        h('a', { class: 'btn btn-primary', href: '#/' }, T.goHome),
      ),
    );
    window.scrollTo(0, 0);
  }

  const keydown = (ev: KeyboardEvent) => onKey?.(ev);
  document.addEventListener('keydown', keydown);
  if (progress.done || progress.answers.length >= total) showResult();
  else showQuestion();
  return () => document.removeEventListener('keydown', keydown);
}

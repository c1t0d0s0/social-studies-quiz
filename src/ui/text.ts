import { CLEAR_POINTS, MONTH_POINTS, QUIZ_LENGTH, UNIT_PASS, WEEK_LENGTH, WEEK_POINTS } from '../core/rewards';
import type { Grade } from '../core/snapshot';

const pt = (n: number) => `${n.toLocaleString('ja-JP')}pt`;

/** 画面の文言。3 年生でも読めるよう、3 年生までに習う漢字だけを使い、分かち書きにする */
export const T = {
  brand: 'スズメの 社会クイズ',
  lead: '小学 3〜6年生の 社会を、クイズで 楽しく 学ぼう。',
  gradeSwitch: '学年の 切りかえ',
  grade: (g: Grade) => `${g}年生`,
  daily: '今日の チャレンジ',
  dateLabel: (m: number, d: number, w: number) => `${m}月${d}日（${'日月火水木金土'[w]}）`,
  dailyNote: (done: boolean, run: number) =>
    done
      ? run > 1
        ? `クリアずみ。${run}日 つづいて いるよ。`
        : 'クリアずみ。あしたも 新しい 問題が 出るよ。'
      : run > 0
        ? `${run}日 つづけて クリア中。今日も やって みよう。`
        : `毎日 ${QUIZ_LENGTH}問。${QUIZ_LENGTH}問 答えると スタンプを 1こ おせるよ。`,
  start: 'はじめる',
  resume: 'つづきから',
  review: 'けっかを 見る',
  units: (g: Grade) => `${g}年生で 学ぶ こと`,
  figureUnits: '図や ちしきの クイズ',
  figureUnitsNote: '地図記号(ちずきごう)・都道府県・国旗の クイズ。図を 見て 答える 問題も あるよ。',
  challengeMark: 'むずかしい',
  choiceNumber: (n: number) => `${n}番の 図`,
  zukanTitle: 'ずかん',
  zukanNote: '図と 名前を 一らんで 見られるよ。',
  zukan: { symbols: '地図記号(ちずきごう)ずかん', prefs: '都道府県ずかん', flags: '国旗ずかん' },
  zukanAll: 'ぜんぶ',
  zukanCount: (n: number) => `${n}こ`,
  zukanCapital: '県庁所在地(けんちょうしょざいち)：',
  seeZukan: 'ずかんを 見る',
  unitsNote: `${QUIZ_LENGTH}問中 ${UNIT_PASS}問 正かいで クリア（${CLEAR_POINTS}pt）。やる たびに ちがう 問題が 出るよ。`,
  playing: 'とちゅう',
  cleared: 'クリア',
  count: (n: number) => `${n}問`,
  howto: 'あそびかた',
  howtoItems: [
    '学年を えらんで、「今日の チャレンジ」か、学びたい ところを えらびます。',
    '問題を 読んで、4つの 中から 答えを 1つ えらびます。',
    '答えると、正しい 答えと せつ明が 出ます。まちがえても 大じょうぶ。読んで おぼえよう。',
    `「今日の チャレンジ」を さいごまで やると、スタンプと ${CLEAR_POINTS}pt が もらえます。`,
    'ポイントを ためると、スズメの カードと 交かん できます。',
    'パソコンでは、数字の 1〜4 の キーでも 答えられます。',
  ],
  unitTitle: (title: string) => title,
  progress: (n: number, total: number) => `${n} / ${total}`,
  questionLabel: (n: number) => `第${n}問`,
  correct: '正かい！',
  wrong: 'ざんねん…',
  answerIs: '答え：',
  next: 'つぎへ',
  finish: 'けっかを 見る',
  resultScore: (n: number, total: number) => `${total}問中 ${n}問 正かい`,
  resultPerfect: '全問 正かい！ すごい！',
  resultGood: 'よく できました',
  resultTry: 'もう少し！ せつ明を 読んで、もう一回 ちょうせん しよう。',
  resultDaily: 'おつかれさま。まちがえた 問題を 見直そう。',
  reviewTitle: 'ふりかえり',
  yourAnswer: 'えらんだ 答え：',
  retry: `つぎの ${QUIZ_LENGTH}問に ちょうせん`,
  goHome: 'ホームに もどる',
  // スタンプカード・ポイント・スズメカード
  stampTitle: 'スタンプカード',
  stampMonth: (month: number) => `${month}月`,
  stampDayLabel: (day: number, stamped: boolean) => `${day}日${stamped ? ' スタンプあり' : ''}`,
  stampRun: (run: number, left: number) =>
    run > 0 ? `${run}日 つづいて いるよ。あと ${left}日で ${pt(WEEK_POINTS)}。` : '今日の チャレンジを やると、スタンプを 1こ おせるよ。',
  stampRule: `クイズを 1つ クリアすると ${CLEAR_POINTS}pt。今日の チャレンジを ${WEEK_LENGTH}日 つづける たびに ${pt(WEEK_POINTS)}、1日から 月の さいごの 日まで 全部 そろうと、さらに ${pt(MONTH_POINTS)}。`,
  stampDone: 'スタンプを おしたよ',
  rewardClear: (points: number) => `クリア！ +${points}pt`,
  rewardWeek: (run: number) => `${run}日 つづいた！ +${pt(WEEK_POINTS)}`,
  rewardMonth: (month: number) => `${month}月の スタンプが 全部 そろった！ +${pt(MONTH_POINTS)}`,
  points: pt,
  pointsLabel: '持っている ポイント',
  seeCards: 'カードを 見る',
  seeStamps: 'スタンプカードを 見る',
  rewardLinks: 'スタンプカードと スズメカード',
  soundOn: '音：オン',
  soundOff: '音：オフ',
  // ログインと記録の保存 (ログインは保護者がすることも多いが、文は子どもにも読める表記にする)
  accountTitle: 'きろくの ほぞん',
  accountNote: 'Googleで ログインすると、ほかの ブラウザや たんまつでも 同じ きろくで 遊べます。ログインしなくても 遊べます。',
  signIn: 'Googleで ログイン',
  signedIn: 'ログイン中',
  signOut: 'ログアウト',
  syncLoading: 'たしかめています…',
  syncSaving: 'ほぞん中…',
  syncSaved: 'ほぞんずみ',
  syncOffline: 'まだ ほぞんできていません。つながったら ほぞんします。',
  askMigrate:
    'この たんまつの きろくを アカウントに うつしますか？\n\n「OK」… うつす (アカウントの きろくと 合わせます)\n「キャンセル」… うつさない (たんまつの きろくは そのまま のこります)',
  signOutUnsynced: 'まだ ほぞんできていない きろくが あります。今 ログアウトすると、その分は なくなります。ログアウトしますか？',
  signInFailed: 'ログインできませんでした。もういちど ためしてください。',
  cardsTitle: 'スズメカード',
  cardsLead: 'ポイントを ためて、スズメの カードを 集めよう。',
  cardsOwned: (n: number, total: number) => `${n} / ${total}まい`,
  cardGet: 'ゲットする',
  cardShort: (n: number) => `あと ${pt(n)}`,
  cardConfirm: (price: number) => `${pt(price)}を 使って、この カードを ゲットしますか？`,
  cardBackLabel: (price: number) => `まだ 持っていない カード。${pt(price)}で ゲットできる`,
};

export type Text = typeof T;

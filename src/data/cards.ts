/** スズメの絵柄の指定。指定しない項目は、タイトル画面のスズメと同じになる */
export interface Look {
  fur?: string;
  light?: string;
  wing?: string;
  /** 目に色をつける (夜のスズメなど) */
  eyeColor?: string;
  eyes?: 'open' | 'wink' | 'sleep' | 'happy' | 'sparkle' | 'brave';
  /** くちばし。何も書かなければとじている */
  mouth?: 'open';
  items?: Item[];
}

export type Item =
  | 'ribbon'
  | 'glasses'
  | 'pencil'
  | 'hat'
  | 'scarf'
  | 'flower'
  | 'book'
  | 'headband'
  | 'headphones'
  | 'cap'
  | 'wizard'
  | 'crown'
  | 'zzz';

export type Background =
  | 'paper'
  | 'dots'
  | 'grid'
  | 'night'
  | 'pink'
  | 'sky'
  | 'snow'
  | 'sakura'
  | 'notes'
  | 'hanamaru'
  | 'stars'
  | 'rainbow'
  | 'gold';

export interface Card {
  id: string;
  /** 3 年生でも読めるよう、漢字は 3 年生までに習うものだけ */
  name: string;
  price: number;
  look: Look;
  bg: Background;
  frame: 'plain' | 'silver' | 'gold';
}

/**
 * 値段の安い順。合計は 28,420pt。次のようになるように決めてある (tests/rewards.test.ts で確かめている)。
 * - 今日のチャレンジを毎日 1 つクリアする人が、はじめの 5 枚を 2 週間以内に手に入れられる
 *   (1 日 20pt と、7 日つづくたびの 1000pt で、2・6・7・7・14 日目に買える)
 * - そのあとは、1 枚ごとに少しずつ時間がかかる
 * - 全部集めるには、少なくとも 3 か月ほどの連続プレイがいる
 * 値段を変えるときは、合計がこの条件から外れないように気をつけること。
 */
export const CARDS: Card[] = [
  { id: 'c01', name: 'スズメ', price: 40, look: {}, bg: 'paper', frame: 'plain' },
  { id: 'c02', name: 'ウインク スズメ', price: 80, look: { eyes: 'wink' }, bg: 'dots', frame: 'plain' },
  { id: 'c03', name: 'ねむねむ スズメ', price: 300, look: { eyes: 'sleep', items: ['zzz'] }, bg: 'night', frame: 'plain' },
  { id: 'c04', name: 'にこにこ スズメ', price: 500, look: { eyes: 'happy', mouth: 'open' }, bg: 'pink', frame: 'plain' },
  { id: 'c05', name: 'リボンの スズメ', price: 800, look: { items: ['ribbon'], fur: '#c98a4e' }, bg: 'dots', frame: 'plain' },
  { id: 'c06', name: 'めがねの スズメ', price: 1000, look: { items: ['glasses'] }, bg: 'grid', frame: 'plain' },
  { id: 'c07', name: 'えんぴつ スズメ', price: 1100, look: { items: ['pencil'], eyes: 'brave' }, bg: 'grid', frame: 'plain' },
  { id: 'c08', name: 'ぼうしの スズメ', price: 1200, look: { items: ['hat'], mouth: 'open', eyes: 'happy' }, bg: 'sky', frame: 'plain' },
  { id: 'c09', name: 'マフラーの スズメ', price: 1300, look: { items: ['scarf'], fur: '#a8683a' }, bg: 'snow', frame: 'plain' },
  { id: 'c10', name: '花の スズメ', price: 1400, look: { items: ['flower'], eyes: 'wink', fur: '#c98a4e' }, bg: 'sakura', frame: 'plain' },
  { id: 'c11', name: '本を 読む スズメ', price: 1500, look: { items: ['glasses', 'book'] }, bg: 'paper', frame: 'silver' },
  { id: 'c12', name: 'はちまき スズメ', price: 1600, look: { items: ['headband'], eyes: 'brave', mouth: 'open' }, bg: 'hanamaru', frame: 'silver' },
  { id: 'c13', name: '雪の スズメ', price: 1700, look: { fur: '#f3f1ea', light: '#ffffff', wing: '#d9d6cc', items: ['scarf'] }, bg: 'snow', frame: 'silver' },
  { id: 'c14', name: '夜の スズメ', price: 1800, look: { fur: '#6a6f96', light: '#d9dcf0', wing: '#4c5078', eyeColor: '#ffd94a' }, bg: 'night', frame: 'silver' },
  { id: 'c15', name: '音楽の スズメ', price: 1900, look: { items: ['headphones'], eyes: 'happy', mouth: 'open' }, bg: 'notes', frame: 'silver' },
  { id: 'c16', name: 'やきゅう スズメ', price: 2000, look: { items: ['cap'], eyes: 'brave', fur: '#a8683a' }, bg: 'sky', frame: 'silver' },
  { id: 'c17', name: 'はなまる スズメ', price: 2200, look: { eyes: 'sparkle', mouth: 'open', items: ['pencil'] }, bg: 'hanamaru', frame: 'gold' },
  { id: 'c18', name: 'まほうの スズメ', price: 2400, look: { items: ['wizard'], eyes: 'sparkle', fur: '#b59ce0', light: '#f6f0ff', wing: '#8f74c4' }, bg: 'stars', frame: 'gold' },
  { id: 'c19', name: 'にじの スズメ', price: 2600, look: { eyes: 'sparkle', mouth: 'open', fur: '#e0a955', wing: '#b97f33', items: ['flower'] }, bg: 'rainbow', frame: 'gold' },
  { id: 'c20', name: '王様の スズメ', price: 3000, look: { items: ['crown'], eyes: 'sparkle', fur: '#e3b24a', wing: '#b98523' }, bg: 'gold', frame: 'gold' },
];

import { getSound } from '../core/storage';

// 効果音は音声ファイルを使わず、その場で合成する (Web Audio API)
type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/**
 * 音を出す準備をする。音がオフのときや、音を出せない環境では null。
 * ブラウザは操作のあとでしか音を出させないので、ボタンをおした流れの中でよぶこと。
 */
function audio(): AudioContext | null {
  if (!getSound()) return null;
  try {
    if (!ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * 音を出せる状態にしておく。答えをえらんだ操作の中でよぶ。
 * (iPhone などは、操作の中で準備しておかないと、あとから鳴らす音が出ない)
 */
export function primeSound(): void {
  audio();
}

function tone(freq: number, start: number, length: number, volume: number, type: OscillatorType = 'sine'): void {
  const ac = audio();
  if (!ac || !master) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

/** 正解の「ピンポン」 */
export function playCorrect(): void {
  tone(880, 0, 0.18, 0.22);
  tone(1174.66, 0.12, 0.4, 0.22);
}

/** まちがいの「ブブッ」 */
export function playWrong(): void {
  tone(196, 0, 0.14, 0.16, 'square');
  tone(155.56, 0.16, 0.26, 0.16, 'square');
}

/** スズメの「チュン」。クイズを終えたときに鳴らす */
export function playChirp(times = 2): void {
  const ac = audio();
  if (!ac || !master) return;
  for (let i = 0; i < times; i++) {
    const t = ac.currentTime + i * 0.17;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3400, t);
    osc.frequency.exponentialRampToValueAtTime(2300, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.13);
  }
}

import {
  IDLE_SCENE,
  type GrooveId,
  type LayerMix,
  type MusicCue,
  type MusicScene,
  type TrackId,
} from "@/lib/audio/score";

export type SfxId =
  | "whoosh"
  | "tap"
  | "tick"
  | "chime"
  | "sparkle"
  | "error"
  | "pop"
  | "transition"
  | "sweep"
  | "rise"
  | "hit"
  | "air"
  | "card"
  | "title"
  | "confirm"
  | "unlock"
  | "crash"
  | "record"
  | "glow"
  | "brass";

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? window.webkitAudioContext ?? null;
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

const MASTER_GAIN = 0.54;
const BPM = 128;
const SIXTEENTH = 60 / BPM / 4;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.16;
const PHRASE_STEPS = 128;
const LAYER_KEYS: (keyof LayerMix)[] = [
  "pads",
  "kick",
  "hats",
  "snare",
  "bass",
  "arp",
  "lead",
];

const E2 = 82.41;
const A2 = 110.0;
const G2 = 98.0;
const B2 = 123.47;
const C3 = 130.81;
const D3 = 146.83;
const E3 = 164.81;
const Fs3 = 185.0;
const G3 = 196.0;
const A3 = 220.0;
const B3 = 246.94;
const D4 = 293.66;
const E4 = 329.63;
const G4 = 392.0;
const A4 = 440.0;
const B4 = 493.88;
const D5 = 587.33;
const E5 = 659.26;
const C4 = 261.63;
const C5 = 523.25;
const F2 = 87.31;
const F3 = 174.61;
const F4 = 349.23;

const CHORD_EM = [E3, G3, B3];
const CHORD_EM9 = [E3, G3, B3, Fs3];
const CHORD_C = [C3, E3, G3];
const CHORD_G = [G3, B3, D4];
const CHORD_D = [D3, Fs3, A3];
const CHORD_AM = [A3, C4, E4];
const CHORD_F = [F3, A3, C4];
const CHORD_Cmaj7 = [C3, E3, G3, B3];
const CHORD_DM = [D3, F3, A3];
const LANG_PROGRESSION = [CHORD_AM, CHORD_F, CHORD_C, CHORD_G];
const COMMUNITY_PROGRESSION = [CHORD_Cmaj7, CHORD_AM, CHORD_DM, CHORD_G];
const SUMMARY_PROGRESSION = [CHORD_C, CHORD_G, CHORD_AM, CHORD_EM];
const HOUSE_PROGRESSION = [CHORD_EM, CHORD_C, CHORD_G, CHORD_D];
const STREAK_PROGRESSION = [CHORD_EM, CHORD_F, CHORD_EM, CHORD_G];
const BERRIES_BASS = [
  E2, 0, E2, G2, E2, 0, D3, 0, E2, 0, G2, E2, B2, 0, D3, G2,
];
const HOUSE_BASS = [
  E2, 0, E2, 0, E2, G2, E2, 0, E2, 0, G2, E2, B2, 0, D3, 0,
];
const LANG_BASS = [
  A2, 0, A2, 0, A2, C3, A2, 0, F2, 0, F2, G2, C3, 0, G2, 0,
];
const COMMUNITY_BASS = [
  C3, 0, 0, 0, G2, 0, C3, 0, A2, 0, 0, E2, F2, 0, G2, 0,
];
const HEAT_BASS = [
  E2, 0, 0, E2, 0, 0, B2, 0, E2, 0, G2, 0, 0, D3, 0, 0,
];
const STREAK_ACID = [
  E2, F2, E2, E3, E2, F2, G2, E2, E2, F2, E3, E2, D3, F2, E2, G2,
];
const SUMMARY_BASS = [
  C3, 0, 0, 0, G2, 0, 0, 0, A2, 0, 0, 0, E2, 0, G2, 0,
];
const SPARK_BASS = [
  D3, 0, D3, E2, 0, G2, D3, 0, C3, 0, G2, E2, B2, 0, D3, G2,
];
const TECH_BASS = [
  E2, E2, 0, G2, E2, 0, E2, D3, E2, E2, G2, 0, B2, E2, D3, 0,
];
const BOOGALOO_BASS = [
  E2, 0, G2, E3, 0, E2, D3, 0, E2, 0, B2, E3, G2, 0, E2, 0,
];
const BERRIES_PLUCK = [B4, 0, A4, 0, G4, E4, 0, G4, B4, A4, 0, G4, E4, 0, D4, G4];
const LANG_PLUCK = [E4, 0, A4, 0, C5, A4, 0, G4, E4, G4, 0, A4, C5, 0, B4, A4];
const TECH_PLUCK = [G4, E4, 0, B4, 0, E4, G4, 0, B4, 0, A4, G4, 0, E4, D4, 0];
const HEAT_SEQ = [E4, 0, B3, E4, 0, G4, B3, 0];
const STREAK_LEAD = [E4, F4, G4, E4, B4, F4, E4, D5];
const COMMUNITY_SAX = [G4, 0, E4, 0, 0, C4, D4, E4, G4, 0, A4, 0, G4, E4, 0, D4];
const SUMMARY_MELODY = [E4, 0, G4, 0, A4, 0, G4, E4, D4, 0, C4, 0, E4, 0, G4, 0];
const SPARK_ARP = [D4, F4, A4, D5, C5, A4, G4, F4];
const GLAMOUR_CHOPS = [E4, 0, 0, G4, 0, 0, B4, 0, A4, 0, 0, E4, 0, G4, 0, B3];
const RUBBER_BASS = [E2, 0, E2, 0, 0, G2, E2, 0, D3, 0, E2, B2, 0, G2, E2, 0];
const TECHNO_SEQ = [E3, E4, B3, E4, G3, E4, D4, B3];
const TECHNO_ACID = [E2, E2, E3, E2, G2, E2, D3, E2];
const GUARACHA_HOOK = [B4, E5, G4, B4, E5, D5, B4, G4];
const MONTUNO = [E4, G4, B4, E5, D5, B4, G4, E4, G4, B4, D5, B4, A4, G4, E4, B4];
const FESTIVAL_LEAD = [E4, G4, B4, E5, D5, B4, G4, D5];
const TRUMPET_LICK = [B3, E4, G4, B4, G4, E4];
const SAX_PHRASE = [B3, D4, E4, G4, A4, G4];
const AMBIENT_MELODY = [E4, 0, G4, 0, B4, 0, E5, D5, B4, 0, G4, 0, A4, 0, B4, 0];
const UI_TONES = [E4, G4, B4, D5, E4 * 2, G4];
const TICK_TONES = [E4, G4, B4];
const CONFIRM_TONES = [
  [E3, B3],
  [G3, D4],
  [B3, E4],
  [E4, G4],
  [G3, B3],
  [D4, G4],
];

export const AUDIO_ENGINE_BUILD = "tracks-v1";

export function createSfxEngine() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let musicFilter: BiquadFilterNode | null = null;
  let padSource: AudioBufferSourceNode | null = null;
  let padBuffer: AudioBuffer | null = null;
  const layerGains = new Map<keyof LayerMix, GainNode>();

  let muted = false;
  let reducedMotion = false;
  let resumePromise: Promise<void> | null = null;
  let musicRefs = 0;
  let musicWanted = false;
  let stopTimer: number | null = null;
  let schedulerTimer: number | null = null;
  let nextNoteTime = 0;
  let step = 0;
  let currentScene: MusicScene = IDLE_SCENE;
  let playingGroove: GrooveId = IDLE_SCENE.groove;
  let playingTrack: TrackId = IDLE_SCENE.track;
  let pendingScene: MusicScene | null = null;
  let queuedAtStep = -1;
  let extraEnergyUntil = 0;
  let muteDrumsUntil = 0;
  let leadHookUntil = 0;
  let brassHookUntil = 0;
  const lastCueAt = new Map<MusicCue, number>();
  const lastPlayed = new Map<string, number>();
  const pending: SfxId[] = [];

  function ensureContext() {
    if (ctx && master && sfxBus && musicBus && musicFilter) {
      return { ctx, master, sfxBus, musicBus, musicFilter };
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_GAIN;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.0001;
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 900;
    musicFilter.Q.value = 0.9;
    sfxBus.connect(master);
    musicBus.connect(musicFilter);
    musicFilter.connect(master);
    master.connect(ctx.destination);

    for (const key of LAYER_KEYS) {
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(musicBus);
      layerGains.set(key, gain);
    }
    return { ctx, master, sfxBus, musicBus, musicFilter };
  }

  function resume(): Promise<void> {
    const nodes = ensureContext();
    if (!nodes) return Promise.resolve();
    if (nodes.ctx.state !== "suspended") return Promise.resolve();
    if (!resumePromise) {
      resumePromise = nodes.ctx
        .resume()
        .catch(() => undefined)
        .finally(() => {
          resumePromise = null;
        });
    }
    return resumePromise;
  }

  function flushPending() {
    if (muted) {
      pending.length = 0;
      return;
    }
    const queued = pending.splice(0, pending.length);
    for (const id of queued) playNow(id);
  }

  function unlockSync() {
    const nodes = ensureContext();
    if (!nodes) return;
    if (nodes.ctx.state === "suspended") {
      void nodes.ctx.resume();
    }
  }

  async function unlock() {
    unlockSync();
    await resume();
    flushPending();
    if (musicWanted) startMusicNow();
  }

  function setMuted(next: boolean) {
    muted = next;
    if (master) master.gain.value = next ? 0 : MASTER_GAIN;
    if (next) pending.length = 0;
  }

  function setReducedMotion(next: boolean) {
    reducedMotion = next;
  }

  function canPlay(key: string, minGapMs: number) {
    if (muted) return false;
    const last = lastPlayed.get(key) ?? 0;
    const t = nowMs();
    if (t - last < minGapMs) return false;
    lastPlayed.set(key, t);
    return true;
  }

  function tone(
    audio: AudioContext,
    destination: AudioNode,
    opts: {
      frequency: number;
      type?: OscillatorType;
      peak?: number;
      attack?: number;
      release?: number;
      slideTo?: number;
      when?: number;
    },
  ) {
    const when = opts.when ?? audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.frequency, when);
    if (opts.slideTo && opts.slideTo > 0) {
      osc.frequency.linearRampToValueAtTime(
        opts.slideTo,
        when + (opts.attack ?? 0.008) + (opts.release ?? 0.18),
      );
    }
    const peak = opts.peak ?? 0.16;
    const attack = opts.attack ?? 0.008;
    const release = opts.release ?? 0.16;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + Math.max(attack, 0.003));
    gain.gain.linearRampToValueAtTime(0.0001, when + attack + release);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(when + attack + release + 0.04);
  }

  function noiseBurst(
    audio: AudioContext,
    destination: AudioNode,
    opts: {
      duration: number;
      startHz: number;
      endHz: number;
      peak: number;
      q?: number;
      when?: number;
      type?: BiquadFilterType;
    },
  ) {
    const when = opts.when ?? audio.currentTime;
    const length = Math.max(32, Math.floor(audio.sampleRate * opts.duration));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = opts.type ?? "bandpass";
    filter.Q.value = opts.q ?? 0.9;
    filter.frequency.setValueAtTime(opts.startHz, when);
    filter.frequency.linearRampToValueAtTime(opts.endHz, when + opts.duration);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(opts.peak, when + 0.018);
    gain.gain.linearRampToValueAtTime(0.0001, when + opts.duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when);
    source.stop(when + opts.duration + 0.02);
  }

  function brass(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak = 0.16,
    echo = true,
  ) {
    const osc = audio.createOscillator();
    const fifth = audio.createOscillator();
    const chorus = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const hipass = audio.createBiquadFilter();
    const gain = audio.createGain();
    osc.type = "sawtooth";
    fifth.type = "square";
    chorus.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, when);
    osc.frequency.linearRampToValueAtTime(frequency * 1.018, when + 0.08);
    fifth.frequency.setValueAtTime(frequency * 1.5, when);
    chorus.frequency.setValueAtTime(frequency * 1.007, when);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(Math.min(2_600, frequency * 3.1), when);
    filter.frequency.linearRampToValueAtTime(
      Math.min(1_800, frequency * 2.2),
      when + 0.28,
    );
    filter.Q.value = 2.6;
    hipass.type = "highpass";
    hipass.frequency.value = 420;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.linearRampToValueAtTime(peak * 0.5, when + 0.1);
    gain.gain.linearRampToValueAtTime(0.0001, when + 0.36);
    osc.connect(filter);
    fifth.connect(filter);
    chorus.connect(filter);
    filter.connect(hipass);
    hipass.connect(gain);
    gain.connect(destination);
    osc.start(when);
    fifth.start(when);
    chorus.start(when);
    osc.stop(when + 0.4);
    fifth.stop(when + 0.4);
    chorus.stop(when + 0.4);
    if (echo && peak > 0.05) {
      brass(audio, destination, frequency, when + 0.11, peak * 0.34, false);
    }
  }

  function brassPhrase(
    audio: AudioContext,
    destination: AudioNode,
    when: number,
    peak = 0.15,
  ) {
    TRUMPET_LICK.forEach((freq, index) => {
      brass(audio, destination, freq, when + index * 0.078, peak);
    });
  }

  function sax(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak = 0.13,
    duration = 0.32,
  ) {
    const reed = audio.createOscillator();
    const body = audio.createOscillator();
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    reed.type = "sawtooth";
    body.type = "sine";
    lfo.type = "sine";
    reed.frequency.setValueAtTime(frequency, when);
    body.frequency.setValueAtTime(frequency, when);
    lfo.frequency.setValueAtTime(5.4, when);
    lfoGain.gain.setValueAtTime(Math.max(5, frequency * 0.012), when);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(Math.min(1_680, frequency * 3.3), when);
    filter.frequency.linearRampToValueAtTime(
      Math.min(1_280, frequency * 2.5),
      when + duration,
    );
    filter.Q.value = 2.2;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.04);
    gain.gain.linearRampToValueAtTime(peak * 0.7, when + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    lfo.connect(lfoGain);
    lfoGain.connect(reed.frequency);
    lfoGain.connect(body.frequency);
    reed.connect(filter);
    body.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    reed.start(when);
    body.start(when);
    lfo.start(when);
    const stopAt = when + duration + 0.05;
    reed.stop(stopAt);
    body.stop(stopAt);
    lfo.stop(stopAt);
  }

  function saxPhrase(
    audio: AudioContext,
    destination: AudioNode,
    when: number,
    peak = 0.13,
  ) {
    SAX_PHRASE.forEach((freq, index) => {
      sax(audio, destination, freq, when + index * 0.11, peak, index === 5 ? 0.48 : 0.2);
    });
  }

  function clave(audio: AudioContext, destination: AudioNode, when: number, peak = 0.1) {
    tone(audio, destination, {
      frequency: 2450,
      type: "triangle",
      peak,
      attack: 0.001,
      release: 0.045,
      when,
    });
  }

  function conga(audio: AudioContext, destination: AudioNode, when: number) {
    tone(audio, destination, {
      frequency: 210,
      type: "sine",
      peak: 0.16,
      attack: 0.003,
      release: 0.12,
      slideTo: 95,
      when,
    });
  }

  function piano(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak = 0.14,
    duration = 0.5,
  ) {
    const hammer = audio.createOscillator();
    const body = audio.createOscillator();
    const oct = audio.createOscillator();
    const fifth = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    hammer.type = "triangle";
    body.type = "sine";
    oct.type = "sine";
    fifth.type = "sine";
    hammer.frequency.setValueAtTime(frequency * 2, when);
    body.frequency.setValueAtTime(frequency, when);
    oct.frequency.setValueAtTime(frequency * 0.5, when);
    fifth.frequency.setValueAtTime(frequency * 1.5, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(5_200, frequency * 9), when);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(900, frequency * 3.2),
      when + duration,
    );
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    hammer.connect(filter);
    body.connect(filter);
    oct.connect(filter);
    fifth.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    hammer.start(when);
    body.start(when);
    oct.start(when);
    fifth.start(when);
    hammer.stop(when + duration + 0.02);
    body.stop(when + duration + 0.02);
    oct.stop(when + duration + 0.02);
    fifth.stop(when + duration + 0.02);
  }

  function pianoChord(
    audio: AudioContext,
    destination: AudioNode,
    freqs: number[],
    when: number,
    peak = 0.09,
    duration = 0.7,
  ) {
    freqs.forEach((freq, index) => {
      piano(audio, destination, freq, when, peak * (index === 0 ? 1 : 0.72), duration);
    });
  }

  function vocalChop(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak = 0.1,
  ) {
    const osc = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, when);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1_150, when);
    filter.Q.value = 7.5;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.linearRampToValueAtTime(0.0001, when + 0.11);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(when + 0.14);
  }

  function leadSaw(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak = 0.14,
    duration = 0.36,
  ) {
    const a = audio.createOscillator();
    const b = audio.createOscillator();
    const c = audio.createOscillator();
    const d = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    a.type = "sawtooth";
    b.type = "sawtooth";
    c.type = "square";
    d.type = "sawtooth";
    a.frequency.setValueAtTime(frequency, when);
    b.frequency.setValueAtTime(frequency * 1.01, when);
    c.frequency.setValueAtTime(frequency * 0.5, when);
    d.frequency.setValueAtTime(frequency * 2.005, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3_800, when);
    filter.frequency.linearRampToValueAtTime(1_600, when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.016);
    gain.gain.linearRampToValueAtTime(0.0001, when + duration);
    a.connect(filter);
    b.connect(filter);
    c.connect(filter);
    d.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    a.start(when);
    b.start(when);
    c.start(when);
    d.start(when);
    const stopAt = when + duration + 0.03;
    a.stop(stopAt);
    b.stop(stopAt);
    c.stop(stopAt);
    d.stop(stopAt);
  }

  function fourOnFloor(
    audio: AudioContext,
    kick: GainNode,
    when: number,
    barStep: number,
    peak: number,
    freq = 136,
    release = 0.13,
  ) {
    if (barStep % 4 !== 0) return;
    tone(audio, kick, {
      frequency: freq,
      type: "sine",
      peak,
      attack: 0.002,
      release,
      slideTo: 40,
      when,
    });
  }

  function closedHat(
    audio: AudioContext,
    hats: GainNode,
    when: number,
    peak: number,
    open = false,
  ) {
    noiseBurst(audio, hats, {
      duration: open ? 0.14 : 0.028,
      startHz: open ? 6_000 : 8_800,
      endHz: open ? 10_200 : 12_000,
      peak,
      q: 0.5,
      type: "highpass",
      when,
    });
  }

  function clap(audio: AudioContext, snare: GainNode, when: number, peak: number) {
    noiseBurst(audio, snare, {
      duration: 0.07,
      startHz: 2_200,
      endHz: 850,
      peak,
      q: 0.7,
      when,
    });
  }

  function duckPads(when: number) {
    const pads = layerGains.get("pads");
    if (!pads) return;
    const target = Math.max(currentScene.layers.pads, 0.0001);
    pads.gain.cancelScheduledValues(when);
    pads.gain.setValueAtTime(Math.max(target * 0.28, 0.0001), when);
    pads.gain.exponentialRampToValueAtTime(target, when + 0.2);
  }

  function duckBass(when: number) {
    const bass = layerGains.get("bass");
    if (!bass) return;
    const target = Math.max(currentScene.layers.bass, 0.0001);
    bass.gain.cancelScheduledValues(when);
    bass.gain.setValueAtTime(Math.max(target * 0.38, 0.0001), when);
    bass.gain.exponentialRampToValueAtTime(target, when + 0.13);
  }

  function houseBass(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak: number,
    downbeat: boolean,
  ) {
    const sub = audio.createOscillator();
    const body = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    sub.type = "sine";
    body.type = "triangle";
    sub.frequency.setValueAtTime(frequency, when);
    body.frequency.setValueAtTime(frequency * 2, when);
    if (downbeat) {
      sub.frequency.exponentialRampToValueAtTime(frequency * 0.92, when + 0.09);
    }
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(downbeat ? 420 : 320, when);
    filter.Q.value = 1.8;
    const release = downbeat ? 0.22 : 0.11;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + release);
    sub.connect(gain);
    body.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    sub.start(when);
    body.start(when);
    sub.stop(when + release + 0.04);
    body.stop(when + release + 0.04);
  }

  function warmBass(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak: number,
  ) {
    tone(audio, destination, {
      frequency,
      type: "sine",
      peak: peak * 1.05,
      attack: 0.005,
      release: 0.18,
      when,
    });
    tone(audio, destination, {
      frequency,
      type: "sawtooth",
      peak: peak * 0.38,
      attack: 0.004,
      release: 0.13,
      when,
    });
    tone(audio, destination, {
      frequency: frequency * 0.5,
      type: "sine",
      peak: peak * 0.55,
      attack: 0.008,
      release: 0.2,
      when,
    });
  }

  function rubberBass(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak: number,
  ) {
    tone(audio, destination, {
      frequency: frequency * 1.4,
      type: "sine",
      peak: peak * 1.15,
      attack: 0.003,
      release: 0.2,
      slideTo: frequency * 0.5,
      when,
    });
    tone(audio, destination, {
      frequency,
      type: "sawtooth",
      peak: peak * 0.32,
      attack: 0.004,
      release: 0.14,
      when,
    });
  }

  function acidBass(
    audio: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    peak: number,
  ) {
    const osc = audio.createOscillator();
    const sub = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    osc.type = "sawtooth";
    sub.type = "sine";
    osc.frequency.setValueAtTime(frequency, when);
    sub.frequency.setValueAtTime(frequency * 0.5, when);
    filter.type = "lowpass";
    filter.Q.value = 8.5;
    filter.frequency.setValueAtTime(2_400, when);
    filter.frequency.exponentialRampToValueAtTime(280, when + 0.16);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.006);
    gain.gain.linearRampToValueAtTime(0.0001, when + 0.2);
    osc.connect(filter);
    sub.connect(gain);
    filter.connect(gain);
    gain.connect(destination);
    osc.start(when);
    sub.start(when);
    osc.stop(when + 0.24);
    sub.stop(when + 0.24);
  }

  function shaker(audio: AudioContext, hats: GainNode, when: number, peak: number) {
    noiseBurst(audio, hats, {
      duration: 0.04,
      startHz: 7_200,
      endHz: 11_500,
      peak,
      q: 0.45,
      type: "highpass",
      when,
    });
  }

  function buildPadLoop(audio: AudioContext): AudioBuffer {
    const seconds = (60 / BPM) * 8;
    const length = Math.floor(audio.sampleRate * seconds);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    const freqs = [E2, E3, G3, B3, D4, Fs3];
    const fadeSamples = Math.max(32, Math.floor(audio.sampleRate * 0.008));
    for (let i = 0; i < length; i += 1) {
      const t = i / audio.sampleRate;
      let sample = 0;
      for (let f = 0; f < freqs.length; f += 1) {
        const wobble = 1 + Math.sin(t * (0.1 + f * 0.04)) * 0.004;
        sample += Math.sin(2 * Math.PI * freqs[f] * wobble * t) * (0.2 - f * 0.026);
      }
      sample += (Math.random() * 2 - 1) * 0.01;
      const edge = Math.min(i, length - 1 - i);
      const fade = edge < fadeSamples ? edge / fadeSamples : 1;
      data[i] = sample * fade * 0.68;
    }
    return buffer;
  }

  function startPads() {
    const nodes = ensureContext();
    const padGain = layerGains.get("pads");
    if (!nodes || !padGain || padSource) return;
    padBuffer ??= buildPadLoop(nodes.ctx);
    const source = nodes.ctx.createBufferSource();
    source.buffer = padBuffer;
    source.loop = true;
    source.connect(padGain);
    source.start();
    padSource = source;
  }

  function stopPads() {
    if (!padSource) return;
    const source = padSource;
    padSource = null;
    try {
      source.stop();
    } catch {}
    source.disconnect();
  }

  function scheduleDrum(stepIndex: number, when: number) {
    const audio = ctx;
    if (!audio) return;
    const kick = layerGains.get("kick");
    const hats = layerGains.get("hats");
    const snare = layerGains.get("snare");
    const bass = layerGains.get("bass");
    const arp = layerGains.get("arp");
    const lead = layerGains.get("lead");
    if (!kick || !hats || !snare || !bass || !arp || !lead) return;

    const barStep = stepIndex % 16;
    const cycle = Math.floor(stepIndex / 16) % 4;
    const elapsed =
      queuedAtStep < 0
        ? 0
        : (stepIndex - queuedAtStep + PHRASE_STEPS) % PHRASE_STEPS;

    if (
      pendingScene &&
      barStep % 4 === 0 &&
      elapsed >= 1 &&
      stepIndex !== queuedAtStep
    ) {
      playingGroove = pendingScene.groove;
      playingTrack = pendingScene.track;
      pendingScene = null;
      queuedAtStep = -1;
    }

    if (pendingScene && barStep % 4 === 0) {
      extraEnergyUntil = Math.max(extraEnergyUntil, when + SIXTEENTH * 2);
    }

    const track = pendingScene?.track ?? playingTrack;
    const intensity = currentScene.intensity;
    const swingAmt =
      track === "boogalooMontuno" || track === "guarachaPeak"
        ? 0.02
        : track === "languageHouse" || track === "techRoll" || track === "sparkHouse"
          ? 0.018
          : track === "communityDeep" || track === "summaryPiano"
            ? 0.014
            : 0;
    const swing = barStep % 2 === 1 ? swingAmt : 0;
    const t = when + swing;
    const paused = when < muteDrumsUntil;
    const celebrating = when < extraEnergyUntil;
    const hookLead = when < leadHookUntil;
    const hookBrass = when < brassHookUntil;
    const houseChord = HOUSE_PROGRESSION[cycle] ?? CHORD_EM;
    const langChord = LANG_PROGRESSION[cycle] ?? CHORD_AM;
    const communityChord = COMMUNITY_PROGRESSION[cycle] ?? CHORD_Cmaj7;
    const summaryChord = SUMMARY_PROGRESSION[cycle] ?? CHORD_C;
    const streakChord = STREAK_PROGRESSION[cycle] ?? CHORD_EM;

    if (paused) return;

    if (track === "glamourIntro") {
      if (barStep === 0) {
        pianoChord(audio, arp, CHORD_EM9, t, 0.15, 2.0);
        warmBass(audio, bass, E2, t, 0.18);
        leadSaw(audio, lead, E4, t, 0.06, 1.2);
      }
      if (barStep === 4) piano(audio, arp, G4, t, 0.11, 0.8);
      if (barStep === 8) {
        pianoChord(audio, arp, houseChord, t, 0.12, 1.35);
        brass(audio, lead, B3, t, 0.09);
      }
      const melody = AMBIENT_MELODY[barStep] ?? 0;
      if (melody && barStep % 2 === 0) {
        piano(audio, arp, melody, t, 0.08, 0.45);
      }
      if (barStep === 6) vocalChop(audio, lead, G4, t, 0.07);
      if (barStep === 10) vocalChop(audio, lead, B3, t, 0.06);
      if (barStep === 0 && cycle % 2 === 1) brassPhrase(audio, lead, t, 0.11);
      if (barStep === 8 && cycle === 3) saxPhrase(audio, lead, t, 0.12);
      return;
    }

    if (track === "languageHouse") {
      fourOnFloor(audio, kick, t, barStep, celebrating ? 0.88 : 0.78, 128, 0.11);
      if (barStep % 4 === 0) {
        duckPads(t);
        duckBass(t);
      }
      shaker(audio, hats, t, barStep % 2 === 1 ? 0.08 : 0.04);
      if (barStep % 4 === 2) closedHat(audio, hats, t, 0.1);
      if (barStep === 14) closedHat(audio, hats, t, 0.16, true);
      if (barStep === 4 || barStep === 12) clap(audio, snare, t, celebrating ? 0.32 : 0.26);
      const bassNote = LANG_BASS[barStep] ?? 0;
      if (bassNote) {
        houseBass(audio, bass, bassNote, t, barStep % 4 === 0 ? 0.3 : 0.2, barStep % 4 === 0);
      }
      if (barStep === 0) pianoChord(audio, arp, langChord, t, 0.1, 0.75);
      const pluck = LANG_PLUCK[barStep] ?? 0;
      if (pluck && (cycle % 2 === 1 || intensity >= 3 || hookLead || celebrating)) {
        tone(audio, arp, {
          frequency: pluck,
          type: "sine",
          peak: 0.075,
          attack: 0.004,
          release: 0.14,
          when: t,
        });
      }
      if (barStep === 0 && (hookBrass || celebrating || cycle === 0)) {
        brassPhrase(audio, lead, t, 0.12);
      }
      return;
    }

    if (track === "techRoll") {
      fourOnFloor(audio, kick, t, barStep, celebrating ? 0.9 : 0.8, 122, 0.1);
      if (barStep % 4 === 0) {
        duckPads(t);
        duckBass(t);
      }
      shaker(audio, hats, t, barStep % 2 === 1 ? 0.085 : 0.045);
      if (barStep % 2 === 1) closedHat(audio, hats, t, 0.08);
      if (barStep === 14) closedHat(audio, hats, t, 0.16, true);
      if (barStep === 4 || barStep === 12) clap(audio, snare, t, 0.28);
      if (barStep === 6 || barStep === 10) {
        noiseBurst(audio, snare, {
          duration: 0.04,
          startHz: 1_800,
          endHz: 700,
          peak: 0.08,
          q: 0.8,
          when: t,
        });
      }
      const bassNote = TECH_BASS[barStep] ?? 0;
      if (bassNote) {
        houseBass(audio, bass, bassNote, t, barStep % 4 === 0 ? 0.28 : 0.18, barStep % 4 === 0);
      }
      const pluck = TECH_PLUCK[barStep] ?? 0;
      if (pluck) leadSaw(audio, lead, pluck, t, celebrating || hookLead ? 0.1 : 0.07, 0.16);
      if (barStep === 0 && cycle === 2) pianoChord(audio, arp, houseChord, t, 0.06, 0.5);
      return;
    }

    if (track === "communityDeep") {
      if (barStep === 0 || barStep === 8) {
        fourOnFloor(audio, kick, t, 0, 0.72, 118, 0.16);
        duckPads(t);
      }
      shaker(audio, hats, t, 0.03);
      if (barStep === 4 || barStep === 12) clap(audio, snare, t, 0.2);
      const bassNote = COMMUNITY_BASS[barStep] ?? 0;
      if (bassNote) warmBass(audio, bass, bassNote, t, 0.22);
      if (barStep === 0) pianoChord(audio, arp, communityChord, t, 0.1, 1.4);
      const saxNote = COMMUNITY_SAX[barStep] ?? 0;
      if (saxNote && (cycle % 2 === 1 || celebrating || hookLead)) {
        sax(audio, lead, saxNote, t, 0.12, 0.28);
      }
      if (barStep === 0 && cycle === 0) brass(audio, lead, G4, t, 0.08);
      return;
    }

    if (track === "summaryPiano") {
      if (barStep === 0 || barStep === 8) {
        fourOnFloor(audio, kick, t, 0, 0.62, 124, 0.18);
        duckPads(t);
      }
      if (barStep % 4 === 2) closedHat(audio, hats, t, 0.05);
      if (barStep === 12) clap(audio, snare, t, 0.16);
      const bassNote = SUMMARY_BASS[barStep] ?? 0;
      if (bassNote) warmBass(audio, bass, bassNote, t, 0.2);
      if (barStep === 0) pianoChord(audio, arp, summaryChord, t, 0.13, 1.6);
      const melody = SUMMARY_MELODY[barStep] ?? 0;
      if (melody) piano(audio, arp, melody, t, 0.12, 0.55);
      if (barStep === 8 && cycle === 3) saxPhrase(audio, lead, t, 0.1);
      if (celebrating && barStep === 0) brassPhrase(audio, lead, t, 0.1);
      return;
    }

    if (track === "heatPulse") {
      fourOnFloor(audio, kick, t, barStep, 0.8, 128, 0.18);
      if (barStep % 4 === 0) duckPads(t);
      if (barStep % 2 === 1) closedHat(audio, hats, t, 0.045);
      shaker(audio, hats, t, 0.028);
      if (barStep === 12) clap(audio, snare, t, 0.12);
      const bassNote = HEAT_BASS[barStep] ?? 0;
      if (bassNote) warmBass(audio, bass, bassNote, t, 0.2);
      if (barStep % 2 === 0) {
        const seq = HEAT_SEQ[(barStep / 2) % HEAT_SEQ.length] ?? 0;
        if (seq) {
          tone(audio, arp, {
            frequency: seq,
            type: "sine",
            peak: 0.07,
            attack: 0.02,
            release: 0.28,
            when: t,
          });
        }
      }
      if (barStep === 0) pianoChord(audio, arp, CHORD_EM9, t, 0.08, 1.6);
      if (barStep === 8) leadSaw(audio, lead, B3, t, 0.06, 0.7);
      return;
    }

    if (track === "streakAcid") {
      fourOnFloor(audio, kick, t, barStep, 0.94, 116, 0.26);
      if (barStep % 4 === 0) duckPads(t);
      if (barStep % 2 === 1) closedHat(audio, hats, t, 0.11);
      if (barStep === 14) closedHat(audio, hats, t, 0.14, true);
      if (barStep === 12) clap(audio, snare, t, 0.3);
      const acid = STREAK_ACID[barStep] ?? E2;
      acidBass(audio, bass, acid, t, 0.26);
      if (barStep % 2 === 0) {
        const seq = STREAK_LEAD[(barStep / 2 + cycle) % STREAK_LEAD.length] ?? E4;
        leadSaw(audio, arp, seq, t, celebrating ? 0.13 : 0.1, 0.18);
      }
      if (barStep === 0) pianoChord(audio, lead, streakChord, t, 0.07, 0.9);
      if (barStep === 0 && (cycle % 2 === 1 || hookBrass || celebrating)) {
        brassPhrase(audio, lead, t, 0.14);
      }
      return;
    }

    if (track === "sparkHouse") {
      fourOnFloor(audio, kick, t, barStep, 0.82, 130, 0.11);
      if (barStep % 4 === 0) {
        duckPads(t);
        duckBass(t);
      }
      shaker(audio, hats, t, barStep % 2 === 1 ? 0.07 : 0.035);
      if (barStep === 6 || barStep === 14) clap(audio, snare, t, 0.24);
      const bassNote = SPARK_BASS[barStep] ?? 0;
      if (bassNote) houseBass(audio, bass, bassNote, t, 0.22, barStep % 4 === 0);
      if (barStep % 2 === 0) {
        const arpNote = SPARK_ARP[(barStep / 2) % SPARK_ARP.length] ?? D4;
        tone(audio, arp, {
          frequency: arpNote,
          type: "triangle",
          peak: 0.08,
          attack: 0.003,
          release: 0.12,
          when: t,
        });
      }
      if (barStep === 0 && cycle === 1) brassPhrase(audio, lead, t, 0.11);
      if (hookLead && barStep === 8) leadSaw(audio, lead, A4, t, 0.1, 0.3);
      return;
    }

    if (track === "guarachaPeak" || track === "festivalDrop") {
      const peak = track === "festivalDrop";
      fourOnFloor(audio, kick, t, barStep, peak ? 0.96 : 0.9, 144, 0.11);
      if (barStep % 4 === 0) duckPads(t);
      if (barStep === 6 || barStep === 10 || (peak && barStep === 13)) {
        tone(audio, kick, {
          frequency: 152,
          type: "sine",
          peak: 0.42,
          attack: 0.001,
          release: 0.06,
          slideTo: 46,
          when: t,
        });
      }
      if (barStep % 2 === 1 || celebrating) closedHat(audio, hats, t, celebrating ? 0.14 : 0.1);
      if (barStep === 14) closedHat(audio, hats, t, 0.19, true);
      if (barStep === 4 || barStep === 12) clap(audio, snare, t, celebrating ? 0.4 : 0.34);
      const chop = GLAMOUR_CHOPS[barStep] ?? 0;
      if (chop) vocalChop(audio, arp, chop, t, peak ? 0.12 : 0.1);
      const rub = RUBBER_BASS[barStep] ?? 0;
      if (rub) rubberBass(audio, bass, rub, t, celebrating ? 0.28 : 0.24);
      if (barStep === 0) pianoChord(audio, arp, houseChord, t, 0.11, 0.55);
      if (barStep % 2 === 0) {
        const hook = (peak ? FESTIVAL_LEAD : GUARACHA_HOOK)[(barStep / 2) % 8] ?? B4;
        if (peak) leadSaw(audio, lead, hook, t, celebrating ? 0.16 : 0.14, 0.24);
        else brass(audio, lead, hook, t, 0.15);
      }
      if (barStep === 0) brassPhrase(audio, lead, t, peak || celebrating ? 0.18 : 0.15);
      if (barStep === 8 && (cycle === 1 || cycle === 3 || celebrating || peak)) {
        saxPhrase(audio, lead, t, peak ? 0.15 : 0.13);
      }
      return;
    }

    if (track === "boogalooMontuno") {
      if (barStep === 0 || barStep === 6 || barStep === 8 || barStep === 14) {
        fourOnFloor(audio, kick, t, 0, 0.84, 130, 0.14);
        duckPads(t);
      }
      if (barStep % 2 === 1) closedHat(audio, hats, t, 0.085);
      if (barStep === 4 || barStep === 12) clap(audio, snare, t, 0.28);
      if (barStep === 3 || barStep === 7 || barStep === 11 || barStep === 15) {
        conga(audio, snare, t);
      }
      if (barStep === 0 || barStep === 8) clave(audio, hats, t, 0.09);
      const chop = GLAMOUR_CHOPS[barStep] ?? 0;
      if (chop && barStep % 4 !== 0) vocalChop(audio, lead, chop, t, 0.09);
      const rub = BOOGALOO_BASS[barStep] ?? 0;
      if (rub) rubberBass(audio, bass, rub, t, 0.24);
      piano(audio, arp, MONTUNO[barStep] ?? E4, t, celebrating ? 0.16 : 0.14, 0.18);
      if (barStep === 0) pianoChord(audio, arp, houseChord, t, 0.12, 0.5);
      if (barStep === 0 || barStep === 8) brassPhrase(audio, lead, t, 0.16);
      if (barStep === 4) leadSaw(audio, lead, E5, t, 0.11, 0.3);
      if (barStep === 4 && (cycle === 2 || celebrating)) saxPhrase(audio, lead, t, 0.14);
      return;
    }

  }


  function schedulerTick() {
    if (!ctx || !musicWanted || ctx.state !== "running") return;
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleDrum(step, nextNoteTime);
      nextNoteTime += SIXTEENTH;
      step = (step + 1) % PHRASE_STEPS;
    }
  }

  function startScheduler() {
    if (schedulerTimer != null || !ctx) return;
    nextNoteTime = ctx.currentTime + 0.05;
    schedulerTick();
    schedulerTimer = window.setInterval(schedulerTick, LOOKAHEAD_MS);
  }

  function stopScheduler() {
    if (schedulerTimer != null) {
      window.clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function bumpLayers(
    partial: Partial<LayerMix>,
    cutoff: number | null,
    attack: number,
    hold: number,
  ) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const release = 0.95;
    for (const key of LAYER_KEYS) {
      const extra = partial[key];
      if (extra == null) continue;
      const node = layerGains.get(key);
      if (!node) continue;
      const base = Math.max(currentScene.layers[key], 0.0001);
      const target = Math.max(base + extra, 0.0001);
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(Math.max(node.gain.value, 0.0001), now);
      node.gain.linearRampToValueAtTime(target, now + attack);
      node.gain.setValueAtTime(target, now + attack + hold);
      node.gain.linearRampToValueAtTime(base, now + attack + hold + release);
    }
    if (cutoff && musicFilter) {
      const baseCut = Math.max(currentScene.cutoff, 160);
      musicFilter.frequency.cancelScheduledValues(now);
      musicFilter.frequency.setValueAtTime(
        Math.max(musicFilter.frequency.value, 120),
        now,
      );
      musicFilter.frequency.exponentialRampToValueAtTime(
        Math.max(cutoff, 180),
        now + attack,
      );
      musicFilter.frequency.setValueAtTime(
        Math.max(cutoff, 180),
        now + attack + hold,
      );
      musicFilter.frequency.exponentialRampToValueAtTime(
        baseCut,
        now + attack + hold + 1.15,
      );
    }
  }

  function cue(id: MusicCue) {
    if (muted || !musicWanted) return;
    const nodes = ensureContext();
    if (!nodes || nodes.ctx.state !== "running") return;
    const now = nodes.ctx.currentTime;
    const bar = (60 / BPM) * 4;
    const gaps: Record<MusicCue, number> = {
      build: 700,
      metric: 520,
      record: 640,
      lift: 900,
      impact: 900,
      celebrate: 1_800,
      finale: 2_400,
    };
    const wall = nowMs();
    if (wall - (lastCueAt.get(id) ?? 0) < gaps[id]) return;
    lastCueAt.set(id, wall);

    switch (id) {
      case "build": {
        if (musicFilter) {
          const from = Math.max(musicFilter.frequency.value, 180);
          musicFilter.frequency.cancelScheduledValues(now);
          musicFilter.frequency.setValueAtTime(from, now);
          musicFilter.frequency.exponentialRampToValueAtTime(420, now + 0.12);
          musicFilter.frequency.exponentialRampToValueAtTime(8_800, now + 0.46);
        }
        bumpLayers({ hats: 0.12, snare: 0.06, kick: -0.12, pads: 0.08 }, null, 0.14, 0.32);
        break;
      }
      case "metric": {
        bumpLayers(
          { arp: 0.28, lead: 0.22, hats: 0.06 },
          Math.min(currentScene.cutoff + 1_600, 7_200),
          0.08,
          bar,
        );
        leadHookUntil = Math.max(leadHookUntil, now + bar);
        break;
      }
      case "record": {
        bumpLayers(
          { kick: 0.1, snare: 0.14, hats: 0.14, bass: 0.12 },
          Math.min(currentScene.cutoff + 2_400, 9_200),
          0.06,
          bar,
        );
        extraEnergyUntil = Math.max(extraEnergyUntil, now + bar);
        break;
      }
      case "lift": {
        bumpLayers(
          { lead: 0.32, arp: 0.18, hats: 0.08 },
          Math.min(currentScene.cutoff + 2_000, 8_400),
          0.08,
          bar * 2,
        );
        brassHookUntil = Math.max(brassHookUntil, now + bar * 2);
        leadHookUntil = Math.max(leadHookUntil, now + bar * 2);
        break;
      }
      case "impact":
      case "celebrate": {
        const pause = SIXTEENTH * 2;
        muteDrumsUntil = now + pause;
        extraEnergyUntil = Math.max(extraEnergyUntil, now + bar * 2);
        brassHookUntil = Math.max(brassHookUntil, now + bar * 2);
        leadHookUntil = Math.max(leadHookUntil, now + bar * 2);
        if (musicFilter) {
          musicFilter.frequency.cancelScheduledValues(now);
          musicFilter.frequency.setValueAtTime(
            Math.max(musicFilter.frequency.value, 200),
            now,
          );
          musicFilter.frequency.exponentialRampToValueAtTime(12_000, now + pause);
        }
        if (musicBus) {
          const current = Math.max(musicBus.gain.value, 0.0001);
          musicBus.gain.cancelScheduledValues(now);
          musicBus.gain.setValueAtTime(current, now);
          musicBus.gain.linearRampToValueAtTime(0.88, now + pause + 0.04);
          musicBus.gain.linearRampToValueAtTime(0.78, now + bar * 2);
        }
        bumpLayers(
          { kick: 0.2, hats: 0.28, snare: 0.24, lead: 0.4, arp: 0.2, bass: 0.18, pads: 0.1 },
          12_000,
          pause,
          bar * 2,
        );
        break;
      }
      case "finale": {
        bumpLayers(
          { pads: 0.18, lead: 0.32, arp: 0.2, hats: -0.06, snare: 0.04, kick: -0.04 },
          5_200,
          0.4,
          bar * 2.5,
        );
        leadHookUntil = Math.max(leadHookUntil, now + bar * 2);
        break;
      }
      default:
        break;
    }
  }

  function applyScene(scene: MusicScene, seconds = 0.78) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const fade = Math.max(0.12, seconds);
    for (const key of LAYER_KEYS) {
      const node = layerGains.get(key);
      if (!node) continue;
      const target = Math.max(scene.layers[key], 0.0001);
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(Math.max(node.gain.value, 0.0001), now);
      node.gain.linearRampToValueAtTime(target, now + fade);
    }
  }

  function mixToScene(scene: MusicScene, grooveChanged: boolean) {
    if (!ctx || !musicFilter) {
      applyScene(scene);
      return;
    }
    const now = ctx.currentTime;
    const dest = Math.max(scene.cutoff, 160);
    const fade = grooveChanged ? 0.62 : 0.82;
    applyScene(scene, fade);
    musicFilter.frequency.cancelScheduledValues(now);
    musicFilter.frequency.setValueAtTime(
      Math.max(musicFilter.frequency.value, 120),
      now,
    );
    if (grooveChanged) {
      musicFilter.frequency.exponentialRampToValueAtTime(420, now + 0.08);
      musicFilter.frequency.exponentialRampToValueAtTime(dest, now + 0.55);
    } else {
      musicFilter.frequency.exponentialRampToValueAtTime(dest, now + fade);
    }
  }

  function setScene(scene: MusicScene) {
    const nodes = ensureContext();
    if (!nodes) return;
    extraEnergyUntil = 0;
    muteDrumsUntil = 0;
    leadHookUntil = 0;
    brassHookUntil = 0;

    if (scene.id === currentScene.id) {
      currentScene = scene;
      mixToScene(scene, false);
      playingGroove = scene.groove;
      playingTrack = scene.track;
      pendingScene = null;
      queuedAtStep = -1;
      return;
    }

    const arrangementChanged =
      scene.groove !== playingGroove || scene.track !== playingTrack;
    pendingScene = scene;
    queuedAtStep = step;
    currentScene = scene;
    mixToScene(scene, arrangementChanged);
    if (!arrangementChanged) {
      playingGroove = scene.groove;
      playingTrack = scene.track;
      pendingScene = null;
      queuedAtStep = -1;
    }
  }

  function startMusicNow() {
    const nodes = ensureContext();
    if (!nodes || !musicWanted || nodes.ctx.state !== "running") return;
    const now = nodes.ctx.currentTime;
    nodes.musicBus.gain.cancelScheduledValues(now);
    nodes.musicBus.gain.setValueAtTime(Math.max(nodes.musicBus.gain.value, 0.0001), now);
    nodes.musicBus.gain.linearRampToValueAtTime(0.78, now + 1.6);
    applyScene(currentScene, 1.2);
    if (nodes.musicFilter) {
      nodes.musicFilter.frequency.cancelScheduledValues(now);
      nodes.musicFilter.frequency.setValueAtTime(
        Math.max(currentScene.cutoff, 160),
        now,
      );
    }
    startPads();
    startScheduler();
  }

  function stopMusicNow() {
    if (!ctx || !musicBus) return;
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
    musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    window.setTimeout(() => {
      if (musicWanted) return;
      stopScheduler();
      stopPads();
    }, 380);
  }

  function startBeat() {
    musicRefs += 1;
    musicWanted = true;
    if (stopTimer != null) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
    const nodes = ensureContext();
    if (!nodes) return;
    if (nodes.ctx.state === "running") {
      startMusicNow();
      return;
    }
    void resume().then(() => {
      if (musicWanted) startMusicNow();
    });
  }

  function stopBeat() {
    musicRefs = Math.max(0, musicRefs - 1);
    if (musicRefs > 0) return;
    if (stopTimer != null) window.clearTimeout(stopTimer);
    stopTimer = window.setTimeout(() => {
      stopTimer = null;
      if (musicRefs > 0) return;
      musicWanted = false;
      stopMusicNow();
    }, 80);
  }

  function playFamily(id: SfxId) {
    const nodes = ensureContext();
    if (!nodes || nodes.ctx.state !== "running") return;
    const audio = nodes.ctx;
    const out = nodes.sfxBus;
    const pitch = rand(0.94, 1.07);
    const vol = rand(0.85, 1.12);

    switch (id) {
      case "whoosh":
      case "transition": {
        if (!canPlay("whoosh", 140)) return;
        const dir = pick([
          { start: 420, end: 2400 },
          { start: 280, end: 1800 },
          { start: 900, end: 2600 },
          { start: 1900, end: 380 },
          { start: 640, end: 2100 },
          { start: 1500, end: 520 },
        ]);
        noiseBurst(audio, out, {
          duration: rand(0.11, 0.18),
          startHz: dir.start,
          endHz: dir.end,
          peak: 0.18 * vol,
        });
        tone(audio, out, {
          frequency: pick([E3, G3, B3]) * pitch,
          type: "triangle",
          peak: 0.08 * vol,
          release: 0.12,
          slideTo: pick([E4, G4, B4]) * pitch,
        });
        break;
      }
      case "sweep":
        if (!canPlay("sweep", 240)) return;
        noiseBurst(audio, out, {
          duration: 0.38,
          startHz: D5 * pitch,
          endHz: E3 * pitch,
          peak: 0.13 * vol,
          q: 0.9,
        });
        break;
      case "rise":
        if (!canPlay("rise", 280)) return;
        tone(audio, out, {
          frequency: pick([E2, G2]) * pitch,
          type: "sawtooth",
          peak: 0.08 * vol,
          attack: 0.12,
          release: 0.38,
          slideTo: pick([B4, D5]) * pitch,
        });
        noiseBurst(audio, out, {
          duration: 0.42,
          startHz: 280,
          endHz: 4200,
          peak: 0.11 * vol,
        });
        break;
      case "air":
        if (!canPlay("air", 140)) return;
        noiseBurst(audio, out, {
          duration: rand(0.12, 0.18),
          startHz: pick([900, 1400, 1800]),
          endHz: pick([3600, 4800, 6200]),
          peak: 0.09 * vol,
          type: "highpass",
        });
        break;
      case "tap":
      case "card":
      case "title":
      case "glow": {
        if (!canPlay("ui", 80)) return;
        const freq = pick(UI_TONES) * pitch;
        tone(audio, out, {
          frequency: freq,
          type: pick(["triangle", "sine"]),
          peak: 0.1 * vol,
          attack: 0.002,
          release: 0.055,
        });
        break;
      }
      case "tick":
        if (!canPlay("tick", 120)) return;
        tone(audio, out, {
          frequency: pick(TICK_TONES) * rand(0.99, 1.02),
          type: "triangle",
          peak: 0.028 * vol,
          attack: 0.002,
          release: 0.028,
        });
        break;
      case "hit":
        if (!canPlay("hit", 90)) return;
        tone(audio, out, {
          frequency: pick([E2, G2, B2]) * pitch,
          type: "sine",
          peak: 0.2 * vol,
          attack: 0.003,
          release: 0.1,
          slideTo: 42,
        });
        noiseBurst(audio, out, {
          duration: 0.06,
          startHz: 1800,
          endHz: 900,
          peak: 0.12 * vol,
        });
        break;
      case "pop":
      case "unlock": {
        if (!canPlay("unlock", 130)) return;
        const unlockA = pick([E4, G4, B4]) * pitch;
        tone(audio, out, {
          frequency: unlockA,
          type: "sine",
          peak: 0.14 * vol,
          release: 0.08,
          slideTo: unlockA * 1.5,
        });
        tone(audio, out, {
          frequency: pick([B4, D5, E4 * 2]) * pitch,
          type: "triangle",
          peak: 0.07 * vol,
          attack: 0.012,
          release: 0.1,
        });
        break;
      }
      case "chime":
      case "confirm": {
        if (!canPlay("confirm", 160)) return;
        const pair = pick(CONFIRM_TONES) ?? [E3, B3];
        tone(audio, out, {
          frequency: pair[0] * pitch,
          peak: 0.14 * vol,
          release: 0.14,
        });
        tone(audio, out, {
          frequency: pair[1] * pitch,
          peak: 0.1 * vol,
          attack: 0.012,
          release: 0.16,
        });
        break;
      }
      case "record":
        if (!canPlay("record", 220)) return;
        tone(audio, out, { frequency: E3 * pitch, peak: 0.14 * vol, release: 0.12 });
        tone(audio, out, {
          frequency: B3 * pitch,
          peak: 0.12 * vol,
          attack: 0.02,
          release: 0.14,
        });
        tone(audio, out, {
          frequency: E4 * pitch,
          peak: 0.09 * vol,
          attack: 0.04,
          release: 0.18,
        });
        break;
      case "sparkle":
        if (!canPlay("sparkle", 240)) return;
        [B4, D5, E4 * 2, G4 * 2].forEach((frequency, index) => {
          window.setTimeout(() => {
            if (muted || !ctx) return;
            tone(ctx, out, {
              frequency: frequency * pitch,
              type: "sine",
              peak: (0.1 - index * 0.016) * vol,
              attack: 0.004,
              release: 0.09,
            });
          }, index * 36);
        });
        break;
      case "brass":
        if (!canPlay("brass", 420)) return;
        TRUMPET_LICK.forEach((frequency, index) => {
          brass(audio, out, frequency * pitch, audio.currentTime + index * 0.078, 0.16 * vol);
        });
        break;
      case "crash":
        if (!canPlay("crash", 260)) return;
        noiseBurst(audio, out, {
          duration: 0.28,
          startHz: 900,
          endHz: 280,
          peak: 0.24 * vol,
          q: 0.55,
        });
        tone(audio, out, {
          frequency: E2,
          type: "sine",
          peak: 0.22 * vol,
          release: 0.22,
          slideTo: 36,
        });
        break;
      case "error":
        if (!canPlay("error", 200)) return;
        tone(audio, out, {
          frequency: B3 * pitch,
          type: "sawtooth",
          peak: 0.1 * vol,
          release: 0.12,
          slideTo: E3,
        });
        break;
      default:
        break;
    }
  }

  function playNow(id: SfxId) {
    if (reducedMotion && (id === "tick" || id === "sparkle")) {
      if (id === "sparkle") playFamily("confirm");
      return;
    }
    playFamily(id);
  }

  function play(_id: SfxId) {
    return;
  }

  function dispose() {
    musicWanted = false;
    musicRefs = 0;
    if (stopTimer != null) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
    stopScheduler();
    stopPads();
    if (ctx) {
      if (musicBus) {
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.value = 0.0001;
      }
      void ctx.close().catch(() => undefined);
    }
    ctx = null;
    master = null;
    sfxBus = null;
    musicBus = null;
    musicFilter = null;
    layerGains.clear();
  }

  return {
    unlock,
    unlockSync,
    setMuted,
    setReducedMotion,
    play,
    startBeat,
    stopBeat,
    setScene,
    cue,
    dispose,
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

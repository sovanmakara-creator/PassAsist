import { useCallback, useRef } from "react";

// ──────────────────────────────────────────────────────
// Web Audio API sound effects + procedural background music
// Zero dependencies, zero audio files, works everywhere
// ──────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// ── Helpers ──────────────────────────────────────────

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNotes(
  notes: number[],
  interval: number,
  type: OscillatorType = "sine",
  volume = 0.25,
) {
  const ctx = getCtx();
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * interval);
    gain.gain.setValueAtTime(volume, ctx.currentTime + i * interval);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * interval + interval * 1.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * interval);
    osc.stop(ctx.currentTime + i * interval + interval * 2);
  });
}

// ── Sound Effects ───────────────────────────────────

export function sfxCorrect() {
  playNotes([523.25, 659.25, 783.99], 0.08, "sine", 0.25);
}

export function sfxWrong() {
  playNotes([311.13, 261.63], 0.12, "square", 0.12);
}

export function sfxFlip() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export function sfxMatch() {
  playNotes([523.25, 659.25, 783.99, 1046.5], 0.06, "sine", 0.2);
}

export function sfxStreak() {
  playNotes([261.63, 329.63, 392.0, 523.25, 659.25], 0.1, "triangle", 0.2);
}

export function sfxTick() {
  playTone(800, 0.05, "sine", 0.15);
}

export function sfxComplete() {
  playNotes([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.12, "triangle", 0.2);
}

// ── Background Music (Procedural Lo-fi Chill) ───────

export type MusicTrack = "lofi" | "upbeat" | "intense" | "ethereal";

const TRACKS: Record<MusicTrack, { chords: number[][]; bpm: number }> = {
  lofi: {
    chords: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ],
    bpm: 68,
  },
  upbeat: {
    chords: [
      [261.63, 329.63, 392.0, 523.25], // C
      [174.61, 220.0, 261.63, 349.23], // F
      [220.0, 261.63, 329.63, 440.0], // Am
      [196.0, 246.94, 293.66, 392.0], // G
    ],
    bpm: 110,
  },
  intense: {
    chords: [
      [146.83, 174.61, 220.0, 293.66], // Dm
      [233.08, 293.66, 349.23, 466.16], // Bb
      [196.0, 233.08, 293.66, 392.0], // Gm
      [220.0, 277.18, 329.63, 440.0], // A
    ],
    bpm: 135,
  },
  ethereal: {
    chords: [
      [329.63, 392.0, 493.88, 659.25], // Em
      [349.23, 440.0, 523.25, 698.46], // F
      [261.63, 329.63, 392.0, 523.25], // C
      [293.66, 392.0, 440.0, 587.33], // Dsus4
    ],
    bpm: 45,
  },
};

interface MusicState {
  isPlaying: boolean;
  volume: number;
  masterGain: GainNode | null;
  intervalId: ReturnType<typeof setInterval> | null;
  chordIndex: number;
  currentTrack: MusicTrack;
}

const musicState: MusicState = {
  isPlaying: false,
  volume: 0.12,
  masterGain: null,
  intervalId: null,
  chordIndex: 0,
  currentTrack: "lofi",
};

function playChord() {
  const ctx = getCtx();
  if (!musicState.masterGain) {
    musicState.masterGain = ctx.createGain();
    musicState.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    musicState.masterGain.connect(ctx.destination);
  }

  const track = TRACKS[musicState.currentTrack];
  const chord = track.chords[musicState.chordIndex % track.chords.length];
  const beatDuration = 60 / track.bpm;
  const chordDuration = beatDuration * 4; // whole note per chord

  chord.forEach((freq) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    noteGain.gain.setValueAtTime(0.5, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + chordDuration * 0.8);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chordDuration);
    osc.connect(noteGain).connect(musicState.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + chordDuration);
  });

  // Add a subtle bass note
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = "triangle";
  bassOsc.frequency.setValueAtTime(chord[0] / 2, ctx.currentTime);
  bassGain.gain.setValueAtTime(0.35, ctx.currentTime);
  bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chordDuration);
  bassOsc.connect(bassGain).connect(musicState.masterGain!);
  bassOsc.start(ctx.currentTime);
  bassOsc.stop(ctx.currentTime + chordDuration);

  // Subtle rhythmic pulse (soft hi-hat-like noise on beats 2 and 4)
  [1, 3].forEach((beat) => {
    const time = ctx.currentTime + beat * beatDuration;
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++)
      channelData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const hpf = ctx.createBiquadFilter();
    noiseSource.buffer = buffer;
    hpf.type = "highpass";
    hpf.frequency.setValueAtTime(6000, time);
    noiseGain.gain.setValueAtTime(0.2, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    noiseSource.connect(hpf).connect(noiseGain).connect(musicState.masterGain!);
    noiseSource.start(time);
  });

  musicState.chordIndex++;
}

export function startMusic() {
  if (musicState.isPlaying) return;
  const ctx = getCtx();
  musicState.isPlaying = true;
  musicState.chordIndex = 0;

  if (!musicState.masterGain) {
    musicState.masterGain = ctx.createGain();
    musicState.masterGain.connect(ctx.destination);
  }

  // Fade in
  musicState.masterGain.gain.setValueAtTime(0, ctx.currentTime);
  musicState.masterGain.gain.linearRampToValueAtTime(musicState.volume, ctx.currentTime + 2);

  const track = TRACKS[musicState.currentTrack];
  const beatDuration = 60 / track.bpm;

  playChord();
  musicState.intervalId = setInterval(playChord, beatDuration * 4 * 1000);
}

export function changeMusicTrack(trackName: MusicTrack) {
  musicState.currentTrack = trackName;
  if (musicState.isPlaying) {
    if (musicState.intervalId) clearInterval(musicState.intervalId);
    musicState.chordIndex = 0;

    // Smooth transition
    const ctx = getCtx();
    if (musicState.masterGain) {
      musicState.masterGain.gain.setValueAtTime(musicState.masterGain.gain.value, ctx.currentTime);
      musicState.masterGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      musicState.masterGain.gain.linearRampToValueAtTime(musicState.volume, ctx.currentTime + 0.5);
    }

    const track = TRACKS[musicState.currentTrack];
    const beatDuration = 60 / track.bpm;
    playChord();
    musicState.intervalId = setInterval(playChord, beatDuration * 4 * 1000);
  }
}

export function getCurrentTrack(): MusicTrack {
  return musicState.currentTrack;
}

export function stopMusic() {
  if (!musicState.isPlaying) return;
  musicState.isPlaying = false;

  if (musicState.masterGain) {
    const ctx = getCtx();
    musicState.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
  }

  if (musicState.intervalId) {
    setTimeout(() => {
      if (musicState.intervalId) {
        clearInterval(musicState.intervalId);
        musicState.intervalId = null;
      }
    }, 2100);
  }
}

export function toggleMusic(): boolean {
  if (musicState.isPlaying) {
    stopMusic();
    return false;
  } else {
    startMusic();
    return true;
  }
}

export function setMusicVolume(vol: number) {
  musicState.volume = Math.max(0, Math.min(1, vol));
  if (musicState.masterGain && musicState.isPlaying) {
    const ctx = getCtx();
    musicState.masterGain.gain.linearRampToValueAtTime(musicState.volume, ctx.currentTime + 0.1);
  }
}

export function isMusicPlaying(): boolean {
  return musicState.isPlaying;
}

// ── React Hook ──────────────────────────────────────

export function useSound() {
  const sfxEnabled = useRef(true);

  const play = useCallback((fn: () => void) => {
    if (sfxEnabled.current) fn();
  }, []);

  return {
    playCorrect: useCallback(() => play(sfxCorrect), [play]),
    playWrong: useCallback((_arg?: any) => play(sfxWrong), [play]),
    playFlip: useCallback(() => play(sfxFlip), [play]),
    playMatch: useCallback(() => play(sfxMatch), [play]),
    playStreak: useCallback(() => play(sfxStreak), [play]),
    playTick: useCallback(() => play(sfxTick), [play]),
    playComplete: useCallback(() => play(sfxComplete), [play]),
    setSfxEnabled: (v: boolean) => {
      sfxEnabled.current = v;
    },
    sfxEnabled,
    // Music controls
    startMusic,
    stopMusic,
    toggleMusic,
    changeMusicTrack,
    getCurrentTrack,
    setMusicVolume,
    isMusicPlaying,
  };
}

export const MUSIC_TRACKS = [
  { id: 'quiet-keys', name: 'Quiet Keys', mood: 'Gentle piano tones' },
  { id: 'blue-hour', name: 'Blue Hour', mood: 'Warm, mellow chords' },
  { id: 'soft-garden', name: 'Soft Garden', mood: 'A light, rounded melody' },
] as const;

export type MusicTrackId = typeof MUSIC_TRACKS[number]['id'];

type Track = {
  tempo: number;
  notes: number[];
  bass: number[];
  wave: OscillatorType;
};

const TRACK_DATA: Record<MusicTrackId, Track> = {
  'quiet-keys': {
    tempo: 82,
    notes: [60, 64, 67, 71, 67, 64, 62, 65, 69, 72, 69, 65, 59, 62, 67, 71, 67, 62, 57, 60, 64, 69, 64, 60],
    bass: [36, 43, 38, 45, 35, 43, 33, 40],
    wave: 'sine',
  },
  'blue-hour': {
    tempo: 74,
    notes: [57, 60, 64, 67, 64, 60, 55, 59, 62, 67, 62, 59, 53, 57, 60, 65, 60, 57, 52, 55, 59, 64, 59, 55],
    bass: [33, 40, 35, 42, 29, 36, 31, 38],
    wave: 'triangle',
  },
  'soft-garden': {
    tempo: 88,
    notes: [62, 66, 69, 74, 69, 66, 64, 67, 71, 76, 71, 67, 57, 61, 64, 69, 64, 61, 59, 62, 66, 71, 66, 62],
    bass: [38, 45, 40, 47, 33, 40, 35, 42],
    wave: 'sine',
  },
};

function frequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class GentleMusicPlayer {
  private context: AudioContext | null = null;
  private timer: number | null = null;
  private step = 0;
  private track: MusicTrackId = 'quiet-keys';
  private playing = false;

  async play(trackId: MusicTrackId): Promise<void> {
    this.track = trackId;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    if (!this.context) this.context = new AudioContextConstructor();
    if (this.context.state === 'suspended') await this.context.resume();
    this.playing = true;
    this.step = 0;
    this.clearTimer();
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), (60 / TRACK_DATA[this.track].tempo) * 1000);
  }

  stop(): void {
    this.playing = false;
    this.clearTimer();
    if (this.context?.state === 'running') void this.context.suspend();
  }

  private clearTimer(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    if (!this.playing || !this.context) return;
    const audio = this.context;
    const track = TRACK_DATA[this.track];
    const beat = 60 / track.tempo;
    const index = this.step;
    const when = audio.currentTime + 0.035;
    this.playNote(track.notes[index % track.notes.length], when, beat * 0.72, track.wave, 0.035);
    if (index % 3 === 0) this.playNote(track.bass[(index / 3) % track.bass.length], when, beat * 2.35, 'sine', 0.022);
    this.step++;
  }

  private playNote(note: number, when: number, duration: number, wave: OscillatorType, volume: number): void {
    if (!this.context) return;
    const audio = this.context;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency(note);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.04);
  }
}

export const backgroundMusic = new GentleMusicPlayer();

export function isMusicTrackId(value: unknown): value is MusicTrackId {
  return MUSIC_TRACKS.some((track) => track.id === value);
}

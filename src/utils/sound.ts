// Lightweight Web Audio API sound effects (zero external assets required)
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08,
    delay = 0,
    endFreq = freq,
    filterCutoff = 3600,
  ) {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.82);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, now);
    filter.Q.setValueAtTime(0.65, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  place() {
    // A soft wooden tap with a little rounded glass resonance.
    this.tone(255, 0.075, 'triangle', 0.055, 0, 205, 1450);
    this.tone(505, 0.085, 'sine', 0.027, 0.008, 440, 2400);
  }

  move() {
    this.tone(360, 0.105, 'sine', 0.045, 0, 294, 2100);
  }

  capture() {
    this.tone(178, 0.12, 'triangle', 0.065, 0, 118, 1200);
    this.tone(302, 0.13, 'sine', 0.035, 0.018, 196, 1800);
  }

  mill() {
    this.tone(392, 0.12, 'sine', 0.035, 0, 392, 2600);
    this.tone(493.88, 0.14, 'sine', 0.038, 0.055, 493.88, 3000);
    this.tone(587.33, 0.18, 'sine', 0.04, 0.11, 587.33, 3200);
  }

  win() {
    // A gentle rising major chord keeps a win rewarding without a sharp arcade beep.
    this.tone(392, 0.2, 'sine', 0.045, 0, 392, 2600);
    this.tone(493.88, 0.22, 'sine', 0.045, 0.075, 493.88, 2800);
    this.tone(587.33, 0.24, 'triangle', 0.04, 0.15, 587.33, 3000);
    this.tone(783.99, 0.36, 'sine', 0.038, 0.23, 783.99, 3200);
  }
}

export const sound = new SoundEngine();

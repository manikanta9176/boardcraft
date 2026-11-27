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

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  place() {
    this.tone(240, 0.09, 'triangle', 0.1);
    this.tone(420, 0.06, 'sine', 0.05);
  }

  move() {
    this.tone(310, 0.08, 'sine', 0.07);
  }

  capture() {
    this.tone(520, 0.09, 'triangle', 0.09);
    this.tone(320, 0.14, 'triangle', 0.08, 0.05);
  }

  mill() {
    this.tone(440, 0.1, 'sine', 0.08);
    this.tone(554.37, 0.12, 'sine', 0.08, 0.06);
    this.tone(659.25, 0.16, 'sine', 0.08, 0.12);
  }

  win() {
    this.tone(523.25, 0.14, 'triangle', 0.09, 0);
    this.tone(659.25, 0.14, 'triangle', 0.09, 0.09);
    this.tone(783.99, 0.16, 'triangle', 0.09, 0.18);
    this.tone(1046.5, 0.28, 'triangle', 0.1, 0.27);
  }
}

export const sound = new SoundEngine();

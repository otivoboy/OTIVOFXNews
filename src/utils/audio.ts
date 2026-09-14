// Web Audio API Synthesizer for Terminal Sound Effects without external dependencies

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private volumeLevel: number = 0.8; // 0 to 1

  public setVolume(volPct: number) {
    this.volumeLevel = Math.max(0, Math.min(1, volPct / 100));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Soft high-tech ping when an economic release evaluates
  playSignalChime(isBullish: boolean = true) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isBullish) {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      } else {
        osc.frequency.setValueAtTime(783.99, now); // G5
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.18); // C5
      }

      const baseGain = 0.08 * this.volumeLevel;
      gain.gain.setValueAtTime(baseGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext failure safely ignored
    }
  }

  // Multi-harmonic institutional alert tone for notifications test
  playNotificationTestTone(toneType: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'BULLISH') {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      if (toneType === 'BULLISH') {
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.20); // C6
        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.20); // E6
      } else if (toneType === 'BEARISH') {
        osc1.frequency.setValueAtTime(880.00, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(440.00, now + 0.20); // A4
        osc2.frequency.setValueAtTime(698.46, now); // F5
        osc2.frequency.exponentialRampToValueAtTime(349.23, now + 0.20); // F4
      } else {
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.18); // A5
        osc2.frequency.setValueAtTime(739.99, now); // F#5
        osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.18); // C#6
      }

      const baseGain = 0.1 * this.volumeLevel;
      gain.gain.setValueAtTime(baseGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  // Subtle tick sound for price updates or checklist step confirmations
  playStepTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.03 * this.volumeLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // Warning alert for high impact event countdown (< 2 mins)
  playWarningAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);

      gain.gain.setValueAtTime(0.05 * this.volumeLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundEffects();

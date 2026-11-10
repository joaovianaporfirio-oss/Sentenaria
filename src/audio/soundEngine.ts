import { AudioSettings, Player } from '../core/types';
import { loadAudioSettings } from '../settings/storageManager';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = loadAudioSettings();

  public updateSettings(settings: AudioSettings): void {
    this.settings = { ...settings };
  }

  public getSettings(): AudioSettings {
    return this.settings;
  }

  private getContext(): AudioContext | null {
    if (!this.settings.soundEnabled || this.settings.masterVolume <= 0) {
      return null;
    }
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    startTimeOffset = 0,
    gainPeak = 0.18,
    endFreq?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + startTimeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFreq),
        now + duration
      );
    }

    const scaledPeak = gainPeak * this.settings.masterVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(scaledPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /**
   * Subtle tactile click for navigating menus (Wii Shop / Duolingo button pop)
   */
  public playMenuClick(): void {
    this.playTone(520, 'sine', 0.065, 0, 0.14, 680);
  }

  public playMenuSecondary(): void {
    this.playTone(420, 'triangle', 0.06, 0, 0.1, 360);
  }

  /**
   * Paper-stamp tactile sound when placing a piece on the board
   */
  public playPiecePlace(player: Player): void {
    if (player === 'red') {
      // Warm wooden/paper pop (C5 -> G5)
      this.playTone(523.25, 'triangle', 0.09, 0, 0.2, 659.25);
      this.playTone(1046.5, 'sine', 0.05, 0.015, 0.08);
    } else {
      // Crisp aqua chime (D5 -> A5)
      this.playTone(587.33, 'triangle', 0.09, 0, 0.2, 783.99);
      this.playTone(1174.66, 'sine', 0.05, 0.015, 0.08);
    }
  }

  /**
   * Gentle buzzer when attempting an invalid move (such as Red clicking the 3x3 center)
   */
  public playInvalidMove(): void {
    this.playTone(210, 'sawtooth', 0.09, 0, 0.1, 175);
    this.playTone(175, 'sawtooth', 0.11, 0.08, 0.1, 145);
  }

  /**
   * Cheerful Duolingo/Wii-inspired chord arpeggio when one or more trincas are formed
   */
  public playTrincaFormed(count = 1): void {
    // Rising major pentatonic chime
    const notes = count > 1 ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.22, i * 0.055, 0.2);
      this.playTone(freq * 1.5, 'sine', 0.16, i * 0.055 + 0.01, 0.07);
    });
  }

  /**
   * Score counter increment ping
   */
  public playScoreUpdate(currentScore: number): void {
    const pitchBoost = Math.min(currentScore, 10) * 35;
    this.playTone(660 + pitchBoost, 'sine', 0.14, 0.12, 0.16, 880 + pitchBoost);
  }

  /**
   * Victory or Defeat fanfare
   */
  public playMatchEnd(outcome: 'win' | 'loss' | 'draw'): void {
    if (outcome === 'win') {
      const fanfare = [
        { f: 523.25, t: 0, d: 0.14 },
        { f: 659.25, t: 0.11, d: 0.14 },
        { f: 783.99, t: 0.22, d: 0.14 },
        { f: 1046.5, t: 0.34, d: 0.42 },
        { f: 783.99, t: 0.52, d: 0.14 },
        { f: 1046.5, t: 0.66, d: 0.55 },
      ];
      for (const n of fanfare) {
        this.playTone(n.f, 'triangle', n.d, n.t, 0.22);
        this.playTone(n.f * 0.5, 'sine', n.d, n.t, 0.12);
      }
    } else if (outcome === 'loss') {
      const notes = [
        { f: 440, t: 0, d: 0.18 },
        { f: 415.3, t: 0.16, d: 0.18 },
        { f: 392.0, t: 0.32, d: 0.18 },
        { f: 349.23, t: 0.48, d: 0.45 },
      ];
      for (const n of notes) {
        this.playTone(n.f, 'triangle', n.d, n.t, 0.16);
      }
    } else {
      // Draw
      this.playTone(440, 'triangle', 0.16, 0, 0.16);
      this.playTone(523.25, 'triangle', 0.16, 0.15, 0.16);
      this.playTone(587.33, 'triangle', 0.32, 0.3, 0.16);
    }
  }
}

export const soundEngine = new SoundEngine();

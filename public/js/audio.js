/**
 * RhythmType Web Audio API Mechanical Keyboard Synthesizer
 * Generates realistic key clicks, spacebar thuds, and error chirps without external audio assets.
 */
class MechanicalAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('rhythm_muted') === 'true';
    this.volume = 0.35;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('rhythm_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Play synthesized key click
   */
  playKey(isSpace = false, isError = false) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    if (isError) {
      // Error sound: Low harsh buzz/thud
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
      return;
    }

    if (isSpace) {
      // Space bar: Deep resonant thud
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      gain.gain.setValueAtTime(this.volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
      return;
    }

    // Standard Mechanical Key Click (Crisp Tactile Click)
    // 1. High frequency sine click pop
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();

    // Randomize pitch slightly (+/- 5%) for natural organic variation
    const baseFreq = 2200 + (Math.random() * 200 - 100);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.015);

    oscGain.gain.setValueAtTime(this.volume * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(oscGain);
    oscGain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.015);

    // 2. Micro noise click burst
    const bufferSize = this.audioCtx.sampleRate * 0.01; // 10ms noise
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.01);
  }
}

// Global Singleton Instance
const audioEngine = new MechanicalAudioEngine();

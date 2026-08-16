// Web Audio API ambient & celestial synthesizer

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private ambientOscillators: (OscillatorNode | AudioNode)[] = [];
  private rainNode: AudioNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a sparkling star birth chime
  playStarChime(freq = 528, intensity = 3) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [freq, freq * 1.25, freq * 1.5, freq * 2, freq * 2.5];

      notes.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);

        // Exponential decay envelope
        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.12 * (intensity / 3), now + idx * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 1.8);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play celestial selection blip
  playStarSelect(freq = 432) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.33, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // ignore
    }
  }

  // Play constellation connection chime
  playConstellationConnect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [392.0, 493.88, 587.33, 783.99, 987.77]; // G major 9th sparkle

      chord.forEach((note, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now + i * 0.08);

        gain.gain.setValueAtTime(0.0001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.1, now + i * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 2.2);
      });
    } catch {
      // ignore
    }
  }

  // Singing bowl meditation chime for breathwork
  playSingingBowl(freq = 261.63, duration = 4.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Base tone + harmonic overtones
      const harmonics = [1, 2.02, 3.01, 4.05];
      const gains = [0.15, 0.08, 0.04, 0.02];

      harmonics.forEach((h, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(gains[idx], now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.2);
      });
    } catch {
      // ignore
    }
  }

  // Start continuous ambient soundscape
  startAmbientTrack(type: 'cosmic_drift' | 'starlight_rain' | 'alpha_binaural' | 'zen_bowl', volume = 0.3) {
    try {
      this.stopAmbientTrack();
      this.initCtx();
      if (!this.ctx) return;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(volume, this.ctx.currentTime + 1.5);
      this.ambientGain.connect(this.ctx.destination);

      if (type === 'cosmic_drift' || type === 'zen_bowl') {
        const rootFreq = type === 'cosmic_drift' ? 108 : 136.1; // Om frequency
        const freqs = [rootFreq, rootFreq * 1.5, rootFreq * 2, rootFreq * 3, rootFreq * 4.02];

        freqs.forEach((f) => {
          if (!this.ctx || !this.ambientGain) return;
          const osc = this.ctx.createOscillator();
          const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, this.ctx.currentTime);

          if (panner) {
            panner.pan.setValueAtTime((Math.random() - 0.5) * 0.8, this.ctx.currentTime);
            osc.connect(filter);
            filter.connect(panner);
            panner.connect(this.ambientGain);
          } else {
            osc.connect(filter);
            filter.connect(this.ambientGain);
          }

          osc.start();
          this.ambientOscillators.push(osc);
        });
      } else if (type === 'alpha_binaural') {
        // Binaural beat: 432 Hz in Left, 442 Hz in Right = 10 Hz Alpha wave
        const leftOsc = this.ctx.createOscillator();
        const rightOsc = this.ctx.createOscillator();
        const merger = this.ctx.createChannelMerger(2);

        leftOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(216, this.ctx.currentTime);
        rightOsc.type = 'sine';
        rightOsc.frequency.setValueAtTime(226, this.ctx.currentTime); // 10Hz diff

        leftOsc.connect(merger, 0, 0);
        rightOsc.connect(merger, 0, 1);
        merger.connect(this.ambientGain);

        leftOsc.start();
        rightOsc.start();
        this.ambientOscillators.push(leftOsc, rightOsc);
      } else if (type === 'starlight_rain') {
        // Synthesize gentle ambient rain noise
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02; // Pink-ish noise
          lastOut = data[i];
          data[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.ambientGain);
        noise.start();
        this.rainNode = noise;
      }

      this.isAmbientPlaying = true;
    } catch {
      // Audio issue fallback
    }
  }

  setAmbientVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  stopAmbientTrack() {
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        this.ambientOscillators.forEach((osc) => {
          try {
            (osc as OscillatorNode).stop?.();
            osc.disconnect();
          } catch {
            // ignore
          }
        });
        this.ambientOscillators = [];
        if (this.rainNode) {
          try {
            (this.rainNode as AudioBufferSourceNode).stop?.();
            this.rainNode.disconnect();
          } catch {
            // ignore
          }
          this.rainNode = null;
        }
        this.isAmbientPlaying = false;
      }, 500);
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  getIsPlaying() {
    return this.isAmbientPlaying;
  }
}

export const sound = new SoundEngine();

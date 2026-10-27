// Web Audio API harmonic sound generator for gentle, non-jarring caregiver alerts
// With boosted loudness, dynamics compression, and dedicated alert signatures for pitch simulations

let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let compressorNode: DynamicsCompressorNode | null = null;
let masterVolume = 1.0; // 0.0 to 1.5

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Dynamics compressor acts as a transparent brickwall limiter to allow high loudness without clipping
      compressorNode = audioCtx.createDynamicsCompressor();
      compressorNode.threshold.setValueAtTime(-6, audioCtx.currentTime);
      compressorNode.knee.setValueAtTime(10, audioCtx.currentTime);
      compressorNode.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(masterVolume, audioCtx.currentTime);

      masterGainNode.connect(compressorNode);
      compressorNode.connect(audioCtx.destination);
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Global unlock helper for mobile browsers (iOS Safari, Android Chrome)
export function unlockAudio(): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play a 1ms inaudible buffer to force mobile audio pipeline activation
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    return true;
  } catch {
    return false;
  }
}

// Attach automatic unlock listeners on first user touch or click
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockAudio();
    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
      window.removeEventListener(evt, handleFirstInteraction);
    });
  };
  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, handleFirstInteraction, { passive: true, once: false });
  });
}

function getDestination(): AudioNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return masterGainNode || ctx.destination;
}

export const soundEffects = {
  unlockAudio,

  setMasterVolume: (val: number) => {
    masterVolume = Math.max(0, Math.min(1.5, val));
    if (audioCtx && masterGainNode) {
      masterGainNode.gain.setValueAtTime(masterVolume, audioCtx.currentTime);
    }
  },

  getMasterVolume: () => masterVolume,

  // 1. FALL DETECTED (High-Priority Critical Medical Alarm - Increased Loudness)
  // 3 urgent dual-pulse bursts with rich harmonics
  playFallAlert: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      // 3 cycles of rapid urgent beeps
      const pulses = [
        { freq: 880, start: 0.0, dur: 0.12 },
        { freq: 1174.66, start: 0.14, dur: 0.14 },
        { freq: 880, start: 0.35, dur: 0.12 },
        { freq: 1174.66, start: 0.49, dur: 0.14 },
        { freq: 880, start: 0.70, dur: 0.12 },
        { freq: 1318.51, start: 0.84, dur: 0.22 },
      ];

      pulses.forEach(({ freq, start, dur }) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now + start);

        osc2.type = 'triangle'; // adds punchy harmonic presence without distortion
        osc2.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.85, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);

        osc1.start(now + start);
        osc2.start(now + start);
        osc1.stop(now + start + dur + 0.05);
        osc2.stop(now + start + dur + 0.05);
      });
    } catch {}
  },

  // 2. LEFT SAFE ZONE / WANDERING (High-Priority Boundary Breach Siren - Increased Loudness)
  // Two-tone alternating geofence siren pulse
  playWanderingAlert: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const beeps = [
        { freq: 659.25, start: 0.0, dur: 0.2 }, // E5
        { freq: 880.0, start: 0.22, dur: 0.25 }, // A5
        { freq: 659.25, start: 0.5, dur: 0.2 },
        { freq: 880.0, start: 0.72, dur: 0.25 },
        { freq: 659.25, start: 1.0, dur: 0.2 },
        { freq: 987.77, start: 1.22, dur: 0.35 }, // B5 crescendo
      ];

      beeps.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(freq * 1.5, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.85, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(dest);

        osc.start(now + start);
        harmonic.start(now + start);
        osc.stop(now + start + dur + 0.05);
        harmonic.stop(now + start + dur + 0.05);
      });
    } catch {}
  },

  // 3. UNUSUAL NIGHT-TIME MOVEMENT (Wake-up Cautionary Sequence - Increased Loudness)
  // Resonant, penetrating nocturnal alarm sequence
  playNightMovementAlert: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0.0, dur: 0.22 }, // C5
        { freq: 659.25, start: 0.18, dur: 0.22 }, // E5
        { freq: 783.99, start: 0.36, dur: 0.26 }, // G5
        { freq: 1046.5, start: 0.56, dur: 0.35 }, // C6
        { freq: 783.99, start: 0.95, dur: 0.22 },
        { freq: 1046.5, start: 1.15, dur: 0.45 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        sub.type = 'triangle';
        sub.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.8, now + start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(dest);

        osc.start(now + start);
        sub.start(now + start);
        osc.stop(now + start + dur + 0.05);
        sub.stop(now + start + dur + 0.05);
      });
    } catch {}
  },

  // 4. PENDANT REMOVED (Hardware Sensor Detachment Alarm - Increased Loudness)
  // Sharp descending/ascending detachment alert pattern
  playPendantRemovedAlert: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const sequence = [
        { freq: 932.33, start: 0.0, dur: 0.14 }, // A#5
        { freq: 783.99, start: 0.12, dur: 0.14 }, // G5
        { freq: 659.25, start: 0.24, dur: 0.14 }, // E5
        { freq: 523.25, start: 0.36, dur: 0.18 }, // C5
        { freq: 880.0, start: 0.58, dur: 0.3 },  // A5 alert
      ];

      sequence.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth'; // distinct buzzer character for hardware alert
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.75, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        // Low-pass filter to smooth sawtooth so it's punchy without harshness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now + start);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch {}
  },

  // Emergency chime: 3 warm harmonic notes (boosted volume)
  playEmergencyChime: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.4 }, // C5
        { freq: 659.25, time: 0.18, dur: 0.4 }, // E5
        { freq: 783.99, time: 0.36, dur: 0.6 }, // G5
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.linearRampToValueAtTime(0.8, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {}
  },

  // Soft warning chime: warm double tone (boosted volume)
  playWarningTone: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, time: 0.0, dur: 0.3 }, // D5
        { freq: 739.99, time: 0.15, dur: 0.45 }, // F#5
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.0001, now + time);
        gain.gain.linearRampToValueAtTime(0.7, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {}
  },

  // SMS alert pop tone (boosted volume)
  playSmsNotification: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.75, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  },

  // Acknowledged calming ascending chord (boosted volume)
  playAcknowledgeChime: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const chord = [440, 554.37, 659.25, 880]; // A major

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.65, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.55);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch {}
  },

  // Reset to normal sound: gentle peaceful chime (boosted volume)
  playResetTone: () => {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.linearRampToValueAtTime(523.25, now + 0.4);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.65, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  },
};

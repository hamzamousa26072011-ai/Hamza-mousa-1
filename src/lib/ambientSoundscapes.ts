// Web Audio API Procedural Ambient Soundscapes Synthesizer
// Synthesizes: Silent, White Noise, Gentle Rain, 40Hz Gamma, Warm Hearth
// 100% client-side, zero external assets, instant zero-latency playback

export type SoundscapeType = "silent" | "white_noise" | "gentle_rain" | "gamma_40hz" | "warm_hearth";

export interface SoundscapeOption {
  id: SoundscapeType;
  label: string;
  subLabel: string;
  iconType: "silent" | "white_noise" | "gentle_rain" | "gamma_40hz" | "warm_hearth";
}

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: "silent", label: "Silent", subLabel: "Pure Quiet", iconType: "silent" },
  { id: "white_noise", label: "White Noise", subLabel: "Night Ambience", iconType: "white_noise" },
  { id: "gentle_rain", label: "Gentle Rain", subLabel: "Soft Droplets", iconType: "gentle_rain" },
  { id: "gamma_40hz", label: "40Hz Gamma", subLabel: "Focus Waves", iconType: "gamma_40hz" },
  { id: "warm_hearth", label: "Warm Hearth", subLabel: "Fireplace", iconType: "warm_hearth" },
];

let audioCtx: AudioContext | null = null;
let currentSoundscape: SoundscapeType = "silent";
let masterGainNode: GainNode | null = null;
let activeSourceNode: AudioNode | null = null;
let secondarySourceNode: AudioNode | null = null;
let activeInterval: any = null;
let currentVolume = 0.5;
let isSoundscapePaused = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended" && !isSoundscapePaused) {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ensure master gain is initialized
function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGainNode) {
    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
  }
  return masterGainNode;
}

// Cached night white noise buffer
let cachedNightNoiseBuffer: AudioBuffer | null = null;

// 1. NOCTURNAL NIGHT AMBIENCE BUFFER (Gentle Night Breeze & Rhythmic Crickets from user recording)
function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNightNoiseBuffer && cachedNightNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNightNoiseBuffer;
  }

  const sampleRate = ctx.sampleRate;
  const duration = 14; // 14-second seamless loop
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // 1. Warm nocturnal night air / gentle breeze
  let b0_l = 0, b1_l = 0, b2_l = 0, b3_l = 0;
  let b0_r = 0, b1_r = 0, b2_r = 0, b3_r = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Slow gentle night air swell
    const airSwell = 0.82 + 0.18 * Math.sin(2 * Math.PI * t / (duration / 2));

    // Pink/warm noise left
    const wL = (Math.random() * 2 - 1);
    b0_l = 0.99886 * b0_l + wL * 0.0555;
    b1_l = 0.99332 * b1_l + wL * 0.0750;
    b2_l = 0.96900 * b2_l + wL * 0.1538;
    b3_l = 0.86650 * b3_l + wL * 0.3104;
    const pinkL = (b0_l + b1_l + b2_l + b3_l + wL * 0.536) * 0.038 * airSwell;

    // Pink/warm noise right
    const wR = (Math.random() * 2 - 1);
    b0_r = 0.99886 * b0_r + wR * 0.0555;
    b1_r = 0.99332 * b1_r + wR * 0.0750;
    b2_r = 0.96900 * b2_r + wR * 0.1538;
    b3_r = 0.86650 * b3_r + wR * 0.3104;
    const pinkR = (b0_r + b1_r + b2_r + b3_r + wR * 0.536) * 0.038 * airSwell;

    left[i] = pinkL;
    right[i] = pinkR;
  }

  // 2. Realistic nocturnal crickets with organic rhythmic pulse trains
  const crickets = [
    { freq: 4480, pan: 0.30, interval: 0.55, pulseCount: 4, pulseDuration: 0.015, pulseGap: 0.013, amp: 0.065, phaseOffset: 0.04 },
    { freq: 4720, pan: 0.72, interval: 0.68, pulseCount: 3, pulseDuration: 0.016, pulseGap: 0.014, amp: 0.055, phaseOffset: 0.22 },
    { freq: 4350, pan: 0.18, interval: 0.82, pulseCount: 5, pulseDuration: 0.014, pulseGap: 0.012, amp: 0.045, phaseOffset: 0.45 },
    { freq: 4890, pan: 0.85, interval: 1.10, pulseCount: 4, pulseDuration: 0.013, pulseGap: 0.016, amp: 0.035, phaseOffset: 0.75 },
  ];

  crickets.forEach((c) => {
    let chirpStart = c.phaseOffset;
    while (chirpStart < duration) {
      for (let p = 0; p < c.pulseCount; p++) {
        const pStart = chirpStart + p * (c.pulseDuration + c.pulseGap);
        const pEnd = pStart + c.pulseDuration;
        const startSample = Math.floor(pStart * sampleRate);
        const endSample = Math.floor(pEnd * sampleRate);
        const pSamples = endSample - startSample;

        for (let s = 0; s < pSamples; s++) {
          const idx = (startSample + s) % numSamples;
          const norm = s / pSamples;
          // Raised-cosine envelope for smooth organic syllable shape
          const env = 0.5 * (1 - Math.cos(2 * Math.PI * norm));
          const sampleT = idx / sampleRate;
          const tone = Math.sin(2 * Math.PI * c.freq * sampleT) * 0.88 + 
                       Math.sin(2 * Math.PI * (c.freq * 2) * sampleT) * 0.12;
          const val = tone * env * c.amp;

          left[idx] += val * (1 - c.pan * 0.55);
          right[idx] += val * (0.45 + c.pan * 0.55);
        }
      }
      chirpStart += c.interval;
    }
  });

  // 3. Diffuse distant nocturnal chorus shimmer
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const shimmerL = Math.sin(2 * Math.PI * 4550 * t) * (0.009 + 0.004 * Math.sin(2 * Math.PI * 16 * t)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t));
    const shimmerR = Math.sin(2 * Math.PI * 4590 * t) * (0.009 + 0.004 * Math.cos(2 * Math.PI * 15 * t)) * (0.8 + 0.2 * Math.cos(2 * Math.PI * 0.5 * t));
    left[i] += shimmerL;
    right[i] += shimmerR;
  }

  // 4. Boundary crossfade (0.2s) to guarantee zero click at loop seam
  const xfadeLen = Math.floor(0.2 * sampleRate);
  for (let i = 0; i < xfadeLen; i++) {
    const alpha = i / xfadeLen;
    const startIdx = i;
    const endIdx = numSamples - xfadeLen + i;
    
    const blendedL = left[endIdx] * (1 - alpha) + left[startIdx] * alpha;
    const blendedR = right[endIdx] * (1 - alpha) + right[startIdx] * alpha;

    left[startIdx] = blendedL;
    right[startIdx] = blendedR;
    left[endIdx] = blendedL;
    right[endIdx] = blendedR;
  }

  cachedNightNoiseBuffer = buffer;
  return buffer;
}

// 2. RAIN NOISE BUFFER (Pink/Brown noise mix)
function createRainBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
      b6 = white * 0.115926;
      data[i] = pink;
    }
  }
  return buffer;
}

// 3. WARM HEARTH BUFFER (Deep Brown Noise for Cozy Fire Rumbling)
function createHearthBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 0.45;
    }
  }
  return buffer;
}

// Random Rain Droplet transient
function playSoftRainDrop(ctx: AudioContext, target: GainNode) {
  try {
    const osc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    const baseFreq = 700 + Math.random() * 800;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, ctx.currentTime + 0.07);

    dropGain.gain.setValueAtTime(0.001, ctx.currentTime);
    dropGain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, ctx.currentTime + 0.01);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    osc.connect(dropGain);
    dropGain.connect(target);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

// Random Fire Crackle Pop transient
function playFireCrackle(ctx: AudioContext, target: GainNode) {
  try {
    const osc = ctx.createOscillator();
    const popGain = ctx.createGain();
    const freq = 1200 + Math.random() * 2400;
    osc.type = Math.random() > 0.5 ? "triangle" : "sawtooth";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    popGain.gain.setValueAtTime(0.001, ctx.currentTime);
    popGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.05, ctx.currentTime + 0.005);
    popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(popGain);
    popGain.connect(target);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

// Stop current playing nodes completely
export function stopAllSoundscapes() {
  isSoundscapePaused = false;
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  if (activeSourceNode) {
    try {
      (activeSourceNode as any).stop?.();
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }

  if (secondarySourceNode) {
    try {
      (secondarySourceNode as any).stop?.();
      secondarySourceNode.disconnect();
    } catch {}
    secondarySourceNode = null;
  }

  if (masterGainNode && audioCtx) {
    try {
      masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } catch {}
  }

  currentSoundscape = "silent";
}

// Pause active soundscape when timer is paused (instantly cuts sound and clears nodes, preserves currentSoundscape for resumption)
export function pauseSoundscape() {
  isSoundscapePaused = true;

  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  if (activeSourceNode) {
    try {
      (activeSourceNode as any).stop?.();
      activeSourceNode.disconnect();
    } catch {}
    activeSourceNode = null;
  }

  if (secondarySourceNode) {
    try {
      (secondarySourceNode as any).stop?.();
      secondarySourceNode.disconnect();
    } catch {}
    secondarySourceNode = null;
  }

  if (masterGainNode && audioCtx) {
    try {
      masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } catch {}
  }

  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend().catch(() => {});
  }
}

// Resume soundscape when timer resumes
export function resumeSoundscape(volume = currentVolume) {
  isSoundscapePaused = false;
  if (currentSoundscape === "silent") return;

  currentVolume = Math.max(0.0, Math.min(1.0, volume));
  setSoundscape(currentSoundscape, currentVolume);
}

export function isSoundscapePausedState(): boolean {
  return isSoundscapePaused;
}

// Start or Switch Soundscape
export function setSoundscape(type: SoundscapeType, volume = currentVolume) {
  currentVolume = Math.max(0.0, Math.min(1.0, volume));

  if (type === "silent") {
    stopAllSoundscapes();
    currentSoundscape = "silent";
    return;
  }

  isSoundscapePaused = false;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Stop whatever was playing before
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
    if (activeSourceNode) {
      try {
        (activeSourceNode as any).stop?.();
        activeSourceNode.disconnect();
      } catch {}
      activeSourceNode = null;
    }
    if (secondarySourceNode) {
      try {
        (secondarySourceNode as any).stop?.();
        secondarySourceNode.disconnect();
      } catch {}
      secondarySourceNode = null;
    }

    const master = getMasterGain(ctx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(currentVolume, ctx.currentTime);
    currentSoundscape = type;

    if (type === "white_noise") {
      // Nocturnal white noise (gentle night air & rhythmic crickets from video)
      const noise = ctx.createBufferSource();
      noise.buffer = createWhiteNoiseBuffer(ctx);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(6500, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.start(0);

      activeSourceNode = noise;
    } else if (type === "gentle_rain") {
      // Gentle rainfall with randomized droplets
      const rain = ctx.createBufferSource();
      rain.buffer = createRainBuffer(ctx);
      rain.loop = true;

      const lowPass = ctx.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.setValueAtTime(1500, ctx.currentTime);

      const highPass = ctx.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.setValueAtTime(220, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.75, ctx.currentTime);

      rain.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(rainGain);
      rainGain.connect(master);
      rain.start(0);

      activeSourceNode = rain;

      // Droplets
      activeInterval = setInterval(() => {
        if (currentSoundscape === "gentle_rain" && ctx.state === "running") {
          if (Math.random() > 0.45) {
            playSoftRainDrop(ctx, rainGain);
          }
        }
      }, 190);
    } else if (type === "gamma_40hz") {
      // 40Hz Gamma Brainwave entrainment
      // 200Hz warm fundamental modulated by 40Hz LFO + soft supportive noise floor
      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(196.0, ctx.currentTime); // G3 warm grounded tone

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(0.4, ctx.currentTime);

      // 40Hz amplitude modulator
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(40.0, ctx.currentTime); // Gamma 40Hz

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);
      lfo.connect(lfoGain.gain);

      carrier.connect(modGain);
      modGain.connect(master);

      carrier.start(0);
      lfo.start(0);

      activeSourceNode = carrier;
      secondarySourceNode = lfo;
    } else if (type === "warm_hearth") {
      // Cozy Fireplace: deep brown noise + sporadic burning ember crackles
      const hearth = ctx.createBufferSource();
      hearth.buffer = createHearthBuffer(ctx);
      hearth.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, ctx.currentTime);

      const hearthGain = ctx.createGain();
      hearthGain.gain.setValueAtTime(0.8, ctx.currentTime);

      hearth.connect(filter);
      filter.connect(hearthGain);
      hearthGain.connect(master);
      hearth.start(0);

      activeSourceNode = hearth;

      // Ember crackle interval
      activeInterval = setInterval(() => {
        if (currentSoundscape === "warm_hearth" && ctx.state === "running") {
          if (Math.random() > 0.35) {
            playFireCrackle(ctx, hearthGain);
          }
        }
      }, 140);
    }
  } catch (err) {
    console.warn("Soundscape synthesizer error:", err);
  }
}

// Update volume dynamically
export function setSoundscapeVolume(vol: number) {
  currentVolume = Math.max(0.0, Math.min(1.0, vol));
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.linearRampToValueAtTime(currentVolume, audioCtx.currentTime + 0.1);
  }
}

export function getCurrentSoundscape(): SoundscapeType {
  return currentSoundscape;
}

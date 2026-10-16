// Web Audio API Procedural Ambient Soundscapes Synthesizer
// Synthesizes: Silent and White Noise (Gentle Rain with Soft Droplets)
// 100% client-side, zero external assets, instant zero-latency playback

export type SoundscapeType = "silent" | "white_noise";

export interface SoundscapeOption {
  id: SoundscapeType;
  label: string;
  subLabel: string;
  iconType: "silent" | "white_noise";
}

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: "silent", label: "Silent", subLabel: "Pure Quiet", iconType: "silent" },
  { id: "white_noise", label: "White Noise", subLabel: "Gentle Rain", iconType: "white_noise" },
];

let audioCtx: AudioContext | null = null;
let currentSoundscape: SoundscapeType = "silent";
let masterGainNode: GainNode | null = null;
let activeSourceNode: AudioNode | null = null;
let activeInterval: any = null;
let currentVolume = 0.6;
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

// Cached rain noise buffer
let cachedRainBuffer: AudioBuffer | null = null;

// RAIN NOISE BUFFER (Pink & Brown noise mix for realistic soft rainfall)
function createRainBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedRainBuffer && cachedRainBuffer.sampleRate === ctx.sampleRate) {
    return cachedRainBuffer;
  }

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

  // Crossfade at boundaries for seamless infinite looping
  const xfade = Math.floor(0.1 * ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < xfade; i++) {
      const alpha = i / xfade;
      const endIdx = bufferSize - xfade + i;
      data[i] = data[endIdx] * (1 - alpha) + data[i] * alpha;
    }
  }

  cachedRainBuffer = buffer;
  return buffer;
}

// Random Rain Droplet transient (organic soft clicks & water drops)
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

  currentSoundscape = "silent";
}

// Pause current soundscape (e.g. when timer paused)
export function pauseSoundscape() {
  if (currentSoundscape === "silent") return;
  isSoundscapePaused = true;
  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend().catch(() => {});
  }
}

// Resume soundscape when timer resumed
export function resumeSoundscape() {
  if (currentSoundscape === "silent") return;
  isSoundscapePaused = false;
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
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

    const master = getMasterGain(ctx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(currentVolume, ctx.currentTime);
    currentSoundscape = type;

    // White Noise (gentle rain with soft droplets)
    const rain = ctx.createBufferSource();
    rain.buffer = createRainBuffer(ctx);
    rain.loop = true;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.setValueAtTime(1600, ctx.currentTime);

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

    // Organic soft rain droplets
    activeInterval = setInterval(() => {
      if (currentSoundscape === "white_noise" && ctx.state === "running") {
        if (Math.random() > 0.45) {
          playSoftRainDrop(ctx, rainGain);
        }
      }
    }, 190);
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

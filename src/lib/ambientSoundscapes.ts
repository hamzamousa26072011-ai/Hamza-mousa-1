// High-Fidelity Artificial Calm Rain Soundscape (Web Audio API)
// Seamless, continuous, gentle rain sound with soft drops
// Uses /custom_calm_rain.mp3 (with /custom_calm_rain.wav & procedural fallback)
// Completely steady & soothing — NO water pouring or shower rush

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
let rainSourceNode: AudioBufferSourceNode | null = null;
let currentVolume = 0.6;
let isSoundscapePaused = false;
let rainAudioBuffer: AudioBuffer | null = null;
let isPreloading = false;

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

// Master Gain Node for smooth volume control
function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGainNode) {
    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
  }
  return masterGainNode;
}

/**
 * Procedural fallback buffer in case audio file cannot be loaded (e.g. offline/network err)
 */
function createProceduralCalmRainBuffer(ctx: AudioContext): AudioBuffer {
  const durationSec = 8;
  const sampleRate = ctx.sampleRate;
  const numSamples = sampleRate * durationSec;
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < numSamples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;

      const t = i / sampleRate;
      const subtleBreath = 1.0 + 0.06 * Math.sin(2 * Math.PI * 0.1 * t + (ch === 1 ? 0.8 : 0));
      data[i] = pink * subtleBreath;
    }
  }

  // Crossfade ends for loop
  const xfadeLen = Math.floor(0.3 * sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < xfadeLen; i++) {
      const alpha = i / xfadeLen;
      const startIdx = i;
      const endIdx = numSamples - xfadeLen + i;
      data[startIdx] = data[endIdx] * (1 - alpha) + data[startIdx] * alpha;
    }
  }

  return buffer;
}

/**
 * Pre-fetch and decode the calm rain audio file into memory for instant zero-latency playback
 */
export async function preloadRainAudio(): Promise<AudioBuffer | null> {
  if (rainAudioBuffer) return rainAudioBuffer;
  if (isPreloading) return null;
  if (typeof window === "undefined") return null;

  isPreloading = true;
  const ctx = getAudioContext();

  const candidateUrls = [
    "/custom_calm_rain.mp3",
    "/custom_calm_rain.wav",
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      if (decoded && decoded.duration > 0) {
        rainAudioBuffer = decoded;
        isPreloading = false;
        return decoded;
      }
    } catch {
      // try next candidate
    }
  }

  // Fallback if network fails
  rainAudioBuffer = createProceduralCalmRainBuffer(ctx);
  isPreloading = false;
  return rainAudioBuffer;
}

// Automatically trigger preload on load in browser environment
if (typeof window !== "undefined") {
  setTimeout(() => {
    preloadRainAudio().catch(() => {});
  }, 300);
}

// Stop all sound synthesis completely
export function stopAllSoundscapes() {
  isSoundscapePaused = false;

  if (rainSourceNode) {
    try {
      rainSourceNode.stop();
      rainSourceNode.disconnect();
    } catch {}
    rainSourceNode = null;
  }

  currentSoundscape = "silent";
}

// Pause rain sound (e.g. when timer paused)
export function pauseSoundscape() {
  if (currentSoundscape === "silent") return;
  isSoundscapePaused = true;

  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend().catch(() => {});
  }
}

// Resume rain sound when timer resumes
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

// Start or Switch Soundscape to artificial gentle rain
export async function setSoundscape(type: SoundscapeType, volume = currentVolume) {
  currentVolume = Math.max(0.0, Math.min(1.0, volume));

  if (type === "silent") {
    stopAllSoundscapes();
    currentSoundscape = "silent";
    return;
  }

  isSoundscapePaused = false;
  currentSoundscape = "white_noise";

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    // Stop existing node if playing
    if (rainSourceNode) {
      try {
        rainSourceNode.stop();
        rainSourceNode.disconnect();
      } catch {}
      rainSourceNode = null;
    }

    const master = getMasterGain(ctx);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(currentVolume, ctx.currentTime);

    // Get buffer (cached, preloaded, or fallback)
    let buffer = rainAudioBuffer;
    if (!buffer) {
      buffer = await preloadRainAudio();
    }
    if (!buffer) {
      buffer = createProceduralCalmRainBuffer(ctx);
    }

    // If user switched back to silent while loading, abort
    if (currentSoundscape !== "white_noise") return;

    // Create highpass filter to eliminate sub-bass rumble
    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.setValueAtTime(200, ctx.currentTime);
    highPass.Q.setValueAtTime(0.5, ctx.currentTime);

    // Create lowpass filter to remove harshness above 12000Hz
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.setValueAtTime(11000, ctx.currentTime);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Connect: source -> highPass -> lowPass -> master -> destination
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(master);

    source.start(0);
    rainSourceNode = source;

  } catch (err) {
    console.warn("White noise soundscape playback error:", err);
  }
}

// Update volume dynamically with smooth ramp
export function setSoundscapeVolume(vol: number) {
  currentVolume = Math.max(0.0, Math.min(1.0, vol));

  if (masterGainNode && audioCtx) {
    masterGainNode.gain.linearRampToValueAtTime(currentVolume, audioCtx.currentTime + 0.05);
  }
}

export function getCurrentSoundscape(): SoundscapeType {
  return currentSoundscape;
}

// High-Performance White Noise / Ambient Soundscape Engine
// Seamless, continuous playback with ZERO lagging, ZERO stutters, and ZERO resets.
// Plays the full 7:47 rain audio on a perpetual hardware-accelerated loop.

export type SoundscapeType = "silent" | "white_noise";

export interface SoundscapeOption {
  id: SoundscapeType;
  label: string;
  subLabel: string;
  iconType: "silent" | "white_noise";
}

export const MAIN_AUDIO_URL = "/user_white_noise.mp3";
export const FALLBACK_AUDIO_URL = "/custom_calm_rain.mp3";

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: "silent", label: "Silent", subLabel: "Pure Quiet", iconType: "silent" },
  { id: "white_noise", label: "White Noise", subLabel: "Gentle Rain Loop", iconType: "white_noise" },
];

let sharedAudio: HTMLAudioElement | null = null;
let currentSoundscape: SoundscapeType = "silent";
let currentVolume = 0.6;
let isSoundscapePaused = false;
let isInitializing = false;

function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!sharedAudio && !isInitializing) {
    isInitializing = true;
    try {
      const audio = new Audio();
      audio.src = MAIN_AUDIO_URL;
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = currentVolume;

      // Failover fallback
      audio.addEventListener("error", () => {
        if (audio.src.includes("user_white_noise.mp3")) {
          audio.src = FALLBACK_AUDIO_URL;
          audio.loop = true;
          if (currentSoundscape === "white_noise" && !isSoundscapePaused) {
            audio.play().catch(() => {});
          }
        }
      });

      // Keep loop seamless across all devices
      audio.addEventListener("ended", () => {
        if (currentSoundscape === "white_noise" && !isSoundscapePaused) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      });

      // Auto-resume if buffering stalled
      audio.addEventListener("canplay", () => {
        if (currentSoundscape === "white_noise" && !isSoundscapePaused && audio.paused) {
          audio.play().catch(() => {});
        }
      });

      sharedAudio = audio;
    } finally {
      isInitializing = false;
    }
  }

  return sharedAudio;
}

/**
 * Pre-cache audio on initial page load so start is instantaneous (zero lag)
 */
export function preloadRainAudio() {
  if (typeof window === "undefined") return;
  const audio = getAudioElement();
  if (audio && audio.readyState < 2) {
    audio.load();
  }
}

// Preload quietly on load
if (typeof window !== "undefined") {
  setTimeout(() => {
    preloadRainAudio();
  }, 100);
}

/**
 * Stop sound playback completely (silent mode).
 */
export function stopAllSoundscapes() {
  isSoundscapePaused = false;
  currentSoundscape = "silent";

  if (sharedAudio && !sharedAudio.paused) {
    sharedAudio.pause();
  }
}

/**
 * Pause sound (e.g. timer pause, spacebar).
 * Keeps currentTime preserved so the loop never resets.
 */
export function pauseSoundscape() {
  if (currentSoundscape === "silent") return;
  isSoundscapePaused = true;

  if (sharedAudio && !sharedAudio.paused) {
    sharedAudio.pause();
  }
}

/**
 * Resume sound (e.g. timer resume, spacebar).
 * Continues smoothly right from preserved currentTime.
 */
export function resumeSoundscape() {
  if (currentSoundscape === "silent") return;
  isSoundscapePaused = false;

  const audio = getAudioElement();
  if (audio && audio.paused) {
    audio.play().catch(() => {
      const unlock = () => {
        if (currentSoundscape === "white_noise" && !isSoundscapePaused && audio.paused) {
          audio.play().catch(() => {});
        }
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    });
  }
}

export function isSoundscapePausedState(): boolean {
  return isSoundscapePaused;
}

/**
 * Start or switch soundscape to White Noise.
 * Highly consistent: if already playing, updates volume without resetting playback.
 */
export async function setSoundscape(type: SoundscapeType, volume = currentVolume) {
  currentVolume = Math.max(0.0, Math.min(1.0, volume));

  if (type === "silent") {
    stopAllSoundscapes();
    return;
  }

  currentSoundscape = "white_noise";
  isSoundscapePaused = false;

  const audio = getAudioElement();
  if (!audio) return;

  audio.volume = currentVolume;
  audio.loop = true;

  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      const unlock = () => {
        if (currentSoundscape === "white_noise" && !isSoundscapePaused && audio.paused) {
          audio.play().catch(() => {});
        }
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }
}

/**
 * Adjust volume instantly with ZERO playback interruption or lag
 */
export function setSoundscapeVolume(vol: number) {
  currentVolume = Math.max(0.0, Math.min(1.0, vol));

  if (sharedAudio) {
    sharedAudio.volume = currentVolume;
  }
}

export function getCurrentSoundscape(): SoundscapeType {
  return currentSoundscape;
}

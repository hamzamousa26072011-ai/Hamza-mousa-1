// Web Audio API Procedural Rain Synthesizer
// Generates realistic, soothing ambient rain sounds without external files or network requests

let audioCtx: AudioContext | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let rainGainNode: GainNode | null = null;
let filterLowPass: BiquadFilterNode | null = null;
let filterHighPass: BiquadFilterNode | null = null;
let isPlaying = false;
let dropletInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate continuous pink/brownian noise buffer for continuous rain texture
function createRainBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4; // 4 seconds loop
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise algorithm
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      
      data[i] = pink;
    }
  }
  return buffer;
}

// Play a soft water drop transient for realism
function playSoftDrop(ctx: AudioContext, masterGain: GainNode) {
  if (!isPlaying) return;
  try {
    const osc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    
    // Frequency sweep down to simulate a water droplet impact
    const baseFreq = 800 + Math.random() * 900;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, ctx.currentTime + 0.08);

    dropGain.gain.setValueAtTime(0.001, ctx.currentTime);
    dropGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, ctx.currentTime + 0.01);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(dropGain);
    dropGain.connect(masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Ignore audio drop exceptions
  }
}

export function startRainSound(volume = 0.6) {
  if (isPlaying) {
    setRainVolume(volume);
    return;
  }

  try {
    const ctx = getAudioContext();
    
    // Master Rain Gain Node
    rainGainNode = ctx.createGain();
    rainGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    rainGainNode.gain.linearRampToValueAtTime(Math.max(0.01, Math.min(1.0, volume)), ctx.currentTime + 0.4);

    // Lowpass filter (softens the hiss, makes it sound like real rainfall)
    filterLowPass = ctx.createBiquadFilter();
    filterLowPass.type = "lowpass";
    filterLowPass.frequency.setValueAtTime(1400, ctx.currentTime);

    // Highpass filter (cuts muddy sub frequencies)
    filterHighPass = ctx.createBiquadFilter();
    filterHighPass.type = "highpass";
    filterHighPass.frequency.setValueAtTime(250, ctx.currentTime);

    // Rain noise buffer source
    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = createRainBuffer(ctx);
    noiseNode.loop = true;

    // Connect node graph
    noiseNode.connect(filterHighPass);
    filterHighPass.connect(filterLowPass);
    filterLowPass.connect(rainGainNode);
    rainGainNode.connect(ctx.destination);

    noiseNode.start(0);
    isPlaying = true;

    // Start subtle random droplet generator
    dropletInterval = setInterval(() => {
      if (isPlaying && rainGainNode && ctx.state === "running") {
        if (Math.random() > 0.4) {
          playSoftDrop(ctx, rainGainNode);
        }
      }
    }, 180);
  } catch (err) {
    console.warn("Could not start rain synthesizer:", err);
  }
}

export function stopRainSound() {
  if (!isPlaying) return;

  try {
    if (dropletInterval) {
      clearInterval(dropletInterval);
      dropletInterval = null;
    }

    if (rainGainNode && audioCtx) {
      rainGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        try {
          if (noiseNode) {
            noiseNode.stop();
            noiseNode.disconnect();
            noiseNode = null;
          }
          if (rainGainNode) {
            rainGainNode.disconnect();
            rainGainNode = null;
          }
          isPlaying = false;
        } catch {
          isPlaying = false;
        }
      }, 350);
    } else {
      isPlaying = false;
    }
  } catch {
    isPlaying = false;
  }
}

export function setRainVolume(volume: number) {
  if (rainGainNode && audioCtx) {
    const target = Math.max(0.001, Math.min(1.0, volume));
    rainGainNode.gain.linearRampToValueAtTime(target, audioCtx.currentTime + 0.1);
  }
}

export function getIsRainPlaying(): boolean {
  return isPlaying;
}

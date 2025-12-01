export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Singleton Audio Management
let globalAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  return globalAudioContext;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function stopCurrentAudio() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource.disconnect();
    currentSource = null;
  }
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before converting to Int16
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function playAudioBuffer(buffer: AudioBuffer): Promise<void> {
    const ctx = getAudioContext();
    
    // Ensure context is running (needed for some browsers after user interaction)
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    // Stop any existing TTS audio to prevent overlapping
    stopCurrentAudio();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSource = source;
    
    source.start(0);
    return new Promise((resolve) => {
        source.onended = () => {
            if (currentSource === source) {
                currentSource = null;
            }
            resolve();
        };
    });
}
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData, playAudioBuffer, getAudioContext, stopCurrentAudio } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

// Singleton AI instance
export const ai = new GoogleGenAI({ apiKey: API_KEY });

// Track the latest request to prevent old audio from playing over new ones
let latestTTSRequestId = 0;

// Audio Cache to store decoded buffers
const audioCache = new Map<string, AudioBuffer>();
// Pending requests to avoid duplicate API calls for the same text
const pendingRequests = new Map<string, Promise<AudioBuffer | null>>();

// --- Preload Queue System ---
const preloadQueue: string[] = [];
let isPreloading = false;

// Process the queue one by one to avoid flooding the network/browser connection limit
const processPreloadQueue = async () => {
    if (isPreloading || preloadQueue.length === 0) return;
    isPreloading = true;

    try {
        while (preloadQueue.length > 0) {
            // Take the next item
            const text = preloadQueue.shift();
            
            // If it's already cached or pending, skip it
            if (text && !audioCache.has(text) && !pendingRequests.has(text)) {
                try {
                    // Fetch and wait. This serializes the background downloads.
                    await getTTSAudio(text);
                    // Small breather to let the main thread/network handle urgent user interactions
                    await new Promise(r => setTimeout(r, 50));
                } catch (e) {
                    console.warn("Preload failed for:", text);
                }
            }
        }
    } finally {
        isPreloading = false;
    }
};

// --- TTS Service ---

// Internal function to fetch or retrieve cached audio
const getTTSAudio = async (text: string): Promise<AudioBuffer | null> => {
    if (!API_KEY) return null;
    if (!text.trim()) return null;

    // 1. Check Memory Cache
    if (audioCache.has(text)) {
        return audioCache.get(text)!;
    }

    // 2. Check Pending Requests (Deduplication)
    if (pendingRequests.has(text)) {
        return pendingRequests.get(text)!;
    }

    // 3. Fetch from API
    const promise = (async () => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly female voice
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioCtx = getAudioContext();
                const buffer = await decodeAudioData(
                    decode(base64Audio),
                    audioCtx,
                    24000,
                    1
                );
                // Cache the result
                audioCache.set(text, buffer);
                return buffer;
            }
            return null;
        } catch (e) {
            // console.error("TTS Error:", e); // Squelch common logs
            return null;
        } finally {
            pendingRequests.delete(text);
        }
    })();

    pendingRequests.set(text, promise);
    return promise;
};

// Public function to preload audio safely in background
export const preloadTTS = (text: string) => {
    if (audioCache.has(text)) return;
    preloadQueue.push(text);
    // Kick off the processor if not running
    processPreloadQueue();
};

export const speakText = async (text: string) => {
  if (!text) return;

  // Immediately stop any current audio when a new request is made
  stopCurrentAudio();
  
  const currentRequestId = ++latestTTSRequestId;

  // Optimistic check: if cached, play immediately
  if (audioCache.has(text)) {
      await playAudioBuffer(audioCache.get(text)!);
      return;
  }

  // Fetch (or wait for pending). 
  // NOTE: getTTSAudio is smart. If this text is currently in the preload queue 
  // but hasn't started, getTTSAudio starts it immediately. 
  // If it IS processing, it piggybacks on that promise.
  const buffer = await getTTSAudio(text);

  // If a newer request has started since we began, do not play this stale audio
  if (currentRequestId !== latestTTSRequestId) {
      return;
  }

  if (buffer) {
      await playAudioBuffer(buffer);
  }
};

// --- Audio Understanding Service (STT) ---
export const getPromptFromAudio = async (base64Audio: string, mimeType: string): Promise<string | null> => {
    if (!API_KEY) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Audio
                        }
                    },
                    {
                        text: "Listen to this audio of a child describing a drawing. Extract the main subject they want to draw (e.g., 'a cat in space', 'a dinosaur'). Translate it to a simple English prompt suitable for an image generator. Return ONLY the English prompt text."
                    }
                ]
            }
        });
        return response.text?.trim() || null;
    } catch (e) {
        console.error("Audio understanding error", e);
        return null;
    }
}

// --- Image Generation Service ---
export const generateImage = async (prompt: string): Promise<string | null> => {
    if (!API_KEY) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt }
                ]
            }
        });
        
        // Find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/jpeg';
                return `data:${mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image Generation Error", e);
        return null;
    }
}
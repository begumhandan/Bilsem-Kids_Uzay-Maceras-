import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';

const API_KEY = process.env.API_KEY;

export const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  // Audio Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setStatus('idle');
  };

  const toggleLive = async () => {
    if (isActive) {
      cleanup(); // Close logic is simplified here by just cutting contexts. Real close involves session.close() if exposed.
      return;
    }

    if (!API_KEY) {
        alert("API Key missing");
        return;
    }

    setIsActive(true);
    setStatus('connecting');

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            // Setup Mic Stream
            const source = inputContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
               if (!isActive) return; 
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createBlob(inputData);
               if (sessionPromiseRef.current) {
                 sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
               }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                setStatus('speaking');
                const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
                const ctx = outputContextRef.current;
                
                if (ctx && base64) {
                    const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) setStatus('listening');
                    };
                }
            }
          },
          onclose: () => cleanup(),
          onerror: (e: any) => { console.error(e); cleanup(); }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "Sen 'Robo' adında arkadaş canlısı bir uzay robotusun. 5 yaşındaki çocukla konuşuyorsun. Kısa, basit ve eğlenceli cümleler kur. Onları cesaretlendir.",
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
      };

      sessionPromiseRef.current = ai.live.connect(config);

    } catch (e) {
        console.error("Connection failed", e);
        cleanup();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center">
        {isActive && (
            <div className="mb-2 bg-slate-800 text-white text-xs px-3 py-1 rounded-full border border-blue-500 animate-pulse">
                {status === 'connecting' ? 'Bağlanıyor...' : status === 'listening' ? 'Dinliyor...' : 'Konuşuyor...'}
            </div>
        )}
      <button
        onClick={toggleLive}
        className={`w-20 h-20 rounded-full shadow-lg border-4 flex items-center justify-center transition-all bounce-click ${
          isActive 
            ? 'bg-red-500 border-red-300 shadow-red-500/50' 
            : 'bg-blue-600 border-blue-300 shadow-blue-500/50 hover:bg-blue-500'
        }`}
      >
        <div className="text-3xl">
            {isActive ? '🛑' : '🤖'}
        </div>
      </button>
      <span className="mt-2 text-sm font-bold text-blue-200 bg-black/50 px-2 rounded">
        {isActive ? 'Kapat' : 'Robo ile Konuş'}
      </span>
    </div>
  );
};

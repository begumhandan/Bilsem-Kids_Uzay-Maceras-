import React, { useState, useRef, useEffect } from 'react';
import { speakText, generateImage, getPromptFromAudio } from '../services/gemini';
import { stopCurrentAudio } from '../services/audioUtils';

interface Props {
  onBack: () => void;
}

export const CreativeCorner: React.FC<Props> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  
  // AI Generation State
  const [isRecording, setIsRecording] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'listening' | 'thinking' | 'drawing'>('idle');

  // Painting State
  const [brushColor, setBrushColor] = useState('#ef4444'); 
  const [brushSize, setBrushSize] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', 
      '#a855f7', '#ec4899', '#78350f', '#000000', '#ffffff',
  ];

  useEffect(() => {
      if (!image && processingState === 'idle') {
          setTimeout(() => speakText("Ne çizmemi istersin? Mikrofon tuşuna basıp söyleyebilirsin."), 500);
      }
  }, [image, processingState]);

  // --- SES KAYIT MANTIĞI ---

  const startRecording = async () => {
      try {
          stopCurrentAudio(); // Stop TTS instruction
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              // Stop all tracks
              stream.getTracks().forEach(track => track.stop());
              
              handleAudioProcessing(audioBlob);
          };

          mediaRecorder.start();
          setIsRecording(true);
          setProcessingState('listening');
      } catch (err) {
          console.error("Mic access denied", err);
          speakText("Mikrofonu kullanamıyorum. İzin verir misin?");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          setProcessingState('thinking');
      }
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  // --- AI İŞLEME MANTIĞI ---

  const handleAudioProcessing = async (audioBlob: Blob) => {
      speakText("Düşünüyorum...");
      
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = audioBlob.type || 'audio/webm';
          
          // 1. Get Prompt from Audio
          const extractedPrompt = await getPromptFromAudio(base64String, mimeType);
          
          if (!extractedPrompt) {
              speakText("Seni duyamadım. Tekrar söyler misin?");
              setProcessingState('idle');
              return;
          }

          // 2. Generate Image
          setProcessingState('drawing');
          speakText("Harika bir fikir! Hemen çiziyorum.");
          
          const finalPrompt = `${extractedPrompt}, simple black and white coloring page for kids, thick outlines, white background, no shading, line art only, cute cartoon style.`;
          
          const result = await generateImage(finalPrompt);
          
          if (result) {
              processImage(result); 
          } else {
              speakText("Resmi çizemedim. Tekrar deneyelim mi?");
              setProcessingState('idle');
          }
      };
  };

  // --- GÖRÜNTÜ İŞLEME FONKSİYONLARI ---

  // Resmi şeffaflaştır ve state'e kaydet
  const finalizeImage = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Beyaza yakın pikselleri şeffaf yap
          if (r > 200 && g > 200 && b > 200) {
              data[i + 3] = 0; 
          }
      }
      ctx.putImageData(imageData, 0, 0);

      setImage(canvas.toDataURL('image/png'));
      setProcessingState('idle');
      speakText("Resmin hazır! Haydi boyayalım.");
  };

  // AI Çıktısını İşle
  const processImage = (imgUrl: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 1024;
      
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imgUrl;

      img.onload = () => {
           let width = img.width;
           let height = img.height;
           
           if (width > height) {
               if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
           } else {
               if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
           }

           canvas.width = width;
           canvas.height = height;

           // Beyaz zemin
           ctx.fillStyle = 'white';
           ctx.fillRect(0, 0, canvas.width, canvas.height);

           // Filtreler: Siyah Beyaz ve Kontrast
           ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)';
           ctx.drawImage(img, 0, 0, width, height);
           ctx.filter = 'none';
           
           finalizeImage(canvas);
      };
  };

  // Canvas Hazırlık (Boyama Modu)
  useEffect(() => {
    if (image && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = image;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        };
    }
  }, [image]);

  // --- ÇİZİM MANTIĞI ---
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      isDrawing.current = true;
      lastPos.current = getPos(e);
  };

  const stopDrawing = () => { isDrawing.current = false; lastPos.current = null; };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx || !lastPos.current) return;

      const newPos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(newPos.x, newPos.y);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      lastPos.current = newPos;
  };

  const savePainting = () => {
      if (canvasRef.current && image) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasRef.current.width;
          tempCanvas.height = canvasRef.current.height;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(canvasRef.current, 0, 0); // Boyama
             const img = new Image();
             img.crossOrigin = "Anonymous";
             img.src = image;
             img.onload = () => {
                 ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height); // Çizgiler
                 speakText("Harika oldu! Kaydettim.");
                 const link = document.createElement('a');
                 link.download = 'sihirli-cizim.png';
                 link.href = tempCanvas.toDataURL();
                 link.click();
             };
          }
      }
  };

  const handleBack = () => {
      if (image) {
          setImage(null);
          setProcessingState('idle');
      } else {
          onBack();
      }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 h-full">
       <div className="flex justify-between w-full mb-4">
        <button onClick={handleBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️ {image ? 'Yeni Çizim' : 'Geri'}</button>
        <h2 className="text-3xl font-bold text-purple-400">Sihirli Çizim 🎨</h2>
        {image && (
            <button onClick={savePainting} className="bg-green-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-500 transition-colors shadow-lg animate-pulse-slow">
                <span>💾</span> Kaydet
            </button>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-3xl shadow-2xl w-full flex flex-col items-center space-y-4 min-h-[60vh] border border-slate-700 justify-center">
        
        {/* SES İLE RESİM ÜRETME (AI) */}
        {!image && (
             <div className="w-full max-w-lg flex flex-col gap-6 items-center animate-fade-in relative">
                <span className="text-6xl animate-bounce">🤖</span>
                <h3 className="text-2xl font-bold text-center text-yellow-300">
                    {processingState === 'listening' ? "Seni dinliyorum..." : 
                     processingState === 'thinking' ? "Düşünüyorum..." :
                     processingState === 'drawing' ? "Resmini çiziyorum..." :
                     "Ne çizmemi istersin?"}
                </h3>
                
                <div className="relative">
                    {/* Ripple Effect when recording */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                            <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-pulse"></div>
                        </>
                    )}
                    
                    <button 
                        onClick={toggleRecording}
                        disabled={processingState === 'thinking' || processingState === 'drawing'}
                        className={`relative z-10 w-32 h-32 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all transform hover:scale-105 active:scale-95 border-8 
                            ${isRecording ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'}
                            ${(processingState === 'thinking' || processingState === 'drawing') ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <span className="text-5xl drop-shadow-lg">
                            {processingState === 'thinking' || processingState === 'drawing' ? '⏳' : isRecording ? '⏹️' : '🎤'}
                        </span>
                    </button>
                </div>

                <div className="text-slate-300 font-bold text-lg bg-slate-900/50 px-6 py-3 rounded-full border border-slate-600 mt-4">
                    {isRecording ? "Bitince tekrar bas" : "Bas ve Konuş"}
                </div>

                <div className="text-slate-400 text-sm text-center bg-slate-900/50 p-3 rounded-lg max-w-sm">
                    Örnek: "Uzayda pizza yiyen kedi", "Ormanda koşan tavşan" diyebilirsin.
                </div>
             </div>
        )}

        {/* BOYAMA MODU */}
        {image && (
            <div className="w-full flex flex-col items-center animate-fade-in">
                <div className="w-full bg-white rounded-xl overflow-hidden border-8 border-slate-600 relative flex items-center justify-center shadow-inner mb-4">
                    <div className="relative w-full overflow-hidden touch-none flex justify-center" style={{ maxHeight: '60vh' }}>
                        <canvas 
                            ref={canvasRef}
                            className="touch-none"
                            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                            style={{ cursor: 'crosshair', display: 'block', maxWidth: '100%' }}
                        />
                        <img src={image} alt="overlay" crossOrigin="anonymous" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                    </div>
                </div>

                <div className="w-full bg-slate-900 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-center border border-slate-700 animate-slide-up">
                    <div className="flex gap-3 overflow-x-auto p-2 scrollbar-hide">
                        {colors.map(c => (
                            <button
                                key={c} onClick={() => setBrushColor(c)}
                                className={`w-12 h-12 rounded-full border-4 shadow-lg transition-transform hover:scale-110 flex-shrink-0 ${brushColor === c ? 'border-white scale-125' : 'border-slate-600'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="w-px h-12 bg-slate-600 mx-4 hidden sm:block"></div>
                    <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-xl">
                         <button onClick={() => setBrushSize(10)} className={`w-6 h-6 rounded-full bg-slate-400 hover:bg-white transition-all ${brushSize === 10 ? 'ring-4 ring-blue-500 bg-white' : ''}`}></button>
                         <button onClick={() => setBrushSize(25)} className={`w-10 h-10 rounded-full bg-slate-400 hover:bg-white transition-all ${brushSize === 25 ? 'ring-4 ring-blue-500 bg-white' : ''}`}></button>
                         <button onClick={() => setBrushSize(50)} className={`w-14 h-14 rounded-full bg-slate-400 hover:bg-white transition-all ${brushSize === 50 ? 'ring-4 ring-blue-500 bg-white' : ''}`}></button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
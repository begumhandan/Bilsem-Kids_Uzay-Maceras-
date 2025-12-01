import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const PuzzleGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [instruction, setInstruction] = useState('');
  const [options, setOptions] = useState<GameItem[]>([]);
  
  // Updated images with more reliable URLs (Lion, Space, Cat)
  const images = [
      'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=80', // Lion
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80', // Space
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80', // Cat
  ];
  const [currentImage, setCurrentImage] = useState('');

  const generateLevel = (lvl: number) => {
    // Ensure we pick a valid image even if level goes high
    const imgIndex = (lvl - 1) % images.length;
    const img = images[imgIndex];
    setCurrentImage(img);

    const opts: GameItem[] = [
        { id: 'correct', type: 'image', value: '100% 100%', isCorrect: true },
        { id: 'wrong1', type: 'image', value: '0% 0%', isCorrect: false }, 
        { id: 'wrong2', type: 'image', value: '100% 0%', isCorrect: false }, 
    ];
    
    setOptions(opts.sort(() => Math.random() - 0.5));
    
    const prompt = "Hangi parça eksik?";
    setInstruction(prompt);
    
    // Slight delay (600ms) to ensure UI is ready and previous audio cleared
    setTimeout(() => {
        speakText(prompt);
    }, 600);
  };

  useEffect(() => {
    generateLevel(level);
  }, [level]);

  const handleOptionClick = (item: GameItem) => {
    if (item.isCorrect) {
      speakText("Aferin!");
      if (level < 3) {
        setTimeout(() => setLevel(l => l + 1), 1000);
      } else {
        setTimeout(() => onComplete(3), 1000);
      }
    } else {
      speakText("Bu parça uymadı.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between w-full mb-8">
        <button onClick={onBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️</button>
        <div className="text-2xl font-bold text-yellow-500">Puzzle - Seviye {level}</div>
      </div>
      
      <div className="mb-8 text-center">
         <button onClick={() => speakText(instruction)} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {instruction}
         </p>
      </div>

      <div className="relative w-64 h-64 mb-12 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-600">
         <div className="absolute top-0 left-0 w-1/2 h-1/2" style={{ backgroundImage: `url(${currentImage})`, backgroundSize: '200% 200%', backgroundPosition: '0% 0%' }}></div>
         <div className="absolute top-0 right-0 w-1/2 h-1/2" style={{ backgroundImage: `url(${currentImage})`, backgroundSize: '200% 200%', backgroundPosition: '100% 0%' }}></div>
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2" style={{ backgroundImage: `url(${currentImage})`, backgroundSize: '200% 200%', backgroundPosition: '0% 100%' }}></div>
         <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-black/50 backdrop-blur-sm flex items-center justify-center border-l border-t border-dashed border-white/50 text-3xl">❓</div>
      </div>

      <div className="flex gap-6 justify-center">
        {options.map((opt) => (
             <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-500 hover:border-yellow-400 hover:scale-110 transition-all shadow-lg bg-slate-700"
            >
                <div 
                    className="w-full h-full"
                    style={{ 
                        backgroundImage: `url(${currentImage})`,
                        backgroundSize: '200% 200%',
                        backgroundPosition: opt.value 
                    }}
                />
            </button>
        ))}
      </div>
    </div>
  );
};
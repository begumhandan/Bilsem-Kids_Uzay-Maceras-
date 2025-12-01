import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const ShadowGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState<GameItem[]>([]);
  const [instruction, setInstruction] = useState("Bu resmin gölgesi hangisi? Dikkatli bak.");

  const generateLevel = (lvl: number) => {
    const items = ['🦒', '🚗', '🚀', '🐘', '⏰', '🎸'];
    const currentItem = items[(lvl - 1) % items.length];
    setTarget(currentItem);

    const opts: GameItem[] = [
        { id: 'correct', type: 'image', value: 'correct', isCorrect: true }, 
        { id: 'wrong1', type: 'image', value: 'wrong1', isCorrect: false }, 
        { id: 'wrong2', type: 'image', value: 'wrong2', isCorrect: false }, 
    ];

    setOptions(opts.sort(() => Math.random() - 0.5));
    
    setTimeout(() => {
        speakText(instruction);
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
      speakText("Bu gölge ona benzemiyor sanki.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between w-full mb-8">
        <button onClick={onBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️</button>
        <div className="text-2xl font-bold text-gray-400">Gölge Oyunu - Seviye {level}</div>
      </div>

      <div className="mb-8 text-center">
         <button onClick={() => speakText(instruction)} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {instruction}
         </p>
      </div>

      <div className="mb-12 p-8 bg-white/10 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)]">
        <div className="text-9xl filter drop-shadow-2xl">{target}</div>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {options.map((opt) => (
            <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className="p-6 bg-slate-200 rounded-2xl border-4 border-slate-400 hover:border-blue-500 hover:scale-105 transition-all w-32 h-32 flex items-center justify-center overflow-hidden relative group"
            >
                <div 
                    className="text-7xl absolute transition-transform duration-300"
                    style={{ 
                        color: 'black',
                        filter: 'brightness(0) blur(1px)',
                        opacity: 0.8,
                        transform: opt.value === 'correct' ? 'scale(1)' 
                                 : opt.value === 'wrong1' ? 'scaleY(-1)' 
                                 : 'rotate(90deg)'
                    }}
                >
                    {target}
                </div>
            </button>
        ))}
      </div>
    </div>
  );
};
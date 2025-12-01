import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const PatternGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<string[]>([]);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [instruction, setInstruction] = useState("Sıradaki şekil hangisi olmalı?");

  const generateLevel = (lvl: number) => {
    // Randomize shapes so every level/replay looks different
    const shapes = ['🟦', '🔻', '🟡', '⭐', '❤️', '🟣', '🟩', '🔶'].sort(() => Math.random() - 0.5);
    
    let pattern: string[] = [];
    let answer = '';
    
    if (lvl === 1) {
        // A-B-A-?
        const a = shapes[0];
        const b = shapes[1];
        pattern = [a, b, a];
        answer = b;
    } else if (lvl === 2) {
        // A-B-A-B-?
        const a = shapes[0];
        const b = shapes[1];
        pattern = [a, b, a, b];
        answer = a; 
    } else {
        // A-B-C-A-B-?
        const a = shapes[0];
        const b = shapes[1];
        const c = shapes[2];
        pattern = [a, b, c, a, b];
        answer = c;
    }

    setSequence(pattern);

    // Options
    const opts: GameItem[] = [
        { id: 'correct', type: 'shape', value: answer, isCorrect: true },
        { id: 'wrong1', type: 'shape', value: shapes.find(s => s !== answer && s !== pattern[0]) || shapes[3], isCorrect: false },
        { id: 'wrong2', type: 'shape', value: shapes.find(s => s !== answer && s !== pattern[1]) || shapes[4], isCorrect: false },
    ];
    
    // Shuffle options
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
      speakText("Tekrar dene bakalım.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
       <div className="flex justify-between w-full mb-8">
        <button onClick={onBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️</button>
        <div className="text-2xl font-bold text-green-400">Örüntü - Seviye {level}</div>
      </div>

      <div className="mb-8 text-center">
         <button onClick={() => speakText(instruction)} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {instruction}
         </p>
      </div>

      <div className="flex gap-4 mb-12 bg-slate-800 p-8 rounded-3xl shadow-inner overflow-x-auto max-w-full justify-center">
        {sequence.map((s, i) => (
            <div key={i} className="text-6xl animate-pulse">{s}</div>
        ))}
        <div className="text-6xl text-slate-500">❓</div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {options.map((opt) => (
            <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className="text-7xl p-6 bg-slate-700 rounded-2xl border-4 border-slate-600 hover:border-green-400 hover:scale-110 transition-all shadow-xl"
            >
                {opt.value}
            </button>
        ))}
      </div>
    </div>
  );
};
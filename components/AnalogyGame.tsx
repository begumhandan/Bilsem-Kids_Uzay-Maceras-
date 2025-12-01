import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const AnalogyGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [pairs, setPairs] = useState<string[]>([]);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [instruction, setInstruction] = useState('');

  const generateLevel = (lvl: number) => {
    let a, b, c, d, wrong1, wrong2;
    let promptText = "";

    if (lvl === 1) {
        a = '🌧️'; b = '☂️'; c = '☀️'; d = '🕶️';
        wrong1 = '⛄'; wrong2 = '🌙';
        promptText = "Yağmur yağınca şemsiye açarız. Peki güneş çıkınca ne takarız?";
    } else if (lvl === 2) {
        a = '🦶'; b = '👟'; c = '🤚'; d = '🧤';
        wrong1 = '🎩'; wrong2 = '👓';
        promptText = "Ayağımıza ayakkabı giyeriz. Peki elimize ne takarız?";
    } else {
        a = '🐒'; b = '🍌'; c = '🐇'; d = '🥕';
        wrong1 = '🦴'; wrong2 = '🥩';
        promptText = "Maymun muz sever. Peki tavşan ne sever?";
    }

    setPairs([a, b, c]);
    setInstruction(promptText);
    
    const opts: GameItem[] = [
        { id: 'correct', type: 'shape', value: d, isCorrect: true },
        { id: 'wrong1', type: 'shape', value: wrong1, isCorrect: false },
        { id: 'wrong2', type: 'shape', value: wrong2, isCorrect: false },
    ];
    setOptions(opts.sort(() => Math.random() - 0.5));
    
    setTimeout(() => {
        speakText(promptText);
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
      speakText("Biraz daha düşünelim.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between w-full mb-8">
        <button onClick={onBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️</button>
        <div className="text-2xl font-bold text-orange-400">Benzeşim - Seviye {level}</div>
      </div>
      
      <div className="mb-8 text-center">
         <button onClick={() => speakText(instruction)} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {instruction}
         </p>
      </div>

      <div className="flex items-center gap-4 mb-12 bg-slate-800/50 p-6 rounded-3xl justify-center flex-wrap">
         <div className="bg-slate-700 p-4 rounded-xl text-6xl">{pairs[0]}</div>
         <div className="text-4xl text-slate-400">➜</div>
         <div className="bg-slate-700 p-4 rounded-xl text-6xl">{pairs[1]}</div>
         
         <div className="w-1 h-20 bg-slate-500 mx-4 hidden sm:block"></div>

         <div className="bg-slate-700 p-4 rounded-xl text-6xl">{pairs[2]}</div>
         <div className="text-4xl text-slate-400">➜</div>
         <div className="bg-slate-900 border-2 border-dashed border-orange-400 p-4 rounded-xl text-6xl opacity-50">❓</div>
      </div>

      <div className="flex gap-8">
        {options.map((opt) => (
            <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                className="text-8xl p-6 bg-slate-700 rounded-2xl border-4 border-slate-600 hover:border-orange-400 hover:scale-110 transition-all shadow-xl"
            >
                {opt.value}
            </button>
        ))}
      </div>
    </div>
  );
};
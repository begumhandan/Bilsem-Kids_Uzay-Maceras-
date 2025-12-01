import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const MemoryGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [itemsToMemorize, setItemsToMemorize] = useState<string[]>([]);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [timer, setTimer] = useState(3);

  const allItems = ['🍎', '🍌', '🍒', '🍇', '🍉', '🐶', '🐱', '🐭', '🐹', '🐰'];

  const generateLevel = (lvl: number) => {
    setPhase('memorize');
    const count = lvl + 1;
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    
    setItemsToMemorize(selected);
    
    // Changed to static text to allow preloading/caching and reduce latency
    setTimeout(() => {
        speakText("Bu resimlere iyi bak.");
    }, 600);
    setTimer(3 + lvl);
  };

  useEffect(() => {
    generateLevel(level);
  }, [level]);

  useEffect(() => {
    if (phase === 'memorize') {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(s => s - 1), 1000);
            return () => clearTimeout(t);
        } else {
            setPhase('recall');
            prepareRecall();
        }
    }
  }, [timer, phase]);

  const prepareRecall = () => {
      const correctItem = itemsToMemorize[Math.floor(Math.random() * itemsToMemorize.length)];
      const distractors = allItems.filter(i => !itemsToMemorize.includes(i));
      const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 2);
      
      const opts: GameItem[] = [
          { id: 'correct', type: 'shape', value: correctItem, isCorrect: true },
          { id: 'wrong1', type: 'shape', value: shuffledDistractors[0], isCorrect: false },
          { id: 'wrong2', type: 'shape', value: shuffledDistractors[1], isCorrect: false },
      ];
      
      setOptions(opts.sort(() => Math.random() - 0.5));
      speakText("Az önce hangi resmi görmüştün?");
  };

  const handleOptionClick = (item: GameItem) => {
    if (item.isCorrect) {
      speakText("Aferin!");
      if (level < 4) {
        setTimeout(() => setLevel(l => l + 1), 1000);
      } else {
        setTimeout(() => onComplete(3), 1000);
      }
    } else {
      speakText("Hayır, bu yoktu.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between w-full mb-8">
        <button onClick={onBack} className="text-2xl bg-slate-700 p-3 rounded-full">⬅️</button>
        <div className="text-2xl font-bold text-pink-400">Hafıza - Seviye {level}</div>
      </div>

      <div className="mb-4 text-center">
         <button onClick={() => speakText(phase === 'memorize' ? "Bu resimlere iyi bak." : "Az önce hangi resmi görmüştün?")} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {phase === 'memorize' ? "Bu resimlere iyi bak." : "Az önce hangi resmi görmüştün?"}
         </p>
      </div>

      {phase === 'memorize' ? (
          <div className="flex flex-col items-center animate-fade-in">
              <div className="text-4xl font-bold mb-8 text-white">{timer}</div>
              <div className="flex gap-8 p-8 bg-slate-800 rounded-3xl flex-wrap justify-center">
                  {itemsToMemorize.map((item, idx) => (
                      <div key={idx} className="text-8xl animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
                          {item}
                      </div>
                  ))}
              </div>
          </div>
      ) : (
          <div className="flex flex-col items-center animate-fade-in">
              <div className="flex gap-8">
                  {options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionClick(opt)}
                        className="text-8xl p-6 bg-slate-700 rounded-2xl border-4 border-slate-500 hover:border-pink-400 hover:scale-110 transition-all shadow-xl"
                      >
                          {opt.value}
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
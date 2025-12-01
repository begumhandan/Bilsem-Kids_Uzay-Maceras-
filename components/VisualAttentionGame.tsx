import React, { useEffect, useState } from 'react';
import { GameItem } from '../types';
import { speakText } from '../services/gemini';

interface Props {
  onComplete: (stars: number) => void;
  onBack: () => void;
}

// Shape and Color Definitions
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const COLORS = [
    { id: 'red', name: 'kırmızı', hex: '#ef4444' },
    { id: 'blue', name: 'mavi', hex: '#3b82f6' },
    { id: 'green', name: 'yeşil', hex: '#22c55e' },
    { id: 'yellow', name: 'sarı', hex: '#eab308' },
    { id: 'purple', name: 'mor', hex: '#a855f7' },
    { id: 'orange', name: 'turuncu', hex: '#f97316' },
];

const SHAPE_NAMES: Record<string, string> = {
    'circle': 'daireyi',
    'square': 'kareyi',
    'triangle': 'üçgeni',
    'star': 'yıldızı',
    'heart': 'kalbi'
};

const SHAPE_NAMES_NOMINATIVE: Record<string, string> = {
    'circle': 'daire',
    'square': 'kare',
    'triangle': 'üçgen',
    'star': 'yıldız',
    'heart': 'kalp'
};

export const VisualAttentionGame: React.FC<Props> = ({ onComplete, onBack }) => {
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState<GameItem[]>([]);
  const [instruction, setInstruction] = useState('');

  // Render SVG Shapes
  const renderShape = (shape: string, colorHex: string) => {
    const style = { fill: colorHex, filter: 'drop-shadow(3px 3px 2px rgba(0,0,0,0.3))' };
    const size = "100%";
    
    switch (shape) {
        case 'circle': 
            return <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="50" r="40" style={style} /></svg>;
        case 'square': 
            return <svg viewBox="0 0 100 100" width={size} height={size}><rect x="15" y="15" width="70" height="70" rx="10" style={style} /></svg>;
        case 'triangle': 
            return <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,15 85,85 15,85" style={style} /></svg>;
        case 'star': 
            return <svg viewBox="0 0 100 100" width={size} height={size}><polygon points="50,5 61,40 98,40 68,60 79,95 50,75 21,95 32,60 2,40 39,40" style={style} /></svg>;
        case 'heart': 
            return <svg viewBox="0 0 100 100" width={size} height={size}><path d="M50,88.9l-2.55-2.4C21.6,63.6,5.6,48.2,5.6,30.4C5.6,15.6,16.5,5.6,30.4,5.6c7.6,0,14.6,3.6,19.6,9.1c5-5.5,12-9.1,19.6-9.1c13.9,0,24.8,10,24.8,24.8c0,17.8-16,33.2-41.85,56.1L50,88.9z" style={style} /></svg>;
        default: return null;
    }
  };

  const generateLevel = (lvl: number) => {
    let targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    let targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // FORCE LEVEL 1 TO SQUARE to ensure it matches the preloaded audio "Bana kareyi bulabilir misin?"
    if (lvl === 1) {
        targetShape = 'square';
    }

    // Determine Game Mode based on Level
    // Level 1-2: Find Shape
    // Level 3-4: Find Color
    // Level 5+: Find Shape + Color
    const mode = lvl <= 2 ? 'SHAPE' : lvl <= 4 ? 'COLOR' : 'BOTH';
    
    // Construct Prompt BEFORE generating items to ensure it's correct
    let prompt = "";
    if (mode === 'SHAPE') {
        prompt = `Bana ${SHAPE_NAMES[targetShape] || targetShape} bulabilir misin?`;
    } else if (mode === 'COLOR') {
        prompt = `Bana ${targetColor.name} renkli olanı bulabilir misin?`;
    } else {
        // Safe access for Level 5+
        const shapeName = SHAPE_NAMES_NOMINATIVE[targetShape] || targetShape;
        prompt = `Bana ${targetColor.name} ${shapeName} şeklini bulabilir misin?`;
    }

    let newItemList: GameItem[] = [];
    const itemCount = 3 + Math.min(lvl, 3); // 4 to 6 items

    // Generate Target
    const targetItem = { 
        id: 'target', 
        type: 'shape' as const, 
        value: `${targetShape}|${targetColor.hex}`, 
        isCorrect: true 
    };
    newItemList.push(targetItem);

    // Generate Distractors
    for (let i = 0; i < itemCount - 1; i++) {
        let dShape = targetShape;
        let dColor = targetColor;

        if (mode === 'SHAPE') {
            do {
                dShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            } while (dShape === targetShape);
            dColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            
        } else if (mode === 'COLOR') {
            do {
                dColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            } while (dColor.id === targetColor.id);
            dShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            
        } else {
            // BOTH
            do {
                dShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                dColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            } while (dShape === targetShape && dColor.id === targetColor.id);
        }

        newItemList.push({
            id: `distractor-${i}`,
            type: 'shape',
            value: `${dShape}|${dColor.hex}`,
            isCorrect: false
        });
    }

    // Shuffle items
    setItems(newItemList.sort(() => Math.random() - 0.5));
    setInstruction(prompt);
    
    // Speak with a delay (600ms) to ensure previous "Aferin" finishes and new screen is visible
    setTimeout(() => {
        speakText(prompt);
    }, 600);
  };

  useEffect(() => {
    generateLevel(level);
  }, [level]);

  const handleItemClick = (item: GameItem) => {
    if (item.isCorrect) {
      speakText("Aferin!");
      if (level < 6) {
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
        <div className="text-2xl font-bold text-yellow-400">Dikkat - Seviye {level}</div>
      </div>
      
      <div className="mb-8 text-center">
         <button onClick={() => speakText(instruction)} className="bg-blue-600 p-4 rounded-full mb-4 animate-bounce hover:bg-blue-500 transition-colors">
            🔊
         </button>
         <p className="text-xl text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
             {instruction}
         </p>
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {items.map((item) => {
          const [shape, color] = item.value.split('|');
          return (
            <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-32 h-32 p-4 bg-slate-800 rounded-2xl border-4 border-slate-600 hover:border-yellow-400 transition-all transform hover:scale-110 active:scale-95 shadow-xl flex items-center justify-center"
            >
                {renderShape(shape, color)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
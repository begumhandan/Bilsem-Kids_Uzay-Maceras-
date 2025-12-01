import React, { useState, useEffect } from 'react';
import { Screen } from './types';
import { LiveAssistant } from './components/LiveAssistant';
import { VisualAttentionGame } from './components/VisualAttentionGame';
import { PatternGame } from './components/PatternGame';
import { ShadowGame } from './components/ShadowGame';
import { PuzzleGame } from './components/PuzzleGame';
import { MemoryGame } from './components/MemoryGame';
import { AnalogyGame } from './components/AnalogyGame';
import { speakText, preloadTTS } from './services/gemini';
import { resumeAudioContext } from './services/audioUtils';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.MENU);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    // --- ESSENTIAL FEEDBACK (High Priority) ---
    preloadTTS("Aferin!");
    preloadTTS("Tekrar dene bakalım.");
    
    // --- FIXED LEVEL 1 PROMPTS (High Priority) ---
    preloadTTS("Bana kareyi bulabilir misin?"); // Attention L1
    preloadTTS("Sıradaki şekil hangisi olmalı?"); // Pattern L1
    preloadTTS("Bu resimlere iyi bak."); // Memory L1
    preloadTTS("Bu resmin gölgesi hangisi? Dikkatli bak."); // Shadow L1
    preloadTTS("Hangi parça eksik?"); // Puzzle L1
    preloadTTS("Yağmur yağınca şemsiye açarız. Peki güneş çıkınca ne takarız?"); // Analogy L1

    // --- SECONDARY LEVELS (Queue for background loading) ---
    
    // Memory Game Recall
    preloadTTS("Az önce hangi resmi görmüştün?");

    // Analogy Levels
    preloadTTS("Ayağımıza ayakkabı giyeriz. Peki elimize ne takarız?");
    preloadTTS("Maymun muz sever. Peki tavşan ne sever?");

    // Attention Game: Simple Shapes (Level 1-2)
    const shapes = ['daireyi', 'kareyi', 'üçgeni', 'yıldızı', 'kalbi'];
    shapes.forEach(s => preloadTTS(`Bana ${s} bulabilir misin?`));

    // Attention Game: Colors (Level 3-4)
    const colors = ['kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu'];
    colors.forEach(c => preloadTTS(`Bana ${c} renkli olanı bulabilir misin?`));

    // Attention Game: Combinations (Level 5+)
    // There are 30 combinations. By queueing them, they won't block the network
    // but will likely be ready by the time the child reaches Level 5.
    const shapeNames = ['daire', 'kare', 'üçgen', 'yıldız', 'kalp'];
    colors.forEach(c => {
        shapeNames.forEach(s => {
             preloadTTS(`Bana ${c} ${s} şeklini bulabilir misin?`);
        });
    });

  }, []);

  const handleGameComplete = (earnedStars: number) => {
    setStars(s => s + earnedStars);
    speakText(`Tebrikler! ${earnedStars} yıldız kazandın!`);
    setCurrentScreen(Screen.MENU);
  };

  const handleGlobalClick = () => {
      // Resume audio context on first user interaction to ensure sounds play
      resumeAudioContext();
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.GAME_ATTENTION:
        return <VisualAttentionGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      case Screen.GAME_PATTERN:
        return <PatternGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      case Screen.GAME_SHADOW:
        return <ShadowGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      case Screen.GAME_PUZZLE:
        return <PuzzleGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      case Screen.GAME_MEMORY:
        return <MemoryGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      case Screen.GAME_ANALOGY:
        return <AnalogyGame onComplete={handleGameComplete} onBack={() => setCurrentScreen(Screen.MENU)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[85vh] gap-6 animate-fade-in pb-20">
             <div className="text-center mb-2">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                    Uzay Macerası
                </h1>
                <p className="text-slate-400">Yıldızların: ⭐ {stars}</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                <MenuButton 
                    title="Dikkat" 
                    icon="👁️" 
                    color="bg-blue-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_ATTENTION);
                    }} 
                />
                <MenuButton 
                    title="Örüntü" 
                    icon="🔢" 
                    color="bg-green-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_PATTERN);
                    }} 
                />
                <MenuButton 
                    title="Hafıza" 
                    icon="🧠" 
                    color="bg-pink-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_MEMORY);
                    }} 
                />
                 <MenuButton 
                    title="Gölge" 
                    icon="👻" 
                    color="bg-slate-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_SHADOW);
                    }} 
                />
                <MenuButton 
                    title="Puzzle" 
                    icon="🧩" 
                    color="bg-yellow-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_PUZZLE);
                    }} 
                />
                 <MenuButton 
                    title="Benzeşim" 
                    icon="🔗" 
                    color="bg-orange-600" 
                    onClick={() => {
                        setCurrentScreen(Screen.GAME_ANALOGY);
                    }} 
                />
             </div>
          </div>
        );
    }
  };

  return (
    <div 
        className="min-h-screen star-bg text-white font-sans selection:bg-purple-500/30"
        onClick={handleGlobalClick} // Ensure AudioContext resumes on first click
        onTouchStart={handleGlobalClick}
    >
      <div className="relative z-10">
        <header className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 border-b border-slate-700/50 z-20">
          <div className="flex items-center gap-2">
             <span className="text-3xl">🚀</span>
             <span className="font-bold text-xl hidden sm:block">BİLSEM Kids</span>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-full border border-yellow-500/30 text-yellow-400 font-bold flex items-center gap-2">
                <span>⭐</span> {stars}
            </div>
          </div>
        </header>

        <main className="container mx-auto pb-24 pt-4">
          {renderScreen()}
        </main>

        <LiveAssistant />
      </div>
    </div>
  );
}

const MenuButton: React.FC<{title: string, icon: string, color: string, onClick: () => void}> = ({ title, icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`${color} aspect-[4/3] rounded-3xl flex flex-col items-center justify-center shadow-lg border-b-8 border-black/20 active:border-b-0 active:translate-y-2 transition-all hover:brightness-110 group relative overflow-hidden`}
    >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span className="text-5xl mb-2 group-hover:scale-110 transition-transform filter drop-shadow-md">{icon}</span>
        <span className="text-xl font-bold tracking-wide">{title}</span>
    </button>
);

export default App;
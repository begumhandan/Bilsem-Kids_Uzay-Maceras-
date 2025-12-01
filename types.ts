export enum Screen {
  MENU = 'MENU',
  GAME_ATTENTION = 'GAME_ATTENTION',
  GAME_PATTERN = 'GAME_PATTERN',
  GAME_SHADOW = 'GAME_SHADOW',
  GAME_PUZZLE = 'GAME_PUZZLE',
  GAME_MEMORY = 'GAME_MEMORY',
  GAME_ANALOGY = 'GAME_ANALOGY',
}

export interface GameItem {
  id: string;
  type: 'shape' | 'color' | 'image';
  value: string; // url or color code or shape name
  isCorrect?: boolean;
}

export interface LevelConfig {
  instructions: string;
  items: GameItem[];
  correctId: string;
}

export interface UserState {
  stars: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Audio Types
export interface AudioChunk {
  data: string; // Base64
  mimeType: string;
}
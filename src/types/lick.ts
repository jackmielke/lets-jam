export interface LickNote {
  soundId: string;
  noteName: string;
  beatNumber: number;
  subdivision: number; // Quantized to nearest 16th (0, 0.25, 0.5, 0.75)
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
  difficulty?: number; // 1-100 scale
  bpm: number;
  createdAt: number;
}

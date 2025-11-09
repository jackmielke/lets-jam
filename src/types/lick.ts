export interface LickNote {
  soundId: string;
  noteName: string;
  beatNumber: number;
  subdivision: number; // Straight: 0, 0.25, 0.5, 0.75 (16ths) | Swing: 0, 0.333, 0.667 (triplets)
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
  difficulty?: number; // 1-100 scale
  bpm: number;
  timingType: 'straight' | 'swing'; // Timing system for subdivisions
  createdAt: number;
}

export interface RecordedNote {
  soundId: string;
  noteName: string;
  timestamp: number;
  beatNumber: number;
  subdivision: number;
  offsetMs: number;
  accuracy: 'perfect' | 'good' | 'ok' | 'poor';
}

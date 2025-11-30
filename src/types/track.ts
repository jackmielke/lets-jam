import { RecordedNote } from './recording';

export interface Track {
  id: string;
  project_id?: string;
  user_id?: string;
  name: string;
  instrument_type: 'piano' | 'drums' | 'synth' | 'organ' | 'guitar' | 'audio';
  volume: number;
  pan: number;
  is_muted: boolean;
  is_soloed: boolean;
  color: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TrackRecording {
  id: string;
  track_id: string;
  notes: RecordedNote[];
  start_time: number;
  duration: number;
  bpm: number;
  timing_type: 'straight' | 'swing';
  created_at: string;
  updated_at: string;
}

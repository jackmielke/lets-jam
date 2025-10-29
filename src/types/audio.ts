export type SoundType = "kick" | "snare" | "hihat" | "clap" | "tom" | "cymbal" | "cowbell" | "rim";

export interface DrumSound {
  id: string;
  name: string;
  type: SoundType;
  frequency: number;
  color: string;
}

export interface SequencerStep {
  soundId: string;
  active: boolean;
}

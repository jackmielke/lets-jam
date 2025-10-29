import { DrumSound } from "@/types/audio";
import { DrumPad } from "./DrumPad";

interface DrumGridProps {
  sounds: DrumSound[];
  onPlaySound: (soundId: string) => void;
}

export const DrumGrid = ({ sounds, onPlaySound }: DrumGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 animate-slide-up">
      {sounds.map((sound) => (
        <DrumPad
          key={sound.id}
          sound={sound}
          onPlay={() => onPlaySound(sound.id)}
        />
      ))}
    </div>
  );
};

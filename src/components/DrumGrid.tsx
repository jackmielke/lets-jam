import { DrumSound } from "@/types/audio";
import { PianoKey } from "./PianoKey";

interface DrumGridProps {
  sounds: DrumSound[];
  onPlaySound: (soundId: string) => void;
}

export const DrumGrid = ({ sounds, onPlaySound }: DrumGridProps) => {
  const blackKeys = [1, 3, 5, 6]; // indices of black keys (simulating sharps/flats)
  
  return (
    <div className="flex justify-center items-end p-8 animate-slide-up">
      <div className="relative flex items-end">
        {sounds.map((sound, index) => (
          <PianoKey
            key={sound.id}
            sound={sound}
            onPlay={() => onPlaySound(sound.id)}
            isBlack={blackKeys.includes(index)}
          />
        ))}
      </div>
    </div>
  );
};

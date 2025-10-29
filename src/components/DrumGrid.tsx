import { DrumSound } from "@/types/audio";
import { PianoKey } from "./PianoKey";

interface DrumGridProps {
  sounds: DrumSound[];
  onPlaySound: (soundId: string) => void;
}

export const DrumGrid = ({ sounds, onPlaySound }: DrumGridProps) => {
  // Identify which keys are black (sharps/flats)
  const isBlackKey = (sound: DrumSound) => sound.color === "bg-black";
  
  return (
    <div className="flex justify-center items-end p-8 animate-slide-up overflow-x-auto">
      <div className="relative flex items-end min-w-max">
        {sounds.map((sound) => (
          <PianoKey
            key={sound.id}
            sound={sound}
            onPlay={() => onPlaySound(sound.id)}
            isBlack={isBlackKey(sound)}
          />
        ))}
      </div>
    </div>
  );
};

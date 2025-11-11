import { DrumSound } from "@/types/audio";
import { DrumPad } from "./DrumPad";
import { getKeyForDrumSound } from "@/hooks/useKeyboardMappingDrums";

interface DrumPadGridProps {
  sounds: DrumSound[];
  onPlaySound: (soundId: string) => void;
  pressedKeyId: string | null;
}

export const DrumPadGrid = ({ sounds, onPlaySound, pressedKeyId }: DrumPadGridProps) => {
  return (
    <div className="p-8 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-4">
          {sounds.map((sound) => (
            <DrumPad
              key={sound.id}
              sound={sound}
              onPlay={() => onPlaySound(sound.id)}
              keyboardKey={getKeyForDrumSound(sound.id)}
              isPressed={pressedKeyId === sound.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

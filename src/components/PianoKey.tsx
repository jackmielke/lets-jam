import { useState } from "react";
import { DrumSound } from "@/types/audio";

interface PianoKeyProps {
  sound: DrumSound;
  onPlay: () => void;
  isBlack?: boolean;
}

export const PianoKey = ({ sound, onPlay, isBlack }: PianoKeyProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onPlay();
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      onClick={handlePress}
      className={`
        relative transition-all duration-150
        ${isBlack 
          ? "bg-gradient-to-b from-gray-900 to-black text-white h-32 w-12 sm:w-14 -mx-3 z-10 rounded-b-lg shadow-xl" 
          : "bg-gradient-to-b from-white to-gray-100 text-gray-900 h-48 w-16 sm:w-20 rounded-b-lg shadow-lg border-2 border-gray-300"
        }
        ${isPressed ? (isBlack ? "from-gray-700 to-gray-800" : "from-gray-200 to-gray-300") : ""}
        hover:brightness-95
        flex flex-col items-center justify-end pb-3 gap-1
      `}
    >
      <span className={`text-sm font-bold ${isBlack ? "text-white" : "text-gray-800"}`}>
        {sound.name}
      </span>
      {isPressed && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${isBlack ? "bg-primary" : "bg-secondary"} animate-pulse`} />
      )}
    </button>
  );
};

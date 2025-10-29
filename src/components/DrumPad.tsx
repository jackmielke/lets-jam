import { useState } from "react";
import { DrumSound } from "@/types/audio";

interface DrumPadProps {
  sound: DrumSound;
  onPlay: () => void;
}

export const DrumPad = ({ sound, onPlay }: DrumPadProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onPlay();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handlePress}
      className={`
        relative aspect-square rounded-xl transition-all duration-150
        ${sound.color}
        ${isPressed ? "scale-95 shadow-glow-primary animate-pulse" : "scale-100"}
        hover:scale-105 hover:brightness-110
        flex flex-col items-center justify-center gap-2
        border-2 border-border/20
        backdrop-blur-sm
      `}
    >
      <span className="text-xl font-bold text-foreground drop-shadow-lg">
        {sound.name.toUpperCase()}
      </span>
      <span className="text-xs opacity-60 text-foreground">
        {sound.type}
      </span>
    </button>
  );
};

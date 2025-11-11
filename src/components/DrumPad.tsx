import { DrumSound } from "@/types/audio";

interface DrumPadProps {
  sound: DrumSound;
  onPlay: () => void;
  keyboardKey?: string;
  isPressed?: boolean;
}

export const DrumPad = ({ sound, onPlay, keyboardKey, isPressed = false }: DrumPadProps) => {
  const getColorClass = () => {
    switch (sound.type) {
      case "kick": return "bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800";
      case "snare": return "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800";
      case "hihat": return "bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800";
      case "clap": return "bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800";
      case "tom": return "bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800";
      case "cymbal": return "bg-gradient-to-br from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800";
      case "cowbell": return "bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800";
      case "rim": return "bg-gradient-to-br from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800";
      default: return "bg-gradient-to-br from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800";
    }
  };

  return (
    <button
      onClick={onPlay}
      className={`
        relative rounded-xl transition-all duration-150
        ${getColorClass()}
        ${isPressed ? "scale-95 shadow-[0_0_30px_rgba(255,255,255,0.6)] brightness-125" : "shadow-lg"}
        active:scale-90
        flex flex-col items-center justify-center
        aspect-square
        text-white font-bold
        p-4
        min-h-[100px]
      `}
    >
      <span className="text-lg sm:text-xl mb-1">{sound.name}</span>
      <span className="text-xs sm:text-sm opacity-80 capitalize">{sound.type}</span>
      {keyboardKey && (
        <span className="absolute top-2 right-2 text-xs sm:text-sm font-mono bg-black/30 px-2 py-1 rounded">
          {keyboardKey}
        </span>
      )}
    </button>
  );
};

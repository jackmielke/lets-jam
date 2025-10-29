import { useEffect, useState } from "react";

interface DancingCharacterProps {
  isDancing: boolean;
}

export const DancingCharacter = ({ isDancing }: DancingCharacterProps) => {
  const [animationStyle, setAnimationStyle] = useState("");

  useEffect(() => {
    if (isDancing) {
      const animations = [
        "animate-[dance_0.5s_ease-in-out]",
        "animate-[bounce-dance_0.4s_ease-in-out]",
        "animate-[shake-dance_0.3s_ease-in-out]"
      ];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setAnimationStyle(randomAnimation);
      
      const timer = setTimeout(() => {
        setAnimationStyle("");
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isDancing]);

  return (
    <div className="flex justify-center items-center p-8 animate-slide-up">
      <div className="relative">
        {/* Character */}
        <div 
          className={`text-8xl sm:text-9xl transition-all duration-300 ${animationStyle} ${
            isDancing ? "drop-shadow-[0_0_30px_rgba(195,255,50,0.8)]" : ""
          }`}
          style={{
            filter: isDancing ? "brightness(1.3)" : "brightness(1)"
          }}
        >
          🕺
        </div>
        
        {/* Glow effect when dancing */}
        {isDancing && (
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full animate-pulse" />
          </div>
        )}
        
        {/* Stage */}
        <div className="mt-4 w-32 h-2 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full mx-auto" />
      </div>
    </div>
  );
};

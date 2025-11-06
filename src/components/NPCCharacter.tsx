import { useState, useEffect } from "react";
import { Card } from "./ui/card";

interface NPCCharacterProps {
  isActive: boolean;
  message?: string;
}

const messages = [
  "yo let's jam!",
  "I bet you can't beat me!",
  "nice moves!",
  "can you keep up?",
  "let's go!",
  "your turn!"
];

export const NPCCharacter = ({ isActive, message }: NPCCharacterProps) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setShowBubble(true);
      const timer = setTimeout(() => setShowBubble(false), 3000);
      return () => clearTimeout(timer);
    } else if (isActive && Math.random() > 0.7) {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMsg);
      setShowBubble(true);
      const timer = setTimeout(() => setShowBubble(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isActive, message]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Speech bubble */}
      {showBubble && (
        <div className="absolute -top-16 bg-white text-black px-4 py-2 rounded-2xl shadow-lg animate-fade-in">
          <div className="font-bold text-sm">{currentMessage}</div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </div>
        </div>
      )}

      {/* NPC Character */}
      <Card className={`p-6 transition-all duration-300 ${isActive ? 'ring-4 ring-primary shadow-2xl scale-110' : 'opacity-60'}`}>
        <div className="flex flex-col items-center gap-4">
          {/* Character body */}
          <div className="relative">
            {/* Head with spinning hat */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full border-4 border-amber-600 flex items-center justify-center">
              {/* Face */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-black rounded-full" />
                </div>
                <div className="w-4 h-2 bg-black rounded-full" />
              </div>
              
              {/* Spinning baseball cap */}
              <div className={`absolute -top-3 w-16 h-4 bg-blue-600 rounded-full ${isActive ? 'animate-spin' : ''}`}>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-8 h-3 bg-blue-700 rounded-t-full" />
              </div>
            </div>

            {/* Body */}
            <div className={`mt-2 w-16 h-24 bg-gradient-to-b from-purple-500 to-purple-700 rounded-lg transition-transform ${isActive ? 'animate-bounce' : ''}`}>
              {/* Arms */}
              <div className="absolute top-20 -left-2 w-8 h-3 bg-amber-300 rounded-full transform -rotate-45" />
              <div className="absolute top-20 -right-2 w-8 h-3 bg-amber-300 rounded-full transform rotate-45" />
            </div>

            {/* Keytar */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg border-2 border-red-700">
              {/* Keys */}
              <div className="flex gap-0.5 p-1">
                <div className="flex-1 h-4 bg-white rounded" />
                <div className="flex-1 h-4 bg-black rounded" />
                <div className="flex-1 h-4 bg-white rounded" />
                <div className="flex-1 h-4 bg-black rounded" />
                <div className="flex-1 h-4 bg-white rounded" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-lg">DJ KeyKid</p>
            <p className="text-xs text-muted-foreground">Level 99 Keytar Master</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

import { Card } from "./ui/card";
import { Music, User } from "lucide-react";

interface TurnIndicatorProps {
  currentTurn: "npc-turn" | "player-turn" | "waiting" | "count-in" | "game-over";
  barNumber: number;
  totalBars: number;
  playerScore: number;
  turnPointsEarned: number;
}

export const TurnIndicator = ({ currentTurn, barNumber, totalBars, playerScore, turnPointsEarned }: TurnIndicatorProps) => {
  const getStatusMessage = () => {
    switch (currentTurn) {
      case "count-in":
        return "Get Ready!";
      case "npc-turn":
        return "DJ KeyKid's Turn";
      case "player-turn":
        return "Your Turn - Play a Lick!";
      case "game-over":
        return "Battle Complete!";
      default:
        return "Waiting...";
    }
  };

  const getStatusColor = () => {
    switch (currentTurn) {
      case "npc-turn":
        return "text-purple-500";
      case "player-turn":
        return "text-primary";
      case "game-over":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {currentTurn === "npc-turn" && <Music className="w-8 h-8 text-purple-500 animate-bounce" />}
          {currentTurn === "player-turn" && <User className="w-8 h-8 text-primary animate-pulse" />}
          <h2 className={`text-2xl font-bold ${getStatusColor()}`}>
            {getStatusMessage()}
          </h2>
        </div>

        {currentTurn !== "waiting" && currentTurn !== "count-in" && (
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Bar Progress</p>
              <p className="text-3xl font-bold">{barNumber} / {totalBars}</p>
            </div>
            
            <div className="w-px h-12 bg-border" />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <div className="flex items-baseline gap-2 justify-center">
                <p className="text-3xl font-bold text-primary">{playerScore}</p>
                {turnPointsEarned > 0 && (
                  <p className="text-2xl font-bold text-yellow-500 animate-pulse">
                    +{turnPointsEarned}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTurn !== "game-over" && currentTurn !== "waiting" && (
          <div className="w-full space-y-3">
            {/* Segmented bar showing each of the 8 bars with NPC/Player alternation */}
            <div className="grid grid-cols-8 gap-1 w-full">
              {Array.from({ length: totalBars }).map((_, idx) => {
                const index = idx + 1;
                const filled = index <= barNumber;
                const isNpc = index % 2 === 1;
                return (
                  <div
                    key={index}
                    className={
                      `h-2 rounded ${filled ? (isNpc ? 'bg-purple-500' : 'bg-primary') : 'bg-muted'}`
                    }
                    title={`${isNpc ? 'NPC' : 'You'} - Bar ${index}`}
                  />
                );
              })}
            </div>

            {/* Linear progress for smooth visual feedback */}
            <div className="w-full bg-secondary rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${(barNumber / totalBars) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

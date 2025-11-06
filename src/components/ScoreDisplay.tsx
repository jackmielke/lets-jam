import { Card } from "@/components/ui/card";
import { Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecognitionResult {
  lick: {
    name: string;
    difficulty?: number;
  };
  accuracy: number;
  points: number;
}

interface ScoreDisplayProps {
  score: number;
  recentRecognition: RecognitionResult | null;
  onReset: () => void;
}

export const ScoreDisplay = ({ score, recentRecognition, onReset }: ScoreDisplayProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Score</h3>
        </div>
        <Button 
          onClick={onReset} 
          variant="outline" 
          size="sm"
        >
          Reset
        </Button>
      </div>

      <div className="text-center space-y-4">
        <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          {score}
        </div>

        {recentRecognition && (
          <div className="animate-slide-up space-y-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Zap className="w-5 h-5 fill-current" />
              <span className="font-semibold">Lick Recognized!</span>
            </div>
            <div className="text-lg font-medium">
              {recentRecognition.lick.name}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Accuracy: {Math.round(recentRecognition.accuracy)}%</span>
              <span>•</span>
              <span className="text-primary font-semibold">+{recentRecognition.points} pts</span>
            </div>
          </div>
        )}

        {!recentRecognition && score === 0 && (
          <p className="text-sm text-muted-foreground">
            Start the metronome and play your saved licks to earn points!
          </p>
        )}
      </div>
    </Card>
  );
};

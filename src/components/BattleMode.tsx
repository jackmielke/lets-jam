import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Play, Square } from "lucide-react";
import { NPCCharacter } from "./NPCCharacter";
import { TurnIndicator } from "./TurnIndicator";
import { BattleDebugPanel } from "./BattleDebugPanel";
import { RealTimeNotesDisplay } from "./RealTimeNotesDisplay";
import { useBattleMode } from "@/hooks/useBattleMode";
import { Lick } from "@/types/lick";
import { RecordedNote } from "@/types/recording";

interface BattleModeProps {
  licks: Lick[];
  onPlayLick: (lick: Lick) => number;
  onStartMetronome: () => void;
  onStopMetronome: () => void;
  bpm: number;
  recordedNotes: RecordedNote[];
  onClearRecording: () => void;
  recognizedPoints: number;
  onResetRecognizedLicks: () => void;
  currentBeat: number;
  isMetronomePlaying: boolean;
  timingTolerance: number;
  isRecording: boolean;
}

export const BattleMode = ({
  licks,
  onPlayLick,
  onStartMetronome,
  onStopMetronome,
  bpm,
  recordedNotes,
  onClearRecording,
  recognizedPoints,
  onResetRecognizedLicks,
  currentBeat,
  isMetronomePlaying,
  timingTolerance,
  isRecording
}: BattleModeProps) => {

  const {
    gameState,
    currentBar,
    playerScore,
    turnPointsEarned,
    npcMessage,
    barScores,
    TOTAL_BARS,
    startGame,
    stopGame,
  } = useBattleMode({
    licks,
    onPlayLick,
    onStartMetronome,
    onStopMetronome,
    bpm,
    recordedNotes,
    onClearRecording,
    recognizedPoints,
    onResetRecognizedLicks
  });

  const isGameActive = gameState !== "waiting" && gameState !== "game-over";

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Battle Mode
        </h2>
        <p className="text-muted-foreground">
          Trade solos with DJ KeyKid! Play recognized licks to score points.
        </p>
      </div>

      {gameState !== "waiting" && (
        <>
          <TurnIndicator
            currentTurn={gameState}
            barNumber={currentBar}
            totalBars={TOTAL_BARS}
            playerScore={playerScore}
          />
          
          {/* Battle Metronome with Per-Bar Scores */}
          {isGameActive && isMetronomePlaying && (
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-3 py-4 px-6 bg-card/50 rounded-lg border border-border">
                <span className="text-sm font-medium text-muted-foreground">Beat:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((beat) => (
                    <div
                      key={beat}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-100 ${
                        currentBeat === beat
                          ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg'
                          : 'border-border text-muted-foreground bg-background'
                      }`}
                    >
                      {beat}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium text-muted-foreground ml-2">{bpm} BPM</span>
              </div>
              
              {/* Per-Bar Score Display */}
              <div className="flex justify-center items-center gap-2 flex-wrap px-4">
                {[2, 4, 6, 8].map((barNum) => {
                  const score = barScores.get(barNum);
                  const isCurrent = currentBar === barNum && gameState === "player-turn";
                  const isPast = currentBar > barNum;
                  
                  return (
                    <div
                      key={barNum}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-300 ${
                        isCurrent
                          ? 'border-primary bg-primary/10 scale-110'
                          : isPast && score !== undefined
                          ? 'border-border bg-card'
                          : 'border-border/50 bg-background/50 opacity-50'
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        Bar {barNum}
                      </span>
                      <div className={`text-2xl font-bold ${
                        score !== undefined && score > 0
                          ? 'text-primary'
                          : score === 0
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/50'
                      }`}>
                        {score !== undefined ? score : '—'}
                      </div>
                      {score !== undefined && score > 0 && (
                        <span className="text-xs text-primary">pts</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col items-center gap-4">
          <NPCCharacter
            isActive={gameState === "npc-turn"}
            message={npcMessage}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <Card className={`p-6 w-full transition-all duration-300 ${gameState === "player-turn" ? 'ring-4 ring-primary shadow-2xl' : 'opacity-60'}`}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full border-4 border-primary flex items-center justify-center">
                <div className="text-4xl">🎹</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">You</p>
                <p className="text-xs text-muted-foreground">Rising Star</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!isGameActive ? (
          <Button
            onClick={startGame}
            disabled={licks.length === 0}
            size="lg"
            className="gap-2"
          >
            <Play className="w-5 h-5" />
            Start Battle
          </Button>
        ) : (
          <Button
            onClick={stopGame}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="w-5 h-5" />
            Stop Battle
          </Button>
        )}
      </div>

      {licks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          You need to create some licks first! Record and save licks above to unlock Battle Mode.
        </p>
      )}

      {/* Debug Panels */}
      {isGameActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RealTimeNotesDisplay
            notes={recordedNotes}
            isRecording={isRecording && gameState === "player-turn"}
            currentBeat={currentBeat}
          />
          <BattleDebugPanel
            gameState={gameState}
            currentBar={currentBar}
            recordedNotes={recordedNotes}
            licks={licks}
            timingTolerance={timingTolerance}
            turnPointsEarned={turnPointsEarned}
            totalScore={playerScore}
            isRecording={isRecording && gameState === "player-turn"}
          />
        </div>
      )}

      {gameState === "game-over" && (
        <div className="text-center space-y-2 animate-fade-in">
          <h3 className="text-2xl font-bold text-primary">Battle Complete!</h3>
          <p className="text-lg">
            Final Score: <span className="font-bold text-3xl">{playerScore}</span> points
          </p>
          <p className="text-muted-foreground">
            {playerScore > 100 ? "🔥 Amazing performance!" : 
             playerScore > 50 ? "👍 Nice job!" : 
             "💪 Keep practicing!"}
          </p>
        </div>
      )}
    </Card>
  );
};

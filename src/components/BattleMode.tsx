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
import { Label } from "./ui/label";
import { useState } from "react";

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
  onResetScore: () => void;
  currentBeat: number;
  isMetronomePlaying: boolean;
  timingTolerance: number;
  isRecording: boolean;
  onBarChange: (barNumber: number) => void;
  recognizedLicksPerBar: Map<number, Array<{
    lick: Lick;
    accuracy: number;
    points: number;
  }>>;
  onResetBattleHistory?: () => void;
  onBattleStart?: () => void;
  onBattleEnd?: () => void;
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
  onResetScore,
  currentBeat,
  isMetronomePlaying,
  timingTolerance,
  isRecording,
  onBarChange,
  recognizedLicksPerBar,
  onResetBattleHistory,
  onBattleStart,
  onBattleEnd
}: BattleModeProps) => {
  const [battleTimingType, setBattleTimingType] = useState<'straight' | 'swing' | 'both'>('both');
  const [battleTotalBars, setBattleTotalBars] = useState<8 | 12 | 16>(8);

  const {
    gameState,
    currentBar,
    playerScore,
    turnPointsEarned,
    npcMessage,
    barScores,
    totalBars,
    startGame,
    stopGame,
  } = useBattleMode({
    licks,
    battleTimingType,
    totalBars: battleTotalBars,
    onPlayLick,
    onStartMetronome,
    onStopMetronome,
    bpm,
    recordedNotes,
    onClearRecording,
    recognizedPoints,
    onResetRecognizedLicks,
    onResetScore,
    onBarChange,
    onResetBattleHistory,
    onBattleStart,
    onBattleEnd
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
            totalBars={totalBars}
            playerScore={playerScore}
            turnPointsEarned={turnPointsEarned}
          />
          
          {/* Battle Metronome Beat Display */}
          {isGameActive && isMetronomePlaying && (
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
          )}
          
          {/* Per-Bar Score Display - Stays visible after game ends */}
          {gameState !== "count-in" && (
            <div className="flex justify-center items-center gap-2 flex-wrap px-4">
              {Array.from({ length: totalBars / 2 }, (_, i) => (i + 1) * 2).map((barNum) => {
                const score = barScores.get(barNum);
                const isCurrent = currentBar === barNum && gameState === "player-turn";
                const isPast = currentBar > barNum || gameState === "game-over";
                
                return (
                  <div
                    key={barNum}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-300 ${
                      isCurrent
                        ? 'border-primary bg-primary/10 scale-110'
                        : isPast
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

      {/* Timing Type Filter */}
      {(gameState === "waiting" || gameState === "game-over") && licks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Battle Timing:</Label>
            <div className="flex gap-2">
              <Button
                variant={battleTimingType === 'straight' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTimingType('straight')}
              >
                Straight Only
              </Button>
              <Button
                variant={battleTimingType === 'swing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTimingType('swing')}
              >
                Swing Only
              </Button>
              <Button
                variant={battleTimingType === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTimingType('both')}
              >
                Both
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {battleTimingType === 'both' 
              ? `${licks.length} licks available`
              : `${licks.filter(l => l.timingType === battleTimingType).length} ${battleTimingType} licks available`
            }
          </p>
        </Card>
      )}

      {/* Battle Length Selection */}
      {(gameState === "waiting" || gameState === "game-over") && licks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Battle Length:</Label>
            <div className="flex gap-2">
              <Button
                variant={battleTotalBars === 8 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTotalBars(8)}
              >
                8 Bars
              </Button>
              <Button
                variant={battleTotalBars === 12 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTotalBars(12)}
              >
                12 Bars
              </Button>
              <Button
                variant={battleTotalBars === 16 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBattleTotalBars(16)}
              >
                16 Bars
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {battleTotalBars === 8 ? '4 player turns' : battleTotalBars === 12 ? '6 player turns' : '8 player turns'} — More turns = higher potential score!
          </p>
        </Card>
      )}

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

      {/* Debug Panels / Performance Review */}
      {(isGameActive || gameState === "game-over") && (
        <div className="space-y-4">
          {gameState === "game-over" && (
            <div className="text-center space-y-1 pt-4 border-t border-border">
              <h3 className="text-xl font-semibold text-primary">Battle Performance Review</h3>
              <p className="text-sm text-muted-foreground">Review your notes and timing from the battle</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RealTimeNotesDisplay
              notes={recordedNotes}
              isRecording={isRecording && gameState === "player-turn"}
              currentBeat={currentBeat}
              gameState={gameState}
              recognizedLicksPerBar={recognizedLicksPerBar}
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

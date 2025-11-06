import { useState, useCallback, useRef, useEffect } from "react";
import { Lick } from "@/types/lick";
import { RecordedNote } from "@/types/recording";
import { toast } from "sonner";

type GameState = "waiting" | "count-in" | "npc-turn" | "player-turn" | "game-over";

interface UseBattleModeProps {
  licks: Lick[];
  onPlayLick: (lick: Lick) => number;
  onStartMetronome: () => void;
  onStopMetronome: () => void;
  bpm: number;
  recordedNotes: RecordedNote[];
  onClearRecording: () => void;
  recognizedPoints: number;
}

export const useBattleMode = ({
  licks,
  onPlayLick,
  onStartMetronome,
  onStopMetronome,
  bpm,
  recordedNotes,
  onClearRecording,
  recognizedPoints
}: UseBattleModeProps) => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [currentBar, setCurrentBar] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [npcMessage, setNpcMessage] = useState<string>("");
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreSnapshotRef = useRef(0);

  const TOTAL_BARS = 8;
  const beatDuration = (60 / bpm) * 1000;
  const barDuration = beatDuration * 4; // 4 beats per bar

  const clearTurnTimeout = useCallback(() => {
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
  }, []);

  const playNPCTurn = useCallback(() => {
    if (licks.length === 0) {
      toast.error("No licks available for NPC to play!");
      return;
    }

    // Pick a random lick
    const randomLick = licks[Math.floor(Math.random() * licks.length)];
    
    setNpcMessage(`Playing: ${randomLick.name}`);
    onPlayLick(randomLick);
    
    toast.info(`DJ KeyKid plays: ${randomLick.name}`);
  }, [licks, onPlayLick]);

  const startPlayerTurn = useCallback(() => {
    setGameState("player-turn");
    setNpcMessage("your turn!");
    
    // Clear any previous recording
    onClearRecording();
    
    // Take snapshot of current score at start of turn
    scoreSnapshotRef.current = recognizedPoints;
    
    // End turn after one bar
    turnTimeoutRef.current = setTimeout(() => {
      // Calculate points earned this turn
      const pointsEarned = recognizedPoints - scoreSnapshotRef.current;
      setPlayerScore(prev => prev + pointsEarned);
      
      if (pointsEarned > 0) {
        toast.success(`+${pointsEarned} points!`);
      }
      
      // Move to next bar
      const nextBar = currentBar + 1;
      setCurrentBar(nextBar);

      if (nextBar >= TOTAL_BARS) {
        endGame();
      } else {
        // NPC's turn
        setGameState("npc-turn");
        playNPCTurn();
        
        turnTimeoutRef.current = setTimeout(() => {
          startPlayerTurn();
        }, barDuration);
      }
    }, barDuration);
  }, [currentBar, barDuration, onClearRecording, recognizedPoints, playNPCTurn]);

  const startGame = useCallback(() => {
    if (licks.length === 0) {
      toast.error("Create some licks first!");
      return;
    }

    setGameState("count-in");
    setCurrentBar(0);
    setPlayerScore(0);
    scoreSnapshotRef.current = 0;
    onClearRecording();
    
    setNpcMessage("yo let's jam!");
    toast.info("Get ready! Count-in starting...");

    // Start metronome
    onStartMetronome();

    // Wait for count-in (one bar = 4 beats)
    turnTimeoutRef.current = setTimeout(() => {
      // NPC goes first
      setGameState("npc-turn");
      setCurrentBar(1);
      playNPCTurn();

      // After NPC's bar, player's turn
      turnTimeoutRef.current = setTimeout(() => {
        startPlayerTurn();
      }, barDuration);
    }, barDuration);
  }, [licks.length, onStartMetronome, onClearRecording, playNPCTurn, startPlayerTurn, barDuration]);

  const endGame = useCallback(() => {
    setGameState("game-over");
    onStopMetronome();
    clearTurnTimeout();
    
    const finalScore = playerScore + (recognizedPoints - scoreSnapshotRef.current);
    setPlayerScore(finalScore);
    
    setNpcMessage(finalScore > 50 ? "nice moves!" : "I bet you can't beat me!");
    toast.success(`Battle over! Final score: ${finalScore} points`);
  }, [onStopMetronome, clearTurnTimeout, playerScore, recognizedPoints]);

  const stopGame = useCallback(() => {
    setGameState("waiting");
    setCurrentBar(0);
    setPlayerScore(0);
    onStopMetronome();
    clearTurnTimeout();
    onClearRecording();
    setNpcMessage("");
  }, [onStopMetronome, clearTurnTimeout, onClearRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTurnTimeout();
    };
  }, [clearTurnTimeout]);

  return {
    gameState,
    currentBar,
    playerScore,
    npcMessage,
    TOTAL_BARS,
    startGame,
    stopGame,
  };
};

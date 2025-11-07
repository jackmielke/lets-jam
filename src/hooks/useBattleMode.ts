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
  onResetRecognizedLicks: () => void;
}

export const useBattleMode = ({
  licks,
  onPlayLick,
  onStartMetronome,
  onStopMetronome,
  bpm,
  recordedNotes,
  onClearRecording,
  recognizedPoints,
  onResetRecognizedLicks
}: UseBattleModeProps) => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [currentBar, setCurrentBar] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [npcMessage, setNpcMessage] = useState<string>("");
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreSnapshotRef = useRef(0);
  const barIndexRef = useRef(0);
  const recognizedPointsRef = useRef(recognizedPoints);
  useEffect(() => {
    recognizedPointsRef.current = recognizedPoints;
  }, [recognizedPoints]);

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

  const endGame = useCallback(() => {
    setGameState("game-over");
    onStopMetronome();
    clearTurnTimeout();
    
    const finalScore = playerScore + (recognizedPoints - scoreSnapshotRef.current);
    setPlayerScore(finalScore);
    
    setNpcMessage("alright battle's over!");
    toast.success(`Battle over! Final score: ${finalScore} points`);
  }, [onStopMetronome, clearTurnTimeout, playerScore, recognizedPoints]);

  const runBar = useCallback(() => {
    // End condition: after TOTAL_BARS
    if (barIndexRef.current > TOTAL_BARS) {
      endGame();
      return;
    }

    const barNumber = barIndexRef.current;
    setCurrentBar(barNumber);

    const isNpcTurn = barNumber % 2 === 1; // 1,3,5,7 -> NPC; 2,4,6,8 -> Player

    if (isNpcTurn) {
      setGameState("npc-turn");
      setNpcMessage("DJ KeyKid's turn!");
      playNPCTurn();

      // Schedule next bar
      clearTurnTimeout();
      turnTimeoutRef.current = setTimeout(() => {
        barIndexRef.current += 1;
        runBar();
      }, barDuration);
    } else {
      setGameState("player-turn");
      setNpcMessage("your turn!");

      // Prepare for player's recording window
      onClearRecording();
      onResetRecognizedLicks(); // Allow same licks to be recognized again this turn
      scoreSnapshotRef.current = recognizedPointsRef.current;
      console.log(`🎮 Player turn ${barNumber}: Score snapshot = ${scoreSnapshotRef.current}`);

      // End player bar after one bar, add points, then advance
      clearTurnTimeout();
      turnTimeoutRef.current = setTimeout(() => {
        const pointsEarned = Math.max(0, recognizedPointsRef.current - scoreSnapshotRef.current);
        setPlayerScore(prev => prev + pointsEarned);
        console.log(`🎮 Player turn ${barNumber} ended: Points earned = ${pointsEarned} (total: ${recognizedPointsRef.current}, snapshot: ${scoreSnapshotRef.current})`);
        if (pointsEarned > 0) {
          toast.success(`+${pointsEarned} points!`);
        } else {
          console.warn(`⚠️ No points earned this turn (or negative prevented)`);
        }
        barIndexRef.current += 1;
        runBar();
      }, barDuration);
    }
  }, [TOTAL_BARS, barDuration, endGame, onClearRecording, onResetRecognizedLicks, playNPCTurn]);

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
      // Start at bar 1 after count-in
      barIndexRef.current = 1;
      runBar();
    }, barDuration);
  }, [licks.length, onStartMetronome, onClearRecording, runBar, barDuration]);

  const stopGame = useCallback(() => {
    setGameState("waiting");
    setCurrentBar(0);
    barIndexRef.current = 0;
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

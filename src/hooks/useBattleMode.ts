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
  onResetScore: () => void;
  onBarChange: (barNumber: number) => void;
  onResetBattleHistory?: () => void;
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
  onResetRecognizedLicks,
  onResetScore,
  onBarChange,
  onResetBattleHistory
}: UseBattleModeProps) => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [currentBar, setCurrentBar] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [turnPointsEarned, setTurnPointsEarned] = useState(0);
  const [npcMessage, setNpcMessage] = useState<string>("");
  const [barScores, setBarScores] = useState<Map<number, number>>(new Map());
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointsTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const scoreSnapshotRef = useRef(0);
  const barIndexRef = useRef(0);
  const recognizedPointsRef = useRef(recognizedPoints);
  
  // Track points earned this turn
  useEffect(() => {
    const pointsThisTurn = Math.max(0, recognizedPoints - scoreSnapshotRef.current);
    setTurnPointsEarned(pointsThisTurn);
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

  const clearAllTimeouts = useCallback(() => {
    clearTurnTimeout();
    pointsTimeoutsRef.current.forEach(clearTimeout);
    pointsTimeoutsRef.current = [];
  }, [clearTurnTimeout]);

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
    clearAllTimeouts();
    
    const finalScore = playerScore + Math.max(0, recognizedPoints - scoreSnapshotRef.current);
    setPlayerScore(finalScore);
    
    console.log(`🏁 Battle ended: Final score = ${finalScore} (player: ${playerScore}, last turn: ${Math.max(0, recognizedPoints - scoreSnapshotRef.current)})`);
    
    setNpcMessage("alright battle's over!");
    toast.success(`Battle over! Final score: ${finalScore} points`);
  }, [onStopMetronome, clearAllTimeouts, playerScore, recognizedPoints]);

  const runBar = useCallback(() => {
    // End condition: after TOTAL_BARS
    if (barIndexRef.current > TOTAL_BARS) {
      endGame();
      return;
    }

    const barNumber = barIndexRef.current;
    setCurrentBar(barNumber);
    onBarChange(barNumber);

    const isNpcTurn = barNumber % 2 === 1; // 1,3,5,7 -> NPC; 2,4,6,8 -> Player

    if (isNpcTurn) {
      setGameState("npc-turn");
      setNpcMessage("DJ KeyKid's turn!");
      
      // Don't clear recordings - preserve full battle history for review
      
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
      // Note: We DON'T clear recordings here - that happens at start of NPC turn
      // This allows anticipatory notes from the end of the previous bar to be preserved
      onResetRecognizedLicks(); // Allow same licks to be recognized again this turn
      scoreSnapshotRef.current = recognizedPointsRef.current;
      setTurnPointsEarned(0); // Reset turn points display
      console.log(`🎮 Player turn ${barNumber}: Score snapshot = ${scoreSnapshotRef.current}`);

      // Schedule bar advancement after exactly barDuration (no delay)
      clearTurnTimeout();
      turnTimeoutRef.current = setTimeout(() => {
        barIndexRef.current += 1;
        runBar();
      }, barDuration);

      // Calculate points 150ms after bar ends (grace period for recognition)
      const pointsTimeoutId = setTimeout(() => {
        const pointsEarned = Math.max(0, recognizedPointsRef.current - scoreSnapshotRef.current);
        setPlayerScore(prev => prev + pointsEarned);
        setBarScores(prev => new Map(prev).set(barNumber, pointsEarned));
        console.log(`🎮 Player turn ${barNumber} ended: Points earned = ${pointsEarned} (total: ${recognizedPointsRef.current}, snapshot: ${scoreSnapshotRef.current})`);
        console.log(`   📊 Notes played: ${recordedNotes.length}, Licks available: ${licks.length}`);
        if (pointsEarned > 0) {
          toast.success(`+${pointsEarned} points!`);
        } else {
          toast.info("No licks recognized this turn");
          console.warn(`⚠️ No points earned this turn`);
        }
      }, barDuration + 150);
      
      // Track points timeout so it can be cleared if game stops
      pointsTimeoutsRef.current.push(pointsTimeoutId);
    }
  }, [TOTAL_BARS, barDuration, endGame, onClearRecording, onResetRecognizedLicks, playNPCTurn, clearTurnTimeout]);

  const startGame = useCallback(() => {
    if (licks.length === 0) {
      toast.error("Create some licks first!");
      return;
    }

    // Reset score to start fresh for this battle
    onResetScore();
    onResetBattleHistory?.();
    
    setGameState("count-in");
    setCurrentBar(0);
    setPlayerScore(0);
    setBarScores(new Map());
    scoreSnapshotRef.current = 0;
    onClearRecording();
    
    console.log("🎮 Battle starting: Score reset to 0");
    
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
  }, [licks.length, onStartMetronome, onClearRecording, onResetScore, onResetBattleHistory, runBar, barDuration]);

  const stopGame = useCallback(() => {
    setGameState("waiting");
    setCurrentBar(0);
    barIndexRef.current = 0;
    setPlayerScore(0);
    setBarScores(new Map());
    onStopMetronome();
    clearAllTimeouts();
    onClearRecording();
    setNpcMessage("");
  }, [onStopMetronome, clearAllTimeouts, onClearRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    gameState,
    currentBar,
    playerScore,
    turnPointsEarned,
    npcMessage,
    barScores,
    TOTAL_BARS,
    startGame,
    stopGame,
  };
};

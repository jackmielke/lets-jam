import { useState, useCallback, useRef, useEffect } from "react";
import { Lick } from "@/types/lick";
import { RecordedNote } from "@/types/recording";
import { toast } from "sonner";

type GameState = "waiting" | "count-in" | "npc-turn" | "player-turn" | "game-over";

interface UseBattleModeProps {
  licks: Lick[];
  battleTimingType: 'straight' | 'swing' | 'both';
  totalBars: number;
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
  onBattleStart?: () => void;
  onBattleEnd?: () => void;
}

export const useBattleMode = ({
  licks,
  battleTimingType,
  totalBars,
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
    // Filter licks based on timing type
    const availableLicks = battleTimingType === 'both'
      ? licks
      : licks.filter(l => l.timingType === battleTimingType);
      
    if (availableLicks.length === 0) {
      toast.error("No licks available for NPC to play!");
      return;
    }

    // Pick a random lick from available licks
    const randomLick = availableLicks[Math.floor(Math.random() * availableLicks.length)];
    
    setNpcMessage(`Playing: ${randomLick.name}`);
    onPlayLick(randomLick);
    
    toast.info(`DJ KeyKid plays: ${randomLick.name}`);
  }, [licks, battleTimingType, onPlayLick]);

  const endGame = useCallback(() => {
    console.log("🏁 endGame() called - stopping battle");
    setGameState("game-over");
    onStopMetronome();
    console.log("🎵 Calling onBattleEnd to stop music");
    onBattleEnd?.();
    clearAllTimeouts();
    
    // Calculate points from the last bar using the ref (always current)
    const lastBarPoints = Math.max(0, recognizedPointsRef.current - scoreSnapshotRef.current);
    
    // Update bar scores to include the final bar
    setBarScores(prev => new Map(prev).set(totalBars, lastBarPoints));
    
    // Use functional update to avoid stale closure issues
    setPlayerScore(prev => {
      const finalScore = prev + lastBarPoints;
      console.log(`🏁 Battle ended: Final score = ${finalScore} (accumulated: ${prev}, last turn: ${lastBarPoints})`);
      toast.success(`Battle over! Final score: ${finalScore} points`);
      return finalScore;
    });
    
    setNpcMessage("alright battle's over!");
  }, [onStopMetronome, onBattleEnd, clearAllTimeouts, totalBars]);

  const runBar = useCallback(() => {
    // End condition: after totalBars
    if (barIndexRef.current > totalBars) {
      endGame();
      return;
    }

    const barNumber = barIndexRef.current;
    console.log(`🎯 runBar() called: barIndexRef.current=${barIndexRef.current}, barNumber=${barNumber}`);
    
    setCurrentBar(barNumber);
    onBarChange(barNumber);

    const isNpcTurn = barNumber % 2 === 1; // 1,3,5,7 -> NPC; 2,4,6,8 -> Player
    console.log(`🎮 Starting bar ${barNumber}: isNpcTurn=${isNpcTurn}, gameState will be ${isNpcTurn ? 'npc-turn' : 'player-turn'}`);

    if (isNpcTurn) {
      console.log(`🤖 NPC TURN: Setting state to npc-turn for bar ${barNumber}`);
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
      console.log(`👤 PLAYER TURN: Setting state to player-turn for bar ${barNumber}`);
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
  }, [totalBars, barDuration, endGame, onClearRecording, onResetRecognizedLicks, playNPCTurn, clearTurnTimeout]);

  const startGame = useCallback(() => {
    if (licks.length === 0) {
      toast.error("Create some licks first!");
      return;
    }

    // Reset score to start fresh for this battle
    onResetScore();
    onResetBattleHistory?.();
    
    console.log("🚀 startGame() called: Initializing battle");
    setGameState("count-in");
    setCurrentBar(0);
    setPlayerScore(0);
    setBarScores(new Map());
    scoreSnapshotRef.current = 0;
    onClearRecording();
    
    console.log("🎮 Battle starting: Score reset to 0, barIndexRef.current =", barIndexRef.current);
    
    setNpcMessage("yo let's jam!");
    toast.info("Get ready! Count-in starting...");

    // Start metronome and backing track together at count-in
    onStartMetronome();
    onBattleStart?.(); // Start music with the count-in metronome

    // Wait for count-in (one bar = 4 beats)
    turnTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Count-in complete! Setting barIndexRef to 1 and calling runBar()");
      // Start at bar 1 after count-in - this is when the battle actually begins
      barIndexRef.current = 1;
      runBar();
    }, barDuration);
  }, [licks.length, onStartMetronome, onClearRecording, onResetScore, onResetBattleHistory, onBattleStart, runBar, barDuration]);

  const stopGame = useCallback(() => {
    console.log("🛑 stopGame() called - resetting battle");
    setGameState("waiting");
    setCurrentBar(0);
    barIndexRef.current = 0;
    setPlayerScore(0);
    setBarScores(new Map());
    onStopMetronome();
    console.log("🎵 Calling onBattleEnd to stop music (from stopGame)");
    onBattleEnd?.();
    clearAllTimeouts();
    onClearRecording();
    setNpcMessage("");
  }, [onStopMetronome, onBattleEnd, clearAllTimeouts, onClearRecording]);

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
    totalBars,
    startGame,
    stopGame,
  };
};

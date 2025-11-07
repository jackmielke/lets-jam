import { useState, useEffect, useCallback } from "react";
import { DrumGrid } from "@/components/DrumGrid";
import { Controls } from "@/components/Controls";
import { Sequencer } from "@/components/Sequencer";
import { Metronome } from "@/components/Metronome";
import { RecordingDisplay } from "@/components/RecordingDisplay";
import { LickLibrary } from "@/components/LickLibrary";
import { LickEditor } from "@/components/LickEditor";
import { LickSequencer } from "@/components/LickSequencer";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { BackgroundMusicUpload } from "@/components/BackgroundMusicUpload";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { SampleRecorder } from "@/components/SampleRecorder";
import { SampleLibrary } from "@/components/SampleLibrary";
import { BattleMode } from "@/components/BattleMode";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardMapping } from "@/hooks/useKeyboardMapping";
import { useMetronome } from "@/hooks/useMetronome";
import { useLickPlayback } from "@/hooks/useLickPlayback";
import { useLickRecognition } from "@/hooks/useLickRecognition";
import { DrumSound } from "@/types/audio";
import { RecordedNote } from "@/types/recording";
import { Lick } from "@/types/lick";
import { quantizeRecording } from "@/utils/quantize";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash } from "lucide-react";
import teamPhoto from "@/assets/team-photo.jpeg";

const drumSounds: DrumSound[] = [
  // Octava 3
  { id: "c3", name: "C3", type: "kick", frequency: 130.81, color: "bg-white" },
  { id: "cs3", name: "C#3", type: "snare", frequency: 138.59, color: "bg-black" },
  { id: "d3", name: "D3", type: "hihat", frequency: 146.83, color: "bg-white" },
  { id: "ds3", name: "D#3", type: "clap", frequency: 155.56, color: "bg-black" },
  { id: "e3", name: "E3", type: "tom", frequency: 164.81, color: "bg-white" },
  { id: "f3", name: "F3", type: "cymbal", frequency: 174.61, color: "bg-white" },
  { id: "fs3", name: "F#3", type: "cowbell", frequency: 185.00, color: "bg-black" },
  { id: "g3", name: "G3", type: "rim", frequency: 196.00, color: "bg-white" },
  { id: "gs3", name: "G#3", type: "kick", frequency: 207.65, color: "bg-black" },
  { id: "a3", name: "A3", type: "snare", frequency: 220.00, color: "bg-white" },
  { id: "as3", name: "A#3", type: "hihat", frequency: 233.08, color: "bg-black" },
  { id: "b3", name: "B3", type: "clap", frequency: 246.94, color: "bg-white" },
  
  // Octava 4 (central)
  { id: "c4", name: "C4", type: "tom", frequency: 261.63, color: "bg-white" },
  { id: "cs4", name: "C#4", type: "cymbal", frequency: 277.18, color: "bg-black" },
  { id: "d4", name: "D4", type: "cowbell", frequency: 293.66, color: "bg-white" },
  { id: "ds4", name: "D#4", type: "rim", frequency: 311.13, color: "bg-black" },
  { id: "e4", name: "E4", type: "kick", frequency: 329.63, color: "bg-white" },
  { id: "f4", name: "F4", type: "snare", frequency: 349.23, color: "bg-white" },
  { id: "fs4", name: "F#4", type: "hihat", frequency: 369.99, color: "bg-black" },
  { id: "g4", name: "G4", type: "clap", frequency: 392.00, color: "bg-white" },
  { id: "gs4", name: "G#4", type: "tom", frequency: 415.30, color: "bg-black" },
  { id: "a4", name: "A4", type: "cymbal", frequency: 440.00, color: "bg-white" },
  { id: "as4", name: "A#4", type: "cowbell", frequency: 466.16, color: "bg-black" },
  { id: "b4", name: "B4", type: "rim", frequency: 493.88, color: "bg-white" },
  
  // Octava 5
  { id: "c5", name: "C5", type: "kick", frequency: 523.25, color: "bg-white" },
  { id: "cs5", name: "C#5", type: "snare", frequency: 554.37, color: "bg-black" },
  { id: "d5", name: "D5", type: "hihat", frequency: 587.33, color: "bg-white" },
  { id: "ds5", name: "D#5", type: "clap", frequency: 622.25, color: "bg-black" },
  { id: "e5", name: "E5", type: "tom", frequency: 659.25, color: "bg-white" },
  { id: "f5", name: "F5", type: "cymbal", frequency: 698.46, color: "bg-white" },
  { id: "fs5", name: "F#5", type: "cowbell", frequency: 739.99, color: "bg-black" },
  { id: "g5", name: "G5", type: "rim", frequency: 783.99, color: "bg-white" },
  { id: "gs5", name: "G#5", type: "kick", frequency: 830.61, color: "bg-black" },
  { id: "a5", name: "A5", type: "snare", frequency: 880.00, color: "bg-white" },
  { id: "as5", name: "A#5", type: "hihat", frequency: 932.33, color: "bg-black" },
  { id: "b5", name: "B5", type: "clap", frequency: 987.77, color: "bg-white" },
];

const Index = () => {
  const { playSound, instrumentType, setInstrumentType, isReady, setLatencyCallback } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [licks, setLicks] = useState<Lick[]>(() => {
    // Load saved licks from localStorage on initial mount
    const saved = localStorage.getItem('pianomaker-licks');
    return saved ? JSON.parse(saved) : [];
  });
  const [lickName, setLickName] = useState("");
  const [editingLickId, setEditingLickId] = useState<string | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [steps, setSteps] = useState<boolean[][]>(
    drumSounds.map(() => Array(16).fill(false))
  );
  const [musicRefreshTrigger, setMusicRefreshTrigger] = useState(0);
  const [sampleRefreshTrigger, setSampleRefreshTrigger] = useState(0);
  const [latencyStats, setLatencyStats] = useState({
    keyHandler: 0,
    audioSchedule: 0,
    total: 0,
    lastUpdate: Date.now()
  });
  const [timingTolerance, setTimingTolerance] = useState(150); // ms tolerance for lick recognition

  // Metronome for rhythm tracking
  const metronome = useMetronome({
    bpm: metronomeBpm,
    beatsPerBar: 4
  });

  // Persist licks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pianomaker-licks', JSON.stringify(licks));
  }, [licks]);

  // Setup latency monitoring
  useEffect(() => {
    setLatencyCallback((audioLatency) => {
      setLatencyStats(prev => ({
        ...prev,
        audioSchedule: audioLatency,
        total: prev.keyHandler + audioLatency,
        lastUpdate: Date.now()
      }));
    });
  }, [setLatencyCallback]);

  const handlePlaySound = useCallback((soundId: string) => {
    const keyPressTime = performance.now();
    const sound = drumSounds.find((s) => s.id === soundId);
    if (sound) {
      playSound(sound.type, sound.frequency);
      const handlerLatency = performance.now() - keyPressTime;
      
      // Update latency stats
      setLatencyStats(prev => ({
        keyHandler: handlerLatency,
        audioSchedule: prev.audioSchedule, // Will be updated by playSound
        total: handlerLatency + prev.audioSchedule,
        lastUpdate: Date.now()
      }));
      
      setPressedKeyId(soundId);
      setTimeout(() => setPressedKeyId(null), 200);

      // Record note if metronome is playing
      if (metronome.isPlaying) {
        const timestamp = Date.now();
        const beatInfo = metronome.getBeatAtTimestamp(timestamp);
        const accuracy = metronome.getTimingAccuracy(timestamp);

        const recordedNote: RecordedNote = {
          soundId: sound.id,
          noteName: sound.name,
          timestamp,
          beatNumber: beatInfo.beatNumber,
          subdivision: beatInfo.subdivision,
          offsetMs: accuracy.offsetMs,
          accuracy: accuracy.accuracy
        };

        console.log(`🎹 Note recorded: ${sound.name} at beat ${beatInfo.beatNumber}.${beatInfo.subdivision}`);
        setRecordedNotes(prev => [...prev, recordedNote]);
      }
    }
  }, [playSound, metronome]);

  // Enable keyboard mapping
  useKeyboardMapping({ 
    onKeyPress: handlePlaySound,
    enabled: true 
  });

  const handleClearRecording = useCallback(() => {
    setRecordedNotes([]);
    setEditingLickId(null);
    setLickName("");
    toast.success("Recording cleared!");
  }, []);

  const handleSaveLick = useCallback(() => {
    if (recordedNotes.length === 0) {
      toast.error("No notes recorded!");
      return;
    }

    if (!lickName.trim()) {
      toast.error("Please enter a lick name!");
      return;
    }

    const quantizedNotes = quantizeRecording(recordedNotes);

    if (editingLickId) {
      // Update existing lick
      setLicks(prev => prev.map(lick => 
        lick.id === editingLickId 
          ? { ...lick, name: lickName.trim(), notes: quantizedNotes, bpm: metronomeBpm }
          : lick
      ));
      toast.success(`Lick "${lickName}" updated!`);
    } else {
      // Create new lick
      if (licks.length >= 5) {
        toast.error("Maximum 5 licks reached!");
        return;
      }

      const newLick: Lick = {
        id: Date.now().toString(),
        name: lickName.trim(),
        notes: quantizedNotes,
        bpm: metronomeBpm,
        createdAt: Date.now()
      };

      setLicks(prev => [...prev, newLick]);
      toast.success(`Lick "${newLick.name}" saved!`);
    }

    setRecordedNotes([]);
    setLickName("");
    setEditingLickId(null);
  }, [recordedNotes, lickName, licks.length, metronomeBpm, editingLickId]);

  const handleUpdateNote = useCallback((noteIndex: number, beatNumber: number, subdivision: number) => {
    setRecordedNotes(prev => {
      const newNotes = [...prev];
      newNotes[noteIndex] = {
        ...newNotes[noteIndex],
        beatNumber,
        subdivision
      };
      return newNotes;
    });
  }, []);

  const handleEditLick = useCallback((lick: Lick) => {
    // Convert LickNote[] to RecordedNote[] for the editor
    const notes: RecordedNote[] = lick.notes.map(note => ({
      soundId: note.soundId,
      noteName: note.noteName,
      timestamp: 0, // Not needed for editing
      beatNumber: note.beatNumber,
      subdivision: note.subdivision,
      offsetMs: 0,
      accuracy: 'perfect' as const
    }));

    setRecordedNotes(notes);
    setLickName(lick.name);
    setEditingLickId(lick.id);
    toast.info(`Editing: ${lick.name}`);
  }, []);

  const handleDeleteLick = useCallback((lickId: string) => {
    setLicks(prev => prev.filter(l => l.id !== lickId));
    if (editingLickId === lickId) {
      setEditingLickId(null);
      setRecordedNotes([]);
      setLickName("");
    }
    toast.success("Lick deleted!");
  }, [editingLickId]);

  const handleUpdateDifficulty = useCallback((lickId: string, difficulty: number) => {
    setLicks(prev => prev.map(lick => 
      lick.id === lickId 
        ? { ...lick, difficulty: difficulty || undefined }
        : lick
    ));
  }, []);

  // Lick playback
  const { playLick } = useLickPlayback({
    onPlaySound: handlePlaySound,
    onHighlight: setPressedKeyId,
    drumSounds,
    bpm: metronomeBpm
  });

  // Lick recognition
  const { totalScore, recentRecognition, resetScore, resetRecognizedLicks } = useLickRecognition({
    licks,
    recordedNotes,
    isRecording: metronome.isPlaying,
    beatDuration: metronome.beatDuration,
    timingTolerance,
    onLickRecognized: (result) => {
      toast.success(
        `🎯 ${result.lick.name} recognized! +${result.points} points (${Math.round(result.accuracy)}% accuracy)`,
        { duration: 3000 }
      );
    }
  });

  const handleDemonstrateLick = useCallback((lick: Lick) => {
    // Start metronome if not playing
    if (!metronome.isPlaying) {
      metronome.start();
      // Wait one full bar (4 beats) before playing the lick
      const beatDuration = (60 / metronomeBpm) * 1000;
      const oneBarDelay = beatDuration * 4;
      
      toast.success(`Demonstrating: ${lick.name} (starting in 4 beats)`);
      
      setTimeout(() => {
        const lickDuration = playLick(lick);
        // Stop metronome after lick finishes
        setTimeout(() => {
          metronome.stop();
        }, lickDuration);
      }, oneBarDelay);
    } else {
      toast.success(`Demonstrating: ${lick.name}`);
      const lickDuration = playLick(lick);
      // Stop metronome after lick finishes
      setTimeout(() => {
        metronome.stop();
      }, lickDuration);
    }
  }, [playLick, metronome, metronomeBpm]);

  const handlePlaySequence = useCallback((sequence: Lick[]) => {
    if (sequence.length === 0) return;
    
    setIsPlayingSequence(true);
    
    // Start metronome if not playing
    if (!metronome.isPlaying) {
      metronome.start();
    }

    const beatDuration = (60 / metronomeBpm) * 1000;
    const oneBarDelay = beatDuration * 4;
    
    toast.success(`Playing sequence (${sequence.length} licks)`);

    // Calculate the duration of each lick in beats and round up to next full measure
    const getLickMeasureDuration = (lick: Lick) => {
      let maxBeatsFromStart = 0;
      lick.notes.forEach(note => {
        // Convert beat number (1-indexed) to beats from start (0-indexed)
        const beatsFromStart = (note.beatNumber - 1) + note.subdivision;
        maxBeatsFromStart = Math.max(maxBeatsFromStart, beatsFromStart);
      });
      // Round up to next multiple of 4 (full measure)
      return Math.ceil((maxBeatsFromStart + 0.01) / 4) * 4;
    };

    // Play licks one after another, aligned to measure boundaries
    const playNextLick = (index: number, delay: number) => {
      if (index >= sequence.length) {
        setTimeout(() => {
          metronome.stop();
          setIsPlayingSequence(false);
        }, delay);
        return;
      }

      setTimeout(() => {
        const lick = sequence[index];
        playLick(lick);
        
        // Calculate how many beats this lick spans (rounded to full measures)
        const lickBeats = getLickMeasureDuration(lick);
        const lickDuration = lickBeats * beatDuration;
        
        // Schedule next lick to start exactly on the next measure
        playNextLick(index + 1, lickDuration);
      }, delay);
    };

    playNextLick(0, oneBarDelay);
  }, [playLick, metronome, metronomeBpm]);

  const handleToggleStep = useCallback((soundIndex: number, stepIndex: number) => {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[soundIndex] = [...newSteps[soundIndex]];
      newSteps[soundIndex][stepIndex] = !newSteps[soundIndex][stepIndex];
      return newSteps;
    });
  }, []);

  const handleClear = useCallback(() => {
    setSteps(drumSounds.map(() => Array(16).fill(false)));
    setIsPlaying(false);
    setCurrentStep(0);
    toast.success("Sequence cleared!");
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % 16;
        
        // Play sounds for active steps
        drumSounds.forEach((sound, soundIndex) => {
          if (steps[soundIndex]?.[nextStep]) {
            playSound(sound.type, sound.frequency);
          }
        });
        
        return nextStep;
      });
    }, (60 / tempo) * 1000 / 4); // Quarter notes

    return () => clearInterval(interval);
  }, [isPlaying, tempo, steps, playSound]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    if (!isPlaying) {
      toast.success("Playing sequence!");
    } else {
      toast.info("Paused");
    }
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle background photo */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${teamPhoto})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="text-center space-y-4 animate-slide-up">
          <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Piano Maker
          </h1>
          <p className="text-muted-foreground text-lg">
            Play using your keyboard: <span className="font-mono font-bold">ASDFGHJKL;'</span> for white keys, <span className="font-mono font-bold">WETUI O</span> for black keys
          </p>
        </header>

        {/* Latency Monitor */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Key Handler:</span>
              <span className={`text-xs font-mono font-bold ${latencyStats.keyHandler > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                {latencyStats.keyHandler.toFixed(2)}ms
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Audio Schedule:</span>
              <span className={`text-xs font-mono font-bold ${latencyStats.audioSchedule > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                {latencyStats.audioSchedule.toFixed(2)}ms
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Total JS Latency:</span>
              <span className={`text-xs font-mono font-bold ${latencyStats.total > 10 ? 'text-red-500' : latencyStats.total > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                {latencyStats.total.toFixed(2)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Instrument Selector */}
        <div className="space-y-2">
          <div className="flex justify-center items-center gap-3">
            <span className="text-sm text-muted-foreground">Audio System:</span>
            {isReady ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500 font-medium">
                Ready
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 font-medium">
                Initializing...
              </span>
            )}
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant={instrumentType === "roblox" ? "default" : "outline"}
              size="sm"
              onClick={() => setInstrumentType("roblox")}
            >
              Roblox (Low Latency)
            </Button>
            <Button
              variant={instrumentType === "synth" ? "default" : "outline"}
              size="sm"
              onClick={() => setInstrumentType("synth")}
            >
              Synth
            </Button>
            <Button
              variant={instrumentType === "organ" ? "default" : "outline"}
              size="sm"
              onClick={() => setInstrumentType("organ")}
            >
              Church Organ
            </Button>
            <Button
              variant={instrumentType === "guitar" ? "default" : "outline"}
              size="sm"
              onClick={() => setInstrumentType("guitar")}
            >
              Electric Guitar
            </Button>
          </div>
        </div>

        <DrumGrid sounds={drumSounds} onPlaySound={handlePlaySound} pressedKeyId={pressedKeyId} />

        {/* Metronome, Recording & Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Metronome
            isPlaying={metronome.isPlaying}
            currentBeat={metronome.currentBeat}
            beatsPerBar={4}
            bpm={metronomeBpm}
            onToggle={metronome.toggle}
            onBpmChange={setMetronomeBpm}
          />
          <div className="space-y-4">
            <RecordingDisplay 
              notes={recordedNotes}
              isRecording={metronome.isPlaying}
            />
            {recordedNotes.length > 0 && !editingLickId && (
              <div className="flex gap-2">
                <Input
                  placeholder="Lick name..."
                  value={lickName}
                  onChange={(e) => setLickName(e.target.value)}
                  disabled={licks.length >= 5}
                  className="flex-1"
                />
                <Button
                  onClick={handleClearRecording}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Trash className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSaveLick}
                  disabled={licks.length >= 5 || !lickName.trim()}
                  className="gap-2 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  Save Lick
                </Button>
              </div>
            )}
          </div>
          <ScoreDisplay 
            score={totalScore}
            recentRecognition={recentRecognition}
            onReset={resetScore}
            timingTolerance={timingTolerance}
            onToleranceChange={setTimingTolerance}
          />
        </div>

        {/* Battle Mode */}
        <div className="space-y-4">
          <BattleMode
            licks={licks}
            onPlayLick={playLick}
            onStartMetronome={metronome.start}
            onStopMetronome={metronome.stop}
            bpm={metronomeBpm}
            recordedNotes={recordedNotes}
            onClearRecording={handleClearRecording}
            recognizedPoints={totalScore}
            onResetRecognizedLicks={resetRecognizedLicks}
            onResetScore={resetScore}
            currentBeat={metronome.currentBeat}
            isMetronomePlaying={metronome.isPlaying}
            timingTolerance={timingTolerance}
            isRecording={metronome.isPlaying}
          />
        </div>

        {/* Lick Library */}
        <LickLibrary 
          licks={licks} 
          onDelete={handleDeleteLick}
          onDemonstrate={handleDemonstrateLick}
          onEdit={handleEditLick}
          onUpdateDifficulty={handleUpdateDifficulty}
          editingLickId={editingLickId}
        />

        {/* Lick Sequencer */}
        <LickSequencer
          availableLicks={licks}
          onPlaySequence={handlePlaySequence}
          isPlaying={isPlayingSequence}
        />

        {/* Lick Editor */}
        <LickEditor 
          notes={recordedNotes}
          onUpdateNote={handleUpdateNote}
          beatsPerBar={4}
          isEditing={!!editingLickId}
          onSave={editingLickId ? handleSaveLick : undefined}
          canSave={!!lickName.trim()}
        />

        {/* Background Music */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Background Music</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BackgroundMusicUpload 
              onUploadComplete={() => setMusicRefreshTrigger(prev => prev + 1)}
            />
            <BackgroundMusicPlayer refreshTrigger={musicRefreshTrigger} />
          </div>
        </div>

        {/* Audio Samples */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Audio Samples</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SampleRecorder 
              onSampleSaved={() => setSampleRefreshTrigger(prev => prev + 1)}
            />
            <SampleLibrary refreshTrigger={sampleRefreshTrigger} />
          </div>
        </div>

        {/* Sequencer Controls */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Pattern Sequencer</h3>
          <Controls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onClear={handleClear}
            tempo={tempo}
            onTempoChange={setTempo}
          />

          <Sequencer
            sounds={drumSounds}
            steps={steps}
            currentStep={currentStep}
            onToggleStep={handleToggleStep}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, useCallback } from "react";
import { DrumGrid } from "@/components/DrumGrid";
import { Controls } from "@/components/Controls";
import { Sequencer } from "@/components/Sequencer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardMapping } from "@/hooks/useKeyboardMapping";
import { DrumSound } from "@/types/audio";
import { toast } from "sonner";
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
  const { playSound } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<boolean[][]>(
    drumSounds.map(() => Array(16).fill(false))
  );

  const handlePlaySound = useCallback((soundId: string) => {
    const sound = drumSounds.find((s) => s.id === soundId);
    if (sound) {
      playSound(sound.type, sound.frequency);
    }
  }, [playSound]);

  // Enable keyboard mapping
  useKeyboardMapping({ 
    onKeyPress: handlePlaySound,
    enabled: true 
  });

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

        <Controls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onClear={handleClear}
          tempo={tempo}
          onTempoChange={setTempo}
        />

        <DrumGrid sounds={drumSounds} onPlaySound={handlePlaySound} />

        <Sequencer
          sounds={drumSounds}
          steps={steps}
          currentStep={currentStep}
          onToggleStep={handleToggleStep}
        />
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, useCallback } from "react";
import { DrumGrid } from "@/components/DrumGrid";
import { Controls } from "@/components/Controls";
import { Sequencer } from "@/components/Sequencer";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { DrumSound } from "@/types/audio";
import { toast } from "sonner";
import teamPhoto from "@/assets/team-photo.jpeg";

const drumSounds: DrumSound[] = [
  { id: "1", name: "Kick", type: "kick", frequency: 150, color: "bg-primary" },
  { id: "2", name: "Snare", type: "snare", frequency: 200, color: "bg-secondary" },
  { id: "3", name: "Hi-Hat", type: "hihat", frequency: 10000, color: "bg-accent" },
  { id: "4", name: "Clap", type: "clap", frequency: 1000, color: "bg-orange" },
  { id: "5", name: "Tom", type: "tom", frequency: 220, color: "bg-primary/80" },
  { id: "6", name: "Cymbal", type: "cymbal", frequency: 8000, color: "bg-secondary/80" },
  { id: "7", name: "Cowbell", type: "cowbell", frequency: 800, color: "bg-accent/80" },
  { id: "8", name: "Rim", type: "rim", frequency: 400, color: "bg-orange/80" },
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
      playSound(sound.type);
    }
  }, [playSound]);

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
            playSound(sound.type);
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
            Beat Maker
          </h1>
          <p className="text-muted-foreground text-lg">
            Crea ritmos increíbles tocando los pads o usando el secuenciador
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

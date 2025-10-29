import { DrumSound } from "@/types/audio";

interface SequencerProps {
  sounds: DrumSound[];
  steps: boolean[][];
  currentStep: number;
  onToggleStep: (soundIndex: number, stepIndex: number) => void;
}

export const Sequencer = ({ sounds, steps, currentStep, onToggleStep }: SequencerProps) => {
  const numSteps = 16;

  return (
    <div className="p-4 bg-card rounded-xl border border-border animate-slide-up">
      <h3 className="text-xl font-bold mb-4 text-center bg-gradient-primary bg-clip-text text-transparent">
        Sequencer
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {sounds.map((sound, soundIndex) => (
            <div key={sound.id} className="flex items-center gap-1 mb-2">
              <div className={`w-20 text-xs font-medium truncate ${sound.color} p-2 rounded`}>
                {sound.name}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: numSteps }).map((_, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => onToggleStep(soundIndex, stepIndex)}
                    className={`
                      w-8 h-8 rounded transition-all duration-150
                      ${steps[soundIndex]?.[stepIndex] ? sound.color : "bg-muted"}
                      ${currentStep === stepIndex ? "ring-2 ring-primary animate-glow" : ""}
                      hover:brightness-110
                    `}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

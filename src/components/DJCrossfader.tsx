import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface DJCrossfaderProps {
  value: number;
  onChange: (value: number) => void;
}

export const DJCrossfader = ({ value, onChange }: DJCrossfaderProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-background via-muted to-background border-primary/20">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center text-primary">CROSSFADER</h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className={value < 33 ? "text-primary font-bold" : ""}>DECK A</span>
          <span className={value > 33 && value < 67 ? "text-primary font-bold" : ""}>CENTER</span>
          <span className={value > 67 ? "text-primary font-bold" : ""}>DECK B</span>
        </div>

        <div className="relative">
          <Slider
            value={[value]}
            onValueChange={(vals) => onChange(vals[0])}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl text-primary font-mono">
            {value}
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-4">
          <div className="text-center">
            <div className="text-primary font-mono">{Math.round((100 - value))}%</div>
            <div>Deck A Vol</div>
          </div>
          <div className="text-center">
            <div className="text-primary font-mono">{Math.round(value)}%</div>
            <div>Deck B Vol</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

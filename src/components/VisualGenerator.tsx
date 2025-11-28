import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Maximize2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAudioAnalysis } from "@/hooks/useAudioAnalysis";

interface VisualGeneratorProps {
  analyser: AnalyserNode | null;
}

const PRESET_MOODS = [
  { name: "Cosmic Aurora", prompt: "cosmic aurora borealis with swirling nebula colors" },
  { name: "Neon City", prompt: "cyberpunk neon city at night with glowing buildings" },
  { name: "Underwater Dreams", prompt: "underwater scene with bioluminescent creatures" },
  { name: "Fire Storm", prompt: "abstract fire storm with flowing lava textures" },
  { name: "Electric Jungle", prompt: "electric jungle with neon plants and lightning" },
  { name: "Crystal Cave", prompt: "glowing crystal cave with prismatic light reflections" },
];

export const VisualGenerator = ({ analyser }: VisualGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([50]);
  const [enablePulse, setEnablePulse] = useState(true);
  const [enableKaleidoscope, setEnableKaleidoscope] = useState(false);
  const [enableRipple, setEnableRipple] = useState(false);
  const [enableGlow, setEnableGlow] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const audioData = useAudioAnalysis({ analyser, beatThreshold: 0.6, smoothing: 0.85 });

  // WebGL shader rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    if (!img || !img.complete) return;

    const render = () => {
      if (!ctx || !canvas || !img) return;

      const { bass, mids, highs, beat, volume } = audioData;
      const intensityFactor = intensity[0] / 100;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Center and scale image
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      ctx.save();

      // Pulse effect (bass-reactive scale)
      if (enablePulse) {
        const pulseScale = 1 + bass * 0.15 * intensityFactor;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Ripple effect on beat
      if (enableRipple && beat) {
        const rippleAmount = 10 * intensityFactor;
        ctx.translate(
          Math.sin(Date.now() / 100) * rippleAmount,
          Math.cos(Date.now() / 100) * rippleAmount
        );
      }

      // Draw image
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Color shift (mid-frequency reactive)
      const hueShift = mids * 60 * intensityFactor;
      ctx.globalCompositeOperation = "hue";
      ctx.fillStyle = `hsl(${hueShift}, 50%, 50%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      // Glow effect (volume-reactive)
      if (enableGlow) {
        const glowIntensity = volume * 40 * intensityFactor;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = `rgba(${255 * bass}, ${255 * mids}, ${255 * highs}, 0.8)`;
      }

      // Kaleidoscope effect
      if (enableKaleidoscope) {
        const segments = 6;
        const angleStep = (Math.PI * 2) / segments;
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.3 * intensityFactor;

        for (let i = 0; i < segments; i++) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(angleStep * i + highs * Math.PI * intensityFactor);
          ctx.scale(0.5, 0.5);
          ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();

      requestAnimationFrame(render);
    };

    render();
  }, [currentImage, audioData, intensity, enablePulse, enableKaleidoscope, enableRipple, enableGlow]);

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    
    if (!promptToUse.trim()) {
      toast.error("Please enter a prompt or select a preset");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-visual', {
        body: { prompt: promptToUse }
      });

      if (error) {
        throw error;
      }

      if (!data?.imageUrl) {
        throw new Error("No image returned from AI");
      }

      // Load image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        setCurrentImage(data.imageUrl);
        toast.success("Visual generated!");
      };
      img.onerror = () => {
        toast.error("Failed to load generated image");
      };
      img.src = data.imageUrl;

    } catch (error: any) {
      console.error("Error generating visual:", error);
      
      if (error.message?.includes("429")) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
      } else if (error.message?.includes("402")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate visual: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFullscreen = () => {
    if (canvasRef.current) {
      canvasRef.current.requestFullscreen().catch((err) => {
        toast.error("Failed to enter fullscreen: " + err.message);
      });
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your visual vibe... (e.g., 'cosmic galaxies with swirling colors')"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="flex-1"
          />
          <Button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Preset Moods</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESET_MOODS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(preset.prompt)}
                disabled={isGenerating}
                className="text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        {!currentImage && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {isGenerating ? "Generating your visual..." : "Generate or select a preset to begin"}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Music Reactivity</Label>
          <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
        </div>
        <Slider
          value={intensity}
          onValueChange={setIntensity}
          max={100}
          step={1}
          className="w-full"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pulse" className="text-sm">Pulse</Label>
            <Switch id="pulse" checked={enablePulse} onCheckedChange={setEnablePulse} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="glow" className="text-sm">Glow</Label>
            <Switch id="glow" checked={enableGlow} onCheckedChange={setEnableGlow} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ripple" className="text-sm">Ripple</Label>
            <Switch id="ripple" checked={enableRipple} onCheckedChange={setEnableRipple} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kaleidoscope" className="text-sm">Kaleidoscope</Label>
            <Switch id="kaleidoscope" checked={enableKaleidoscope} onCheckedChange={setEnableKaleidoscope} />
          </div>
        </div>

        <Button
          onClick={handleFullscreen}
          disabled={!currentImage}
          variant="outline"
          className="w-full gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Fullscreen Party Mode
        </Button>
      </div>
    </Card>
  );
};

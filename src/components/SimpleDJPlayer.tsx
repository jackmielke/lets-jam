import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack } from "lucide-react";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/integrations/supabase/client";
import musicLogo from "@/assets/musica.jpg";

interface MusicFile {
  name: string;
  path: string;
  url: string;
  title?: string;
}

interface SimpleDJPlayerProps {
  audioUrl?: string;
  trackName?: string;
  onTrackSelect?: (url: string, title: string) => void;
}

export const SimpleDJPlayer = ({ audioUrl: initialAudioUrl, trackName: initialTrackName, onTrackSelect }: SimpleDJPlayerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const lowEQRef = useRef<BiquadFilterNode | null>(null);
  const midEQRef = useRef<BiquadFilterNode | null>(null);
  const highEQRef = useRef<BiquadFilterNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const shouldAutoPlayRef = useRef<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [tempo, setTempo] = useState([100]);
  const [eqLow, setEqLow] = useState([50]);
  const [eqMid, setEqMid] = useState([50]);
  const [eqHigh, setEqHigh] = useState([50]);
  
  // Audio Effects State
  const [filterFreq, setFilterFreq] = useState([5000]);
  const [filterRes, setFilterRes] = useState([0]);
  const [compressorAmount, setCompressorAmount] = useState([0]);
  const [delayTime, setDelayTime] = useState([0]);
  const [delayFeedback, setDelayFeedback] = useState([30]);
  const [reverbAmount, setReverbAmount] = useState([0]);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedTrackUrl, setSelectedTrackUrl] = useState<string>(initialAudioUrl || "");
  const [selectedTrackName, setSelectedTrackName] = useState<string>(initialTrackName || "");

  // Load available music files
  useEffect(() => {
    loadMusicFiles();
  }, []);

  const loadMusicFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from("background-music").list();

      if (error) throw error;

      // Load metadata
      const { data: metadataData } = await supabase
        .from("background_music_metadata")
        .select("*");

      if (data) {
        const files: MusicFile[] = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from("background-music")
              .getPublicUrl(file.name);

            // Find metadata for this file
            const metadata = metadataData?.find((m) => m.file_name === file.name);

            return {
              name: file.name,
              path: file.name,
              url: urlData.publicUrl,
              title: metadata?.title || file.name,
            };
          })
        );
        setMusicFiles(files);
      }
    } catch (error) {
      console.error("Error loading music files:", error);
      toast.error("Failed to load music files");
    }
  };

  // Auto-select a random track when music files are loaded
  useEffect(() => {
    if (musicFiles.length > 0 && !selectedTrackUrl) {
      const randomIndex = Math.floor(Math.random() * musicFiles.length);
      const randomTrack = musicFiles[randomIndex];
      shouldAutoPlayRef.current = true;
      handleTrackSelect(randomTrack.url);
    }
  }, [musicFiles, selectedTrackUrl]);

  const handleTrackSelect = (url: string) => {
    const selectedFile = musicFiles.find(f => f.url === url);
    if (selectedFile) {
      setSelectedTrackUrl(url);
      setSelectedTrackName(selectedFile.title || selectedFile.name);
      setIsPlaying(false);
      if (onTrackSelect) {
        onTrackSelect(url, selectedFile.title || selectedFile.name);
      }
    }
  };

  const audioUrl = selectedTrackUrl || initialAudioUrl;
  const trackName = selectedTrackName || initialTrackName;

  // Initialize WaveSurfer with Web Audio API EQ
  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "hsl(var(--muted-foreground) / 0.3)",
      progressColor: "hsl(var(--primary))",
      cursorColor: "hsl(var(--primary))",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 120,
      barGap: 2,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    // Set up Web Audio API EQ filters when audio is ready
    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      
      // Auto-play if this was the initial random selection
      if (shouldAutoPlayRef.current) {
        shouldAutoPlayRef.current = false;
        wavesurfer.play();
      }
      
      try {
        // Access the Web Audio backend
        const backend = (wavesurfer as any).backend;
        if (!backend || !backend.ac) return;

        const ctx = backend.ac as AudioContext;
        
        // Create three-band EQ
        const lowShelf = ctx.createBiquadFilter();
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 200;
        lowShelf.gain.value = 0;

        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 1;
        mid.gain.value = 0;

        const highShelf = ctx.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = 3000;
        highShelf.gain.value = 0;

        // Create filter for resonance effects
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 5000;
        filter.Q.value = 0;

        // Create compressor
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 1;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        // Create reverb (using convolver with impulse response)
        const convolver = ctx.createConvolver();
        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0;

        // Create delay effect
        const delay = ctx.createDelay();
        delay.delayTime.value = 0;
        const delayGain = ctx.createGain();
        delayGain.gain.value = 0;
        const delayFeedbackGain = ctx.createGain();
        delayFeedbackGain.gain.value = 0.3;

        // Generate simple reverb impulse response
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 2; // 2 seconds
        const impulse = ctx.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
          const decay = Math.pow(1 - i / length, 2);
          impulseL[i] = (Math.random() * 2 - 1) * decay;
          impulseR[i] = (Math.random() * 2 - 1) * decay;
        }
        convolver.buffer = impulse;

        // Store references
        lowEQRef.current = lowShelf;
        midEQRef.current = mid;
        highEQRef.current = highShelf;
        filterRef.current = filter;
        compressorRef.current = compressor;
        convolverRef.current = convolver;
        reverbGainRef.current = reverbGain;
        delayRef.current = delay;
        delayGainRef.current = delayGain;

        // Connect the audio chain:
        // source -> lowEQ -> midEQ -> highEQ -> filter -> compressor -> destination
        //                                                  -> delay -> delayGain -> filter (feedback)
        //                                                  -> convolver -> reverbGain -> destination
        if (backend.analyser) {
          backend.analyser.disconnect();
          
          // Main chain
          backend.analyser.connect(lowShelf);
          lowShelf.connect(mid);
          mid.connect(highShelf);
          highShelf.connect(filter);
          filter.connect(compressor);
          
          // Delay chain (parallel)
          compressor.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(delay); // feedback
          delayGain.connect(compressor);
          
          // Reverb chain (parallel)
          compressor.connect(convolver);
          convolver.connect(reverbGain);
          reverbGain.connect(ctx.destination);
          
          // Main output
          compressor.connect(backend.gainNode || ctx.destination);
        }
      } catch (error) {
        console.error('Error setting up audio effects:', error);
      }
    });

    wavesurfer.on("audioprocess", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // Load audio URL
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  // Update volume
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume[0] / 100);
    }
  }, [volume]);

  // Update playback rate (tempo)
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(tempo[0] / 100);
    }
  }, [tempo]);

  // Update EQ Low
  useEffect(() => {
    if (lowEQRef.current) {
      // Convert 0-100 to -12dB to +12dB
      const gain = ((eqLow[0] - 50) / 50) * 12;
      lowEQRef.current.gain.value = gain;
    }
  }, [eqLow]);

  // Update EQ Mid
  useEffect(() => {
    if (midEQRef.current) {
      const gain = ((eqMid[0] - 50) / 50) * 12;
      midEQRef.current.gain.value = gain;
    }
  }, [eqMid]);

  // Update EQ High
  useEffect(() => {
    if (highEQRef.current) {
      const gain = ((eqHigh[0] - 50) / 50) * 12;
      highEQRef.current.gain.value = gain;
    }
  }, [eqHigh]);

  // Update Filter Frequency
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = filterFreq[0];
    }
  }, [filterFreq]);

  // Update Filter Resonance
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.Q.value = filterRes[0];
    }
  }, [filterRes]);

  // Update Compressor
  useEffect(() => {
    if (compressorRef.current) {
      const ratio = 1 + (compressorAmount[0] / 100) * 19; // 1 to 20
      compressorRef.current.ratio.value = ratio;
    }
  }, [compressorAmount]);

  // Update Delay Time
  useEffect(() => {
    if (delayRef.current && delayGainRef.current) {
      delayRef.current.delayTime.value = delayTime[0];
      // Adjust delay gain based on delay time
      delayGainRef.current.gain.value = delayTime[0] > 0 ? 0.5 : 0;
    }
  }, [delayTime]);

  // Update Delay Feedback
  useEffect(() => {
    if (delayGainRef.current && delayTime[0] > 0) {
      const feedback = delayFeedback[0] / 100;
      delayGainRef.current.gain.value = feedback * 0.7; // Max 0.7 to prevent runaway feedback
    }
  }, [delayFeedback, delayTime]);

  // Update Reverb Amount
  useEffect(() => {
    if (reverbGainRef.current) {
      reverbGainRef.current.gain.value = reverbAmount[0] / 100;
    }
  }, [reverbAmount]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (!audioUrl) {
      toast.error("Please select a track first");
      return;
    }

    wavesurferRef.current.playPause();
  };

  const handleRestart = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.seekTo(0);
    toast.success("Track restarted");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Decorative Background Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5 blur-sm pointer-events-none">
        <img src={musicLogo} alt="" className="w-full h-full object-contain" />
      </div>
      {/* Track Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Select Track</Label>
        <Select value={selectedTrackUrl} onValueChange={handleTrackSelect}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Choose a track to play..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {musicFiles.map((file) => (
              <SelectItem key={file.url} value={file.url}>
                {file.title || file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track Info */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary mb-1">
          {trackName || "No Track Selected"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentTime > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "Select a track to begin"}
        </p>
      </div>

      {/* Waveform Visualization */}
      <div className="rounded-lg overflow-hidden bg-muted/20 p-4 border border-primary/20">
        <div ref={waveformRef} />
      </div>

      {/* Transport Controls */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          disabled={!audioUrl}
          className="h-12 w-12"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          onClick={handlePlayPause}
          disabled={!audioUrl}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:brightness-110 shadow-lg"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Master Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Master Controls
          </h4>
          
          {/* Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Volume</Label>
              <span className="text-xs font-mono text-primary">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Tempo</Label>
              <span className="text-xs font-mono text-primary">{tempo[0]}%</span>
            </div>
            <Slider
              value={tempo}
              onValueChange={setTempo}
              min={25}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* EQ Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Equalizer
          </h4>
          
          {/* Low EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Low</Label>
              <span className="text-xs font-mono text-primary">{eqLow[0]}%</span>
            </div>
            <Slider
              value={eqLow}
              onValueChange={setEqLow}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Mid EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Mid</Label>
              <span className="text-xs font-mono text-primary">{eqMid[0]}%</span>
            </div>
            <Slider
              value={eqMid}
              onValueChange={setEqMid}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* High EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">High</Label>
              <span className="text-xs font-mono text-primary">{eqHigh[0]}%</span>
            </div>
            <Slider
              value={eqHigh}
              onValueChange={setEqHigh}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Audio Effects Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
        {/* Filter & Compression */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Filter & Dynamics
          </h4>
          
          {/* Filter Frequency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Filter Cutoff</Label>
              <span className="text-xs font-mono text-secondary">{filterFreq[0]}Hz</span>
            </div>
            <Slider
              value={filterFreq}
              onValueChange={setFilterFreq}
              min={200}
              max={20000}
              step={100}
              className="w-full"
            />
          </div>

          {/* Filter Resonance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Resonance</Label>
              <span className="text-xs font-mono text-secondary">{filterRes[0].toFixed(1)}</span>
            </div>
            <Slider
              value={filterRes}
              onValueChange={setFilterRes}
              min={0}
              max={20}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Compressor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Compressor</Label>
              <span className="text-xs font-mono text-secondary">{compressorAmount[0]}%</span>
            </div>
            <Slider
              value={compressorAmount}
              onValueChange={setCompressorAmount}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Time-Based Effects */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-accent uppercase tracking-wide">
            Time Effects
          </h4>
          
          {/* Delay Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Delay Time</Label>
              <span className="text-xs font-mono text-accent">{(delayTime[0] * 1000).toFixed(0)}ms</span>
            </div>
            <Slider
              value={delayTime}
              onValueChange={setDelayTime}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Delay Feedback */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Delay Feedback</Label>
              <span className="text-xs font-mono text-accent">{delayFeedback[0]}%</span>
            </div>
            <Slider
              value={delayFeedback}
              onValueChange={setDelayFeedback}
              max={100}
              step={1}
              className="w-full"
              disabled={delayTime[0] === 0}
            />
          </div>

          {/* Reverb */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Reverb</Label>
              <span className="text-xs font-mono text-accent">{reverbAmount[0]}%</span>
            </div>
            <Slider
              value={reverbAmount}
              onValueChange={setReverbAmount}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

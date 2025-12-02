import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Music2, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface SpotifyPlaybackState {
  isPlaying: boolean;
  item?: {
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string; height: number }[];
    };
    duration_ms: number;
  };
  progress_ms?: number;
}

export const SpotifyNowPlaying = () => {
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('spotify_access_token');
    setAccessToken(storedAccessToken);
  }, []);

  const fetchCurrentlyPlaying = async () => {
    if (!accessToken) return;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-playlists', {
        body: { action: 'getCurrentlyPlaying', accessToken },
      });

      if (error) throw error;

      setPlaybackState(data);
    } catch (error) {
      console.error('Failed to fetch currently playing:', error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    // Initial fetch
    fetchCurrentlyPlaying();

    // Poll every 5 seconds
    const interval = setInterval(fetchCurrentlyPlaying, 5000);

    return () => clearInterval(interval);
  }, [accessToken]);

  if (!accessToken) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Music2 className="w-8 h-8 opacity-50" />
          <p className="text-sm">Connect Spotify to see what's playing</p>
        </div>
      </Card>
    );
  }

  if (!playbackState?.isPlaying || !playbackState?.item) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Music2 className="w-8 h-8 opacity-50" />
          <p className="text-sm">Nothing playing on Spotify</p>
        </div>
      </Card>
    );
  }

  const { item, progress_ms = 0 } = playbackState;
  const progressPercent = (progress_ms / item.duration_ms) * 100;
  const albumArt = item.album.images.find(img => img.height >= 300)?.url || item.album.images[0]?.url;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Music2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Now Playing on Spotify</h3>
      </div>

      <div className="flex gap-4">
        {albumArt && (
          <div className="shrink-0">
            <img
              src={albumArt}
              alt={item.album.name}
              className="w-24 h-24 rounded-lg object-cover shadow-lg"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-semibold text-lg truncate">{item.name}</h4>
            <p className="text-sm text-muted-foreground truncate">
              {item.artists.map(a => a.name).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.album.name}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {playbackState.isPlaying ? (
                <Play className="w-4 h-4 text-primary" fill="currentColor" />
              ) : (
                <Pause className="w-4 h-4 text-muted-foreground" />
              )}
              <Progress value={progressPercent} className="flex-1" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(progress_ms)}</span>
              <span>{formatTime(item.duration_ms)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

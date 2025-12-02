import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, ChevronDown, ChevronUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: { total: number };
  images: { url: string }[];
}

interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    preview_url: string | null;
    duration_ms: number;
  };
}

export const SpotifyImporter = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, SpotifyTrack[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for OAuth callback code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      exchangeCodeForToken(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load tokens from localStorage
    const storedAccessToken = localStorage.getItem('spotify_access_token');
    const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    }
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'exchangeCode', code },
      });

      if (error) throw error;

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
      toast.success('Connected to Spotify!');
    } catch (error) {
      console.error('Token exchange error:', error);
      toast.error('Failed to connect to Spotify');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'getAuthUrl' },
      });

      if (error) throw error;

      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Auth URL error:', error);
      toast.error('Failed to initiate Spotify connection');
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('spotify-playlists', {
        body: { action: 'getPlaylists', accessToken },
      });

      if (error) throw error;

      setPlaylists(data.items);
      toast.success(`Loaded ${data.items.length} playlists`);
    } catch (error) {
      console.error('Load playlists error:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlistId: string) => {
    if (playlistTracks[playlistId]) {
      setExpandedPlaylist(expandedPlaylist === playlistId ? null : playlistId);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('spotify-playlists', {
        body: { action: 'getPlaylistTracks', accessToken, playlistId },
      });

      if (error) throw error;

      setPlaylistTracks(prev => ({ ...prev, [playlistId]: data.items }));
      setExpandedPlaylist(playlistId);
    } catch (error) {
      console.error('Load tracks error:', error);
      toast.error('Failed to load playlist tracks');
    } finally {
      setLoading(false);
    }
  };

  const importTrack = async (track: SpotifyTrack['track']) => {
    if (!track.preview_url) {
      toast.error('This track has no preview available');
      return;
    }

    try {
      setLoading(true);
      
      // Download the preview audio
      const audioResponse = await fetch(track.preview_url);
      const audioBlob = await audioResponse.blob();
      const fileName = `${Date.now()}_${track.name}.mp3`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('background-music')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Create metadata entry
      const { error: metadataError } = await supabase
        .from('background_music_metadata')
        .insert({
          file_name: fileName,
          title: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`,
          original_bpm: 120,
          cue_point_seconds: 0,
          duration_seconds: track.duration_ms / 1000,
        });

      if (metadataError) throw metadataError;

      toast.success(`Imported: ${track.name}`);
    } catch (error) {
      console.error('Import track error:', error);
      toast.error('Failed to import track');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setPlaylists([]);
    setPlaylistTracks({});
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    toast.success('Disconnected from Spotify');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Spotify Importer</h3>
        </div>
        {accessToken && (
          <Button variant="outline" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        )}
      </div>

      {!accessToken ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Connect your Spotify account to import playlists as backing tracks
          </p>
          <Button onClick={handleConnect} disabled={loading}>
            Connect Spotify
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={loadPlaylists} disabled={loading}>
            {playlists.length > 0 ? 'Refresh Playlists' : 'Load Playlists'}
          </Button>

          {playlists.length > 0 && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => loadPlaylistTracks(playlist.id)}
                    disabled={loading}
                    className="w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors"
                  >
                    {playlist.images[0] && (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium">{playlist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {playlist.tracks.total} tracks
                      </p>
                    </div>
                    {expandedPlaylist === playlist.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {expandedPlaylist === playlist.id && playlistTracks[playlist.id] && (
                    <div className="border-t bg-muted/50">
                      {playlistTracks[playlist.id].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.track.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.track.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => importTrack(item.track)}
                            disabled={!item.track.preview_url || loading}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

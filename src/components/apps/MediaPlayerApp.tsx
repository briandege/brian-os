"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Music, ListMusic, Link, Trash2,
} from "lucide-react";

const ACCENT = "#C8A97E";

interface Track {
  id: string;
  name: string;
  url: string;
  duration: number;
}

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MediaPlayerApp() {
  const hasElectron = typeof window !== "undefined" && !!window.electronAPI?.openFileDialog;

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animRef = useRef<number>(0);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [urlInput, setUrlInput] = useState("");

  const current = currentIdx >= 0 ? tracks[currentIdx] : null;

  const playTrack = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setPlaying(true);
  }, []);

  // Load and play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.url;
    audio.volume = muted ? 0 : volume;
    if (playing) audio.play().catch(() => {});
  }, [current?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => {});
    else audio.pause();
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnd = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
    };
  }, [repeatMode, tracks.length, currentIdx, shuffle]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle) {
      const next = Math.floor(Math.random() * tracks.length);
      playTrack(next);
    } else {
      const next = (currentIdx + 1) % tracks.length;
      if (next === 0 && repeatMode === "none") {
        setPlaying(false);
      } else {
        playTrack(next);
      }
    }
  }, [tracks.length, currentIdx, shuffle, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prev = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(prev);
  }, [tracks.length, currentIdx, playTrack]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  // Visualizer
  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audio);
      }
      sourceRef.current.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    } catch {
      // Web Audio not available
      return;
    }

    const draw = () => {
      const analyser = analyserRef.current;
      if (!analyser || !canvas) return;
      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / data.length;
      data.forEach((val, i) => {
        const h = (val / 255) * canvas.height * 0.8;
        canvasCtx.fillStyle = `rgba(200,169,126,${0.3 + (val / 255) * 0.5})`;
        canvasCtx.fillRect(i * barW, canvas.height - h, barW - 1, h);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []); // Mount once

  const openFiles = async () => {
    if (hasElectron) {
      const paths = await window.electronAPI!.openFileDialog(["mp3", "mp4", "wav", "ogg", "m4a", "flac"]);
      if (paths && paths.length > 0) {
        const newTracks = paths.map((p) => ({
          id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: p.split("/").pop() || p,
          url: `file://${p}`,
          duration: 0,
        }));
        setTracks((t) => [...t, ...newTracks]);
        if (currentIdx < 0) playTrack(tracks.length);
      }
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    const track: Track = {
      id: `track-${Date.now()}`,
      name: url.split("/").pop()?.split("?")[0] || "Stream",
      url,
      duration: 0,
    };
    setTracks((t) => [...t, track]);
    setUrlInput("");
    if (currentIdx < 0) playTrack(tracks.length);
  };

  const removeTrack = (idx: number) => {
    setTracks((t) => t.filter((_, i) => i !== idx));
    if (idx === currentIdx) {
      setPlaying(false);
      setCurrentIdx(-1);
    } else if (idx < currentIdx) {
      setCurrentIdx((c) => c - 1);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* Visualizer */}
      <div className="relative h-[80px] shrink-0" style={{ background: "rgba(200,169,126,0.03)" }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={400} height={80} />
        {!current && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music size={24} style={{ color: "rgba(255,255,255,0.08)" }} />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="px-4 py-2 shrink-0">
        <div className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
          {current?.name || "No track loaded"}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 shrink-0">
        <div
          className="h-1 rounded-full cursor-pointer"
          style={{ background: "rgba(255,255,255,0.06)" }}
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              background: ACCENT,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            {formatTime(currentTime)}
          </span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3 shrink-0">
        <button onClick={() => setShuffle((s) => !s)} className="p-1.5" style={{ color: shuffle ? ACCENT : "rgba(255,255,255,0.25)" }}>
          <Shuffle size={13} />
        </button>
        <button onClick={prevTrack} className="p-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(200,169,126,0.15)", color: ACCENT }}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button onClick={nextTrack} className="p-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => setRepeatMode((m) => m === "none" ? "all" : m === "all" ? "one" : "none")}
          className="relative p-1.5"
          style={{ color: repeatMode !== "none" ? ACCENT : "rgba(255,255,255,0.25)" }}
        >
          <Repeat size={13} />
          {repeatMode === "one" && (
            <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold" style={{ color: ACCENT }}>1</span>
          )}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-4 pb-2 shrink-0">
        <button onClick={() => setMuted((m) => !m)} className="p-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          {muted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
          className="flex-1 h-1 appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, ${ACCENT} ${volume * 100}%, rgba(255,255,255,0.08) ${volume * 100}%)` }}
        />
      </div>

      {/* Playlist / URL input */}
      <div className="flex-1 flex flex-col border-t min-h-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-3 py-2 shrink-0">
          <button
            onClick={() => setShowPlaylist((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-mono"
            style={{ color: "rgba(200,169,126,0.5)" }}
          >
            <ListMusic size={12} />
            Playlist ({tracks.length})
          </button>
          <div className="flex items-center gap-1.5">
            {hasElectron && (
              <button
                onClick={openFiles}
                className="text-[10px] font-mono px-2 py-1 rounded"
                style={{ background: "rgba(200,169,126,0.1)", color: ACCENT }}
              >
                + Files
              </button>
            )}
          </div>
        </div>

        {!hasElectron && (
          <div className="flex items-center gap-1.5 px-3 pb-2 shrink-0">
            <Link size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="Paste audio/video URL..."
              className="flex-1 bg-transparent text-[10px] outline-none px-2 py-1 rounded border"
              style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.08)" }}
            />
            <button onClick={addUrl} className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(200,169,126,0.1)", color: ACCENT }}>
              Add
            </button>
          </div>
        )}

        {showPlaylist && (
          <div className="flex-1 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                  {hasElectron ? "Click + Files to add tracks" : "Add a URL to start playing"}
                </span>
              </div>
            ) : (
              tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(i)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group"
                  style={{
                    background: i === currentIdx ? "rgba(200,169,126,0.08)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (i !== currentIdx) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i === currentIdx ? "rgba(200,169,126,0.08)" : "transparent"; }}
                >
                  {i === currentIdx && playing ? (
                    <div className="w-3 flex items-end gap-px h-3">
                      <div className="w-0.5 bg-current animate-pulse" style={{ height: "60%", color: ACCENT }} />
                      <div className="w-0.5 bg-current animate-pulse" style={{ height: "100%", color: ACCENT, animationDelay: "0.15s" }} />
                      <div className="w-0.5 bg-current animate-pulse" style={{ height: "40%", color: ACCENT, animationDelay: "0.3s" }} />
                    </div>
                  ) : (
                    <Music size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                  )}
                  <span
                    className="flex-1 text-[11px] truncate"
                    style={{ color: i === currentIdx ? ACCENT : "rgba(255,255,255,0.5)" }}
                  >
                    {track.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTrack(i); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5"
                    style={{ color: "rgba(255,85,87,0.5)" }}
                  >
                    <Trash2 size={10} />
                  </button>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

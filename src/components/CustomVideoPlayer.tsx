import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Player from "@vimeo/player";

interface CustomVideoPlayerProps {
  isPlaying: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onProgress?: (percent: number) => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  isPlaying: parentIsPlaying,
  onPlayStateChange,
  onEnded,
  onPlay,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);

  // Keep track of which progress thresholds have already been reported in this session
  const sentThresholds = useRef<Set<number>>(new Set());

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240); // default fallback to 4 mins (240s)
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasUnmuteNotice, setHasUnmuteNotice] = useState(true);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset controls visibility timer
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  // Safe wrapper for player method calls
  const safePlayerCall = <T,>(action: (player: Player) => Promise<T>): Promise<T | null> => {
    if (!playerRef.current || !iframeRef.current || !document.body.contains(iframeRef.current)) {
      return Promise.resolve(null);
    }
    return action(playerRef.current).catch((err) => {
      console.warn("Safe Vimeo player call caught error (expected during transitions/unmount):", err);
      return null;
    });
  };

  // React to parent's isPlaying state changes (enabling immediate start after background preloading)
  useEffect(() => {
    if (!playerRef.current) return;

    if (parentIsPlaying) {
      // User clicked play! Attempt unmuted high-fidelity playback directly because it is a user gesture
      safePlayerCall((p) => p.setMuted(false))
        .then(() => safePlayerCall((p) => p.setVolume(1)))
        .then(() => {
          setVolume(1);
          setIsMuted(false);
          setHasUnmuteNotice(false);
          return safePlayerCall((p) => p.play());
        })
        .then((res) => {
          if (res !== null) {
            setIsPlaying(true);
            setIsBuffering(false);
          }
        })
        .catch((err) => {
          console.warn("Direct unmuted playback failed or was blocked, falling back to muted play:", err);
          // Fallback to safe muted autoplay
          safePlayerCall((p) => p.setMuted(true))
            .then(() => safePlayerCall((p) => p.play()))
            .then((res) => {
              if (res !== null) {
                setIsPlaying(true);
                setIsMuted(true);
                setHasUnmuteNotice(true);
              }
            });
        });
    } else {
      // If the parent says to pause or stop
      safePlayerCall((p) => p.pause()).then(() => {
        setIsPlaying(false);
      });
    }
  }, [parentIsPlaying]);

  // Initialize Vimeo Player
  useEffect(() => {
    if (!iframeRef.current) return;

    // Prevent double-initialization on same iframe
    if (playerRef.current) return;

    setIsBuffering(true);

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    // SDK Event Listeners
    player.on("play", () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
      onPlay?.();
      resetControlsTimeout();
    });

    player.on("pause", () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      setControlsVisible(true);
    });

    player.on("ended", () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      onEnded?.();
    });

    player.on("timeupdate", (data) => {
      setCurrentTime(data.seconds);
      const activeDuration = data.duration || duration || 1;
      if (data.duration) {
        setDuration(data.duration);
      }

      // Track watch percentage thresholds
      const percentage = Math.round((data.seconds / activeDuration) * 100);
      const thresholds = [10, 25, 50, 75, 90, 100];
      thresholds.forEach((t) => {
        if (percentage >= t && !sentThresholds.current.has(t)) {
          sentThresholds.current.add(t);
          onProgress?.(t);
        }
      });
    });

    player.on("loaded", () => {
      setIsBuffering(false);
      player.getDuration().then((d) => {
        if (d) setDuration(d);
      }).catch((e) => {
        console.warn("Error getting duration:", e);
      });
    });

    player.on("bufferstart", () => {
      setIsBuffering(true);
    });

    player.on("bufferend", () => {
      setIsBuffering(false);
    });

    player.on("error", (err) => {
      console.error("Vimeo Player Event Error:", err);
      // Suppress full-screen error overlays for harmless warnings
      if (err && err.name !== "UnknownError") {
        setHasError(true);
      }
      setIsBuffering(false);
    });

    return () => {
      const activePlayer = playerRef.current;
      playerRef.current = null;

      if (activePlayer) {
        try {
          activePlayer.off("play");
          activePlayer.off("pause");
          activePlayer.off("ended");
          activePlayer.off("timeupdate");
          activePlayer.off("loaded");
          activePlayer.off("bufferstart");
          activePlayer.off("bufferend");
          activePlayer.off("error");
        } catch (e) {
          console.warn("Error cleaning up Vimeo event listeners:", e);
        }
      }
    };
  }, []);

  // Toggle play/pause
  const togglePlay = () => {
    safePlayerCall((p) => p.getPaused()).then((paused) => {
      if (paused === null) return;
      if (paused) {
        safePlayerCall((p) => p.play()).then((res) => {
          if (res === null) return;
          setIsPlaying(true);
          onPlayStateChange?.(true);
          resetControlsTimeout();
        });
      } else {
        safePlayerCall((p) => p.pause()).then((res) => {
          if (res === null) return;
          setIsPlaying(false);
          onPlayStateChange?.(false);
          setControlsVisible(true);
        });
      }
    });
  };

  // Handle container clicks/taps
  const handleContainerClick = () => {
    if (isPlaying) {
      if (controlsVisible) {
        togglePlay();
      } else {
        resetControlsTimeout();
      }
    } else {
      togglePlay();
    }
  };

  // Format time (e.g. 124 -> 02:04)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Seek video
  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    safePlayerCall((p) => p.setCurrentTime(newTime)).then((res) => {
      if (res === null) return;
      setCurrentTime(newTime);
      resetControlsTimeout();
    });
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    safePlayerCall((p) => p.setVolume(newVolume)).then((res) => {
      if (res === null) return;
      setVolume(newVolume);
      const isNewVolumeMuted = newVolume === 0;
      setIsMuted(isNewVolumeMuted);
      safePlayerCall((p) => p.setMuted(isNewVolumeMuted));
      if (newVolume > 0) {
        setHasUnmuteNotice(false);
      }
      resetControlsTimeout();
    });
  };

  // Toggle Mute
  const toggleMute = () => {
    const targetMute = !isMuted;
    safePlayerCall((p) => p.setMuted(targetMute)).then((res) => {
      if (res === null) return;
      setIsMuted(targetMute);
      if (!targetMute) {
        setHasUnmuteNotice(false);
        safePlayerCall((p) => p.setVolume(1));
        setVolume(1);
      }
      resetControlsTimeout();
    });
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen:", err?.message || err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track fullscreen state change (e.g., via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sync isPlaying state changes on trigger
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // If error, show a beautiful elite styled repair button screen
  if (hasError) {
    return (
      <div className="w-full h-full relative bg-zinc-950 flex flex-col items-center justify-center p-6 text-center border border-white/5 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-[#D4AF37]/20">
          <Info className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 font-display">
          Lecture Indisponible
        </h4>
        <p className="text-[10px] sm:text-xs text-gray-400 max-w-[240px] leading-relaxed mb-5">
          Impossible de charger le flux vidéo Vimeo. Veuillez rafraîchir la page ou réessayer.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            if (playerRef.current) {
              playerRef.current.unload().then(() => {
                playerRef.current?.loadVideo(1207432080);
              });
            } else {
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#F27D26] text-black font-bold text-[10px] uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(242,125,38,0.25)] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Réessayer la lecture</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="custom_video_container"
      className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-[26px]"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Pre-rendered stable iframe to eliminate unmount/remount lag & errors */}
      <iframe
        ref={iframeRef}
        id="vimeo-player-iframe"
        src="https://player.vimeo.com/video/1207432080?badge=0&autopause=0&player_id=0&app_id=58479&api=1&controls=0&autoplay=0&muted=1&playsinline=1"
        className="absolute inset-0 w-full h-full border-none pointer-events-none object-cover"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        title="MZ+ Elite Presentation"
      />

      {/* Transparent Clickable Overlay to capture play/pause & trigger unmute */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={() => {
          if (hasUnmuteNotice) {
            toggleMute();
          } else {
            handleContainerClick();
          }
        }}
      />

      {/* Elegant floating Unmute Banner when muted autoplay is active */}
      <AnimatePresence>
        {hasUnmuteNotice && (
          <motion.button
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-[#D4AF37] to-[#F27D26] text-black px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
            <span>🔊 ACTIVER LE SON</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Buffering spinner overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none"
          >
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central Play Big Button Overlay (Shows ONLY when paused/not started) */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 pointer-events-none"
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-16 h-16 rounded-full border border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-300 group"
            >
              <Play className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37] ml-1 group-hover:text-amber-400 transition-colors" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar Overlay */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 z-25 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-5 px-4 flex flex-col gap-3 pointer-events-auto"
          >
            {/* Elegant Scrubbable Progress Bar */}
            <div className="flex items-center gap-3 w-full group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressBarChange}
                className="w-full h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] hover:h-1.5 transition-all duration-150 outline-none"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) 100%)`,
                }}
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between">
              {/* Play / Time info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1 rounded-md cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                <div className="text-[10px] sm:text-xs font-mono text-gray-300 tracking-wider">
                  {formatTime(currentTime)} <span className="text-gray-500">/</span> {formatTime(duration)}
                </div>
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Active source label in subtle typography */}
                <span className="hidden sm:inline text-[9px] text-gray-500 font-mono tracking-wider">
                  Vimeo Stream (HD)
                </span>

                {/* Volume selector */}
                <div className="flex items-center gap-1.5 group/volume">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-[#D4AF37] transition-colors p-1 cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/volume:w-16 accent-[#D4AF37] bg-white/20 h-1 rounded-lg appearance-none cursor-pointer transition-all duration-300 ease-in-out"
                  />
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1 cursor-pointer"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

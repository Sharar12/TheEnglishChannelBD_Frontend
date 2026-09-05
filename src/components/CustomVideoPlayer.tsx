'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function CustomVideoPlayer({ src, autoPlay = false, onEnded, onTimeUpdate }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const hideControls = useCallback(() => {
    if (isPlaying && !showSettings) {
      setShowControls(false);
    }
  }, [isPlaying, showSettings]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(hideControls, 3000);
  }, [hideControls]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setVideoEnded(false);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;
    setCurrentTime(video.currentTime);
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
    onTimeUpdate?.(video.currentTime, video.duration);
  }, [isDragging, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);
  }, []);

  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handleCanPlay = useCallback(() => setIsLoading(false), []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e);
  }, [handleSeek]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const bar = progressRef.current;
      const video = videoRef.current;
      if (!bar || !video) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setCurrentTime(pos * duration);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const bar = progressRef.current;
      const video = videoRef.current;
      if (!bar || !video) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = pos * duration;
      setCurrentTime(pos * duration);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = volumeBarRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const vol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.volume = vol;
    video.muted = vol === 0;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    handleVolumeChange(e);
  }, [handleVolumeChange]);

  useEffect(() => {
    if (!isDraggingVolume) return;

    const handleMouseMove = (e: MouseEvent) => {
      const bar = volumeBarRef.current;
      const video = videoRef.current;
      if (!bar || !video) return;
      const rect = bar.getBoundingClientRect();
      const vol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.volume = vol;
      video.muted = vol === 0;
      setVolume(vol);
      setIsMuted(vol === 0);
    };

    const handleMouseUp = () => setIsDraggingVolume(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMuted]);

  const changeVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVol;
    video.muted = newVol === 0;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  }, [duration]);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setIsPlaying(true);
    setVideoEnded(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    container.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => container.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoPlay) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [autoPlay, src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
      showControlsTemporarily();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, changeVolume, toggleMute, toggleFullscreen, showControlsTemporarily]);

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group select-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={hideControls}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.video-controls') || (e.target as HTMLElement).closest('.settings-menu')) return;
        togglePlay();
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('.video-controls') || (e.target as HTMLElement).closest('.settings-menu')) return;
        toggleFullscreen();
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        tabIndex={-1}
        onFocus={(e) => e.target.blur()}
        onKeyDown={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={() => {
          console.error('Video source error:', src);
          setVideoError(true);
          setIsLoading(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setVideoEnded(true);
          onEnded?.();
        }}
        onClick={(e) => e.stopPropagation()}
        playsInline
      />


       {/* Loading Spinner */}
       {isLoading && !videoEnded && !videoError && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-14 h-14 border-4 border-white/30 border-t-orange-500 rounded-full animate-spin" />
         </div>
       )}

       {/* Video Error Overlay */}
       {videoError && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20 p-6 text-center">
           <div className="max-w-md space-y-4">
             <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <RotateCcw className="w-8 h-8 text-red-500" />
             </div>
             <h3 className="text-xl font-bold text-white">Unable to load video</h3>
             <p className="text-gray-400 text-sm">
               The video source could not be loaded. This might be due to an unsupported format or a network issue.
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
             >
               Reload Page
             </button>
           </div>
         </div>
       )}
       
       {/* Big Play Button (when paused/ended) */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            {videoEnded ? (
              <RotateCcw className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-3 px-3 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative w-full h-1.5 hover:h-2.5 cursor-pointer group/progress mb-3 transition-all"
          onMouseDown={handleMouseDown}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg -ml-2"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Skip Back 10s */}
            <button
              onClick={(e) => { e.stopPropagation(); skip(-10); }}
              className="p-1.5 text-white hover:text-orange-400 transition-colors"
              title="Back 10s (J)"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-1.5 text-white hover:text-orange-400 transition-colors"
              title="Play/Pause (K)"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={(e) => { e.stopPropagation(); skip(10); }}
              className="p-1.5 text-white hover:text-orange-400 transition-colors"
              title="Forward 10s (L)"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => !isDraggingVolume && setShowVolumeSlider(false)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="p-1.5 text-white hover:text-orange-400 transition-colors"
                title="Mute (M)"
              >
                <VolumeIcon />
              </button>
              <div
                className={`flex items-center transition-all duration-200 overflow-hidden ${
                  showVolumeSlider ? 'w-20 opacity-100 ml-1' : 'w-0 opacity-0'
                }`}
              >
                <div
                  ref={volumeBarRef}
                  className="relative w-full h-1.5 cursor-pointer group/vol"
                  onMouseDown={handleVolumeMouseDown}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                  <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/vol:opacity-100 transition-opacity -ml-1.5"
                    style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-xs font-medium ml-2 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Restart */}
            <button
              onClick={(e) => { e.stopPropagation(); restart(); }}
              className="p-1.5 text-white hover:text-orange-400 transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                className={`p-1.5 text-white hover:text-orange-400 transition-colors ${showSettings ? 'text-orange-400' : ''}`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              {showSettings && (
                <div
                  className="settings-menu absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 py-2 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Speed
                  </div>
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full px-4 py-1.5 text-sm text-left hover:bg-gray-700/50 transition-colors ${
                        playbackRate === rate ? 'text-orange-400 font-semibold' : 'text-gray-300'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-1.5 text-white hover:text-orange-400 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { type Song, music } from "@/content";
import { assetUrl } from "@/router";
import { useSoundEnabled } from "@/sound";
import { Expand, Minimise, Next, Pause, Play, Previous, SoundOff, SoundOn } from "./icons";

/*
 * The "Now playing" card that appears when the speaker is clicked. Songs
 * come from the music list in content.js. YouTube links play in YouTube's
 * own player (shown in the card, as YouTube requires); audio files play
 * directly. The card can be shrunk to one line while the music carries on;
 * clicking the speaker again stops it.
 */

type YTPlayer = {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApi: Promise<YTNamespace> | null = null;
function loadYouTube() {
  youtubeApi ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youtubeApi = null;
      reject(new Error("YouTube could not be reached"));
    };
    document.head.appendChild(script);
  });
  return youtubeApi;
}

/* The 11-character video id from any kind of YouTube link (or the id itself). */
export function youtubeId(link = "") {
  const value = link.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1, 12);
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery.slice(0, 11);
    const fromPath = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return fromPath?.[1] ?? "";
  } catch {
    return "";
  }
}

const isYouTube = (song: Song) => Boolean(song.youtube && youtubeId(song.youtube));

const VOLUME_KEY = "ksi-volume";
const savedVolume = () => {
  try {
    const value = Number(window.localStorage.getItem(VOLUME_KEY));
    return window.localStorage.getItem(VOLUME_KEY) !== null && value >= 0 && value <= 1 ? value : 0.8;
  } catch {
    return 0.8;
  }
};

/* iPhones and iPads only allow the device's own volume buttons, so the slider is hidden there. */
const volumeWorks = (() => {
  try {
    const probe = new Audio();
    probe.volume = 0.5;
    return probe.volume === 0.5;
  } catch {
    return false;
  }
})();

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

export function NowPlaying({
  minimised,
  onMinimise,
  onExpand,
  onPlayingChange,
}: {
  /* True when the visitor has shrunk the card, or on phones while a section is open. */
  minimised: boolean;
  onMinimise: () => void;
  onExpand: () => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  const songs = music.songs;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [problem, setProblem] = useState("");
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [volume, setVolume] = useState(savedVolume);
  // The sound button at the top silences everything, the music included.
  const soundOn = useSoundEnabled();
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resumeRef = useRef(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const song = songs[index];

  const step = useCallback(
    (by: number) => {
      setProblem("");
      setTime({ current: 0, duration: 0 });
      setIndex((current) => (current + by + songs.length) % songs.length);
    },
    [songs.length],
  );

  useEffect(() => onPlayingChange(playing), [playing, onPlayingChange]);
  useEffect(() => () => onPlayingChange(false), [onPlayingChange]);

  // Load and start the current song.
  useEffect(() => {
    if (!song) return;
    let cancelled = false;
    if (isYouTube(song)) {
      audioRef.current?.pause();
      const id = youtubeId(song.youtube);
      if (playerRef.current) {
        playerRef.current.loadVideoById(id);
      } else {
        loadYouTube()
          .then((YT) => {
            if (cancelled || !hostRef.current) return;
            const mount = document.createElement("div");
            hostRef.current.replaceChildren(mount);
            playerRef.current = new YT.Player(mount, {
              host: "https://www.youtube-nocookie.com",
              videoId: id,
              width: "100%",
              height: "100%",
              playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
              events: {
                onReady: ({ target }) => {
                  target.setVolume(Math.round(volumeRef.current * 100));
                  if (!soundRef.current) target.mute();
                },
                onStateChange: ({ data }) => {
                  if (data === 1) setPlaying(true);
                  if (data === 2 || data === -1) setPlaying(false);
                  if (data === 0) step(1);
                },
                onError: () => {
                  setPlaying(false);
                  setProblem("This video can’t be played here, so it was skipped.");
                  if (songs.length > 1) window.setTimeout(() => step(1), 1800);
                },
              },
            });
          })
          .catch(() => setProblem("YouTube couldn’t be reached. Check the connection and try again."));
      }
    } else if (song.file) {
      playerRef.current?.stopVideo();
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.preload = "auto";
      audio.volume = volumeRef.current;
      audio.muted = !soundRef.current;
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
      audio.onended = () => step(1);
      audio.ontimeupdate = () => setTime({ current: audio.currentTime, duration: audio.duration || 0 });
      audio.ondurationchange = audio.ontimeupdate;
      audio.onerror = () => {
        setPlaying(false);
        setProblem("This audio file couldn’t be found.");
      };
      audio.src = assetUrl(song.file);
      audio.play().catch(() => setPlaying(false));
    }
    return () => {
      cancelled = true;
    };
  }, [song, step, songs.length]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !soundOn;
    if (soundOn) playerRef.current?.unMute();
    else playerRef.current?.mute();
  }, [soundOn]);

  // YouTube doesn't report its progress, so ask it twice a second while it plays.
  useEffect(() => {
    if (!song || !isYouTube(song) || !playing) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (player) setTime({ current: player.getCurrentTime(), duration: player.getDuration() });
    }, 500);
    return () => window.clearInterval(timer);
  }, [song, playing]);

  // Stop everything when the music is switched off.
  useEffect(
    () => () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      audioRef.current = null;
    },
    [],
  );

  // YouTube's player must be on show while it plays, so a YouTube song pauses
  // while the card is shrunk, and carries on when it opens up again.
  useEffect(() => {
    if (!song || !isYouTube(song)) return;
    if (minimised && playingRef.current) {
      resumeRef.current = true;
      playerRef.current?.pauseVideo();
    } else if (!minimised && resumeRef.current) {
      resumeRef.current = false;
      playerRef.current?.playVideo();
    }
  }, [minimised, song]);

  const toggle = () => {
    if (!song) return;
    if (isYouTube(song)) {
      if (playing) playerRef.current?.pauseVideo();
      else playerRef.current?.playVideo();
    } else if (audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
  };

  const seek = (seconds: number) => {
    setTime((value) => ({ ...value, current: seconds }));
    if (song && isYouTube(song)) playerRef.current?.seekTo(seconds, true);
    else if (audioRef.current) audioRef.current.currentTime = seconds;
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
    playerRef.current?.setVolume(Math.round(value * 100));
    try {
      window.localStorage.setItem(VOLUME_KEY, String(value));
    } catch {
      /* Storage can be unavailable (private mode); the volume still applies now. */
    }
  };

  if (!song) return null;
  const video = isYouTube(song);
  const details = [song.artist, song.film].filter(Boolean).join(" · ");
  const length = time.duration > 0 ? time.duration : 0;
  const progress = length ? Math.min(100, (time.current / length) * 100) : 0;

  return (
    <section className="np" aria-label="Now playing" data-playing={playing} data-compact={minimised}>
      <header className="np-head">
        <span className="np-live" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {minimised ? (
          <button type="button" className="np-kicker np-expand-title" onClick={onExpand} aria-label={`Now playing: ${song.title}. Show the player`}>
            {song.title}
          </button>
        ) : (
          <span className="np-kicker">Now playing · {music.title}</span>
        )}
        {minimised && !video ? (
          <button type="button" className="np-mini" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause /> : <Play />}
          </button>
        ) : null}
        {minimised ? (
          <button type="button" className="np-close" onClick={onExpand} aria-label="Show the player">
            <Expand />
          </button>
        ) : (
          <button type="button" className="np-close" onClick={onMinimise} aria-label="Minimise the player (the music keeps playing)">
            <Minimise />
          </button>
        )}
      </header>
      {/* YouTube's player has to stay visible (at least 200 × 200 pixels) while it plays. */}
      <div className="np-video" ref={hostRef} hidden={!video} />
      <div className="np-song" aria-live="polite">
        <div className="np-title-row">
          <p className="np-title">{song.title}</p>
          <span className="np-count">
            {String(index + 1).padStart(2, "0")}/{String(songs.length).padStart(2, "0")}
          </span>
        </div>
        {details ? <p className="np-meta">{details}</p> : null}
        {song.credit ? (
          <p className="np-credit">
            {song.creditUrl ? (
              <a href={song.creditUrl} target="_blank" rel="noopener noreferrer">
                {song.credit}
              </a>
            ) : (
              song.credit
            )}
          </p>
        ) : null}
        {problem ? <p className="np-problem">{problem}</p> : null}
      </div>
      <div className="np-seek">
        <span className="np-time">{clock(time.current)}</span>
        <input
          type="range"
          className="np-range"
          min={0}
          max={length || 1}
          step={0.5}
          value={Math.min(time.current, length || 1)}
          disabled={!length}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Position in the song"
          aria-valuetext={`${clock(time.current)} of ${clock(length)}`}
          style={{ "--p": `${progress}%` } as CSSProperties}
        />
        <span className="np-time">{clock(length)}</span>
      </div>
      <div className="np-controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous song" disabled={songs.length < 2}>
          <Previous />
        </button>
        <button type="button" className="np-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause /> : <Play />}
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next song" disabled={songs.length < 2}>
          <Next />
        </button>
        {volumeWorks ? (
          <span className="np-volume">
            <button
              type="button"
              className="np-mute"
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              aria-label={volume > 0 ? "Mute the music" : "Unmute the music"}
            >
              {volume > 0 ? <SoundOn /> : <SoundOff />}
            </button>
            <input
              type="range"
              className="np-range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Music volume"
              aria-valuetext={`${Math.round(volume * 100)}%`}
              style={{ "--p": `${volume * 100}%` } as CSSProperties}
            />
          </span>
        ) : null}
      </div>
    </section>
  );
}

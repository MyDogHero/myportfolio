import { useCallback, useEffect, useRef, useState } from "react";
import { type Song, music } from "@/content";
import { assetUrl } from "@/router";
import { Close, Next, Pause, Play, Previous } from "./icons";

/*
 * The "Now playing" card that appears when the speaker is clicked. Songs
 * come from the music list in content.js. YouTube links play in YouTube's
 * own player (shown in the card, as YouTube requires); audio files play
 * directly.
 */

type YTPlayer = {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
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

export function NowPlaying({
  compact,
  onClose,
  onPlayingChange,
}: {
  /* True on phones while a section is open: the card shrinks to one line. */
  compact: boolean;
  onClose: () => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  const songs = music.songs;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [problem, setProblem] = useState("");
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resumeRef = useRef(false);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const song = songs[index];

  const step = useCallback(
    (by: number) => {
      setProblem("");
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
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
      audio.onended = () => step(1);
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

  // Stop everything when the card closes.
  useEffect(
    () => () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  // YouTube's player must be on show while it plays, so a YouTube song pauses
  // while the card is shrunk, and carries on when it opens up again.
  useEffect(() => {
    if (!song || !isYouTube(song)) return;
    if (compact && playingRef.current) {
      resumeRef.current = true;
      playerRef.current?.pauseVideo();
    } else if (!compact && resumeRef.current) {
      resumeRef.current = false;
      playerRef.current?.playVideo();
    }
  }, [compact, song]);

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

  if (!song) return null;
  const video = isYouTube(song);
  const details = [song.artist, song.film].filter(Boolean).join(" · ");

  return (
    <section className="np" aria-label="Now playing" data-playing={playing} data-compact={compact}>
      <header className="np-head">
        <span className="np-live" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="np-kicker">{compact ? song.title : `Now playing · ${music.title}`}</span>
        {compact && !video ? (
          <button type="button" className="np-mini" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause /> : <Play />}
          </button>
        ) : null}
        <button type="button" className="np-close" onClick={onClose} aria-label="Stop the music and close">
          <Close />
        </button>
      </header>
      {/* YouTube's player has to stay visible (at least 200 × 200 pixels) while it plays. */}
      <div className="np-video" ref={hostRef} hidden={!video} />
      <div className="np-song" aria-live="polite">
        <p className="np-title">{song.title}</p>
        {details ? <p className="np-meta">{details}</p> : null}
        {problem ? <p className="np-problem">{problem}</p> : null}
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
        <span className="np-count">
          {String(index + 1).padStart(2, "0")} / {String(songs.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}

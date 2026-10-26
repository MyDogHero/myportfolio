import { contact, profile } from "@/content";
import { assetUrl, menuRoutes, useRouter } from "@/router";
import { setSound, useSoundEnabled } from "@/sound";
import { Clock } from "./effects";
import { Download, SoundOff, SoundOn } from "./icons";
import { PageLink, ScrambleText } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

/* Everything drawn over the room: logo, clock, sound and text-version switches, name, the menu pill and the CV link. */
export function Hud({ textMode, onToggleText }: { textMode: boolean; onToggleText: () => void }) {
  const { current } = useRouter();
  const sound = useSoundEnabled();
  return (
    <>
      <header className="hud-top">
        <PageLink to="home" className="hud-logo" aria-label={`${profile.name}, back to the room`}>
          <span className="hud-mark" aria-hidden="true">
            {profile.initials}
          </span>
        </PageLink>
        <div className="hud-actions">
          <span className="hud-clock">
            <Clock />
          </span>
          <button
            type="button"
            className="hud-button hud-sound"
            onClick={() => setSound(!sound)}
            aria-pressed={sound}
            aria-label="Sound effects"
            title={sound ? "Sound on" : "Sound off"}
          >
            {sound ? <SoundOn /> : <SoundOff />}
          </button>
          <button type="button" className="hud-button" onClick={onToggleText} aria-pressed={textMode}>
            {textMode ? "3D room" : "Text version"}
          </button>
        </div>
      </header>

      <div className="hud-id">
        <p className="hud-name">{profile.name}</p>
        <p className="hud-role">
          <span className="live-dot" aria-hidden="true" />
          {profile.nameLine}
        </p>
      </div>

      {!textMode ? (
        <p className="hud-hint" data-hidden={current !== "home"}>
          Click a <span className="hud-tick">▲</span> to open it · drag to look around
        </p>
      ) : null}

      <nav className="hud-nav" id="sections-nav" aria-label="Sections">
        <ul>
          {menuRoutes.map((item, index) => (
              <li key={item.id}>
                <PageLink to={item.id} className="hud-link">
                  <span className="hud-num" aria-hidden="true">
                    {pad(index + 1)}
                  </span>
                  <ScrambleText text={item.label} />
                </PageLink>
              </li>
            ))}
        </ul>
      </nav>

      {contact.cvFile ? (
        <a className="hud-cv" href={assetUrl(contact.cvFile)} download>
          CV <Download />
        </a>
      ) : null}
    </>
  );
}

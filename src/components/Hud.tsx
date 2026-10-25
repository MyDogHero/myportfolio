import { contact, profile } from "@/content";
import { assetUrl, routes, useRouter } from "@/router";
import { Clock } from "./effects";
import { Download } from "./icons";
import { PageLink, ScrambleText } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

/* Everything drawn over the room: logo, clock, text-version switch, name, the menu pill and the CV link. */
export function Hud({ textMode, onToggleText }: { textMode: boolean; onToggleText: () => void }) {
  const { current } = useRouter();
  const city = contact.location.split(",")[0];
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
          <button type="button" className="hud-button" onClick={onToggleText} aria-pressed={textMode}>
            {textMode ? "3D room" : "Text version"}
          </button>
        </div>
      </header>

      <div className="hud-id">
        <p className="hud-name">{profile.name}</p>
        <p className="hud-role">
          <span className="live-dot" aria-hidden="true" />
          {profile.focusLine}
          {city ? ` · ${city}` : ""}
        </p>
      </div>

      {!textMode ? (
        <p className="hud-hint" data-hidden={current !== "home"}>
          Click a <span className="hud-tick">▲</span> to open it · drag to look around
        </p>
      ) : null}

      <nav className="hud-nav" id="sections-nav" aria-label="Sections">
        <ul>
          {routes
            .filter((item) => item.id !== "home")
            .map((item, index) => (
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

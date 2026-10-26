import {
  type ComponentProps,
  type ElementType,
  Fragment,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { type RouteId, hrefFor, useRouter } from "@/router";
import { parseFigure, scramble, useMagnetic, useOdometer } from "@/motion";
import { Check, Copy } from "./icons";

/* A link to one of the five pages. It changes page in place, with the transition. */
export function PageLink({
  to,
  onClick,
  children,
  ...rest
}: { to: RouteId } & Omit<ComponentProps<"a">, "href">) {
  const { go, current } = useRouter();
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    go(to);
  };
  return (
    <a {...rest} href={hrefFor(to)} aria-current={current === to ? "page" : undefined} onClick={follow}>
      {children}
    </a>
  );
}

/* Text that shuffles its letters for a moment when the pointer arrives over its link or button. */
export function ScrambleText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const span = ref.current;
    const host = span?.closest("a, button");
    if (!span || !host) return;
    const run = () => scramble(span, text, 0.45);
    host.addEventListener("pointerenter", run);
    return () => host.removeEventListener("pointerenter", run);
  }, [text]);
  return (
    <span className="scramble" aria-label={text}>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

type ButtonLook = "primary" | "secondary";

/* A pill button that is drawn toward the mouse. Give it `to` for a page, or `href` for anything else. */
export function MagneticButton({
  to,
  href,
  look = "primary",
  className = "",
  children,
  ...rest
}: {
  to?: RouteId;
  href?: string;
  look?: ButtonLook;
} & Omit<ComponentProps<"a">, "href">) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref);
  const classes = `button button-${look} ${className}`;
  const label = <span className="magnetic-label">{children}</span>;
  if (to) {
    return (
      <PageLink {...rest} ref={ref} to={to} className={classes}>
        {label}
      </PageLink>
    );
  }
  return (
    <a {...rest} ref={ref} href={href} className={classes}>
      {label}
    </a>
  );
}

/*
 * A number whose digits roll into place like an exchange board when it
 * scrolls into view. Screen readers hear the final value.
 */
export function Odometer({
  value,
  prefix = "",
  suffix = "",
  className = "",
  mode = "open",
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  mode?: "open" | "scroll";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useOdometer(ref, mode);
  const animatable = parseFigure(value).animatable;
  return (
    <span className={`odo ${className}`} ref={ref}>
      <span className="visually-hidden">
        {prefix}
        {value}
        {suffix}
      </span>
      <span className="odo-face" aria-hidden="true">
        {prefix ? <span className="odo-affix">{prefix}</span> : null}
        {animatable
          ? Array.from(value).map((char, index) =>
              /\d/.test(char) ? (
                <span className="odo-col" key={index}>
                  {/* The digit itself keeps the column's width; the strip rolls over it. */}
                  <span className="odo-size">{char}</span>
                  <span className="odo-strip" data-digit={char}>
                    {Array.from({ length: 20 }, (_, n) => (
                      <span key={n}>{n % 10}</span>
                    ))}
                  </span>
                </span>
              ) : (
                <span className="odo-sep" key={index}>
                  {char}
                </span>
              ),
            )
          : value}
        {suffix ? <span className="odo-affix">{suffix}</span> : null}
      </span>
    </span>
  );
}

/* Text where words between *stars* (as written in content.js) are set in the accent style. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 ? (
          <em className="accent-word" key={index}>
            {part}
          </em>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/* A dashed placeholder kept on purpose for what comes next ("Reserved for …"). */
export function Reserved({ label, as: Tag = "li" }: { label: string; as?: ElementType }) {
  return (
    <Tag className="reserved" data-reveal>
      <span className="reserved-tag" aria-hidden="true">
        Pending
      </span>
      <span>Reserved for {label}</span>
      <span className="reserved-cursor" aria-hidden="true" />
    </Tag>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      setState(ok ? "copied" : "failed");
    }
  };

  return (
    <button type="button" className={`copy-button${state === "copied" ? " is-done" : ""}`} onClick={copy}>
      {state === "copied" ? <Check /> : <Copy />}
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
      </span>
    </button>
  );
}

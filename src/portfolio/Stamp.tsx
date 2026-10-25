import {
  type CSSProperties,
  useId,
  useRef,
  useState,
} from "react";
import { profile } from "@/content";
import { prefersReducedMotion, useIsThumb } from "./shared";

/*
 * The rubber stamp. When `interactive`, pressing it lifts the stamp and
 * presses it down again at a slightly different angle with a fresh ink texture.
 */
export function Stamp({
  className = "",
  baseAngle = -9,
  interactive = false,
  intro = false,
}: {
  className?: string;
  baseAngle?: number;
  interactive?: boolean;
  intro?: boolean;
}) {
  const isThumb = useIsThumb();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ring = `${uid}-ring`;
  const ink = `${uid}-ink`;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const svgRef = useRef<SVGSVGElement>(null);
  const [angle, setAngle] = useState(baseAngle);
  const [seed, setSeed] = useState(11);
  const [introDone, setIntroDone] = useState(!intro || isThumb);

  const press = () => {
    const nextAngle = baseAngle + (Math.random() * 10 - 5);
    const nextSeed = 1 + Math.floor(Math.random() * 97);
    const svg = svgRef.current;
    setIntroDone(true);

    if (!svg || typeof svg.animate !== "function" || prefersReducedMotion()) {
      setAngle(nextAngle);
      setSeed(nextSeed);
      return;
    }

    svg.animate(
      [
        { transform: `rotate(${angle}deg) scale(1)`, opacity: 0.9 },
        {
          transform: `rotate(${angle}deg) translateY(-7%) scale(1.13)`,
          opacity: 0.3,
          offset: 0.36,
        },
        {
          transform: `rotate(${nextAngle}deg) scale(0.95)`,
          opacity: 0.97,
          offset: 0.72,
        },
        { transform: `rotate(${nextAngle}deg) scale(1)`, opacity: 0.9 },
      ],
      { duration: 540, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)" },
    );
    // Swap the ink while the stamp is lifted, so the new print lands with it.
    window.setTimeout(() => {
      setAngle(nextAngle);
      setSeed(nextSeed);
    }, 200);
  };

  const svg = (
    <svg
      ref={svgRef}
      className={`stamp${introDone ? "" : " is-intro"}${
        interactive && !isThumb ? "" : ` ${className}`
      }`}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
      style={{ "--stamp-angle": `${angle}deg` } as CSSProperties}
      onAnimationEnd={() => setIntroDone(true)}
    >
      <defs>
        <path
          id={ring}
          d={`M 80 80 m -${radius} 0 a ${radius} ${radius} 0 1 1 ${
            radius * 2
          } 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`}
        />
        <filter id={ink} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.1"
            numOctaves="2"
            seed={seed}
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05"
            result="coverage"
          />
          <feComposite
            in="SourceGraphic"
            in2="coverage"
            operator="in"
            result="inked"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="2"
            seed={seed + 3}
            result="wobble"
          />
          <feDisplacementMap
            in="inked"
            in2="wobble"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter={`url(#${ink})`}>
        <circle className="stamp-line" cx="80" cy="80" r="75" strokeWidth="3" />
        <circle className="stamp-line" cx="80" cy="80" r="70" strokeWidth="0.9" />
        <circle className="stamp-line" cx="80" cy="80" r="45" strokeWidth="0.9" />
        <text className="stamp-rim">
          <textPath
            href={`#${ring}`}
            textLength={circumference - 4}
            lengthAdjust="spacing"
          >
            {profile.stampRim.toUpperCase()}
          </textPath>
        </text>
        <text className="stamp-mark" x="80" y="86" textAnchor="middle">
          {profile.initials}
        </text>
        <text className="stamp-year" x="80" y="105" textAnchor="middle">
          {profile.stampYear}
        </text>
      </g>
    </svg>
  );

  if (!interactive || isThumb) return svg;

  return (
    <button
      type="button"
      className={`stamp-button ${className}`}
      onClick={press}
      aria-label="Press the stamp again"
      title="Press the stamp again"
      data-testid={`button-${className}`}
    >
      {svg}
    </button>
  );
}

/* Small line icons, drawn in the current text colour. */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const ArrowUpRight = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Download = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);

export const Copy = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </svg>
);

export const Check = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const Mail = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const LinkedIn = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.6v3" />
  </svg>
);

export const Pin = ({ className }: IconProps) => (
  <svg {...base} className={`icon ${className ?? ""}`}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);

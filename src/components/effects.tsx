import { useEffect, useState } from "react";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/* The time in Bengaluru, ticking every second. */
export function Clock({ prefix = "BLR" }: { prefix?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="clock">
      {prefix ? `${prefix} ` : ""}
      <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time> IST
    </span>
  );
}

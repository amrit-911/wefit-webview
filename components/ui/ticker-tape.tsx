"use client";

import { useEffect, useRef } from "react";

interface TickerTapeProps {
  content: string;
  speed?: number; // pixels per second, default 60
  className?: string;
}

export function TickerTape({ content, speed = 60, className = "" }: TickerTapeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Duplicate content enough times so the loop is seamless
    const items = track.querySelectorAll<HTMLSpanElement>(".ticker-item");
    if (items.length === 0) return;

    let raf: number;
    let x = 0;
    const singleWidth = items[0].offsetWidth;
    const totalWidth = singleWidth * items.length;
    let last: number | null = null;

    function step(ts: number) {
      if (last === null) last = ts;
      const delta = (ts - last) / 1000;
      last = ts;
      x -= speed * delta;
      // Reset when one full copy has scrolled off
      if (x <= -singleWidth) x += singleWidth;
      if (track) track.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [content, speed]);

  // Repeat text enough times to fill a wide screen seamlessly
  const repeats = 12;

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div ref={trackRef} className="inline-flex will-change-transform">
        {Array.from({ length: repeats }).map((_, i) => (
          <span key={i} className="ticker-item inline-block px-8 text-sm font-medium">
            {content}
            <span className="mx-6 opacity-50">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

import { useMemo } from "react";

interface Bubble {
  left: string;
  size: number;
  duration: number;
  delay: number;
}

const AquaBackground = ({ bubbles = 18 }: { bubbles?: number }) => {
  const items = useMemo<Bubble[]>(
    () =>
      Array.from({ length: bubbles }).map(() => ({
        left: `${Math.random() * 100}%`,
        size: 6 + Math.random() * 28,
        duration: 9 + Math.random() * 12,
        delay: Math.random() * 10,
      })),
    [bubbles]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-aqua-deep" />
      <div className="absolute inset-0 aqua-caustics" />
      <div className="absolute inset-x-0 top-1/3 h-32 aqua-wave opacity-50" />
      <div className="absolute inset-x-0 bottom-1/4 h-40 aqua-wave opacity-30" style={{ animationDuration: "14s" }} />
      {items.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400" />
    </div>
  );
};

export default AquaBackground;

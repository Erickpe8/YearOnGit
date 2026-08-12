"use client";

const PARTICLES = [
  { text: "{", top: "12%", left: "8%", size: 18, delay: 0, duration: 14 },
  { text: "}", top: "22%", left: "88%", size: 20, delay: 1.2, duration: 16 },
  { text: "</>", top: "68%", left: "6%", size: 14, delay: 0.6, duration: 18 },
  { text: "•", top: "78%", left: "92%", size: 22, delay: 2, duration: 12 },
  { text: "{", top: "45%", left: "4%", size: 16, delay: 0.9, duration: 15 },
  { text: "</>", top: "35%", left: "94%", size: 13, delay: 1.8, duration: 17 },
  { text: "•", top: "55%", left: "96%", size: 10, delay: 0.3, duration: 13 },
  { text: "}", top: "85%", left: "18%", size: 17, delay: 2.4, duration: 19 },
  { text: "</>", top: "18%", left: "72%", size: 12, delay: 1.1, duration: 14 },
  { text: "•", top: "62%", left: "82%", size: 11, delay: 0.5, duration: 16 },
];

export function CodeParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="code-particle absolute font-mono font-medium text-[#39d353]/20"
          style={{
            top: p.top,
            left: p.left,
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}

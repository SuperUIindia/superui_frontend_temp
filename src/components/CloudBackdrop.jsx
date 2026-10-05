import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Animated cloud field used as the hero background.
 *
 * Three parallax bands drift at different speeds and blur levels to build real
 * depth. Each band is one tile rendered twice side by side and translated by
 * exactly -50%, so the loop is seamless. Motion is transform-only (compositor
 * friendly) and the blur lives in an SVG filter inside the tile's own box, so
 * nothing large is blurred off-screen.
 *
 * Tints are deliberately low-alpha: on a white page these read as soft
 * atmosphere rather than coloured fog.
 */
const TILE_W = 1600;
const TILE_H = 420;

const BANDS = [
  {
    id: 'far',
    top: '0%',
    height: '62%',
    opacity: 0.5,
    blur: 30,
    duration: 210,
    reverse: false,
    tint: '#8FA8CE',
    puffs: [
      { x: 90, y: 250, s: 1.15 },
      { x: 400, y: 205, s: 0.85 },
      { x: 660, y: 262, s: 1.3 },
      { x: 960, y: 198, s: 0.95 },
      { x: 1280, y: 248, s: 1.2 },
      { x: 1570, y: 210, s: 0.9 },
      { x: 300, y: 350, s: 0.7 },
      { x: 1180, y: 355, s: 0.75 }
    ]
  },
  {
    id: 'mid',
    top: '18%',
    height: '64%',
    opacity: 0.55,
    blur: 20,
    duration: 135,
    reverse: true,
    tint: '#A78BE8',
    puffs: [
      { x: 210, y: 235, s: 1.05 },
      { x: 560, y: 275, s: 1.25 },
      { x: 930, y: 225, s: 0.95 },
      { x: 1290, y: 268, s: 1.15 },
      { x: 1560, y: 232, s: 0.85 },
      { x: 740, y: 358, s: 0.65 }
    ]
  },
  {
    id: 'near',
    top: '38%',
    height: '58%',
    opacity: 0.4,
    blur: 13,
    duration: 92,
    reverse: false,
    tint: '#FFB27A',
    puffs: [
      { x: 380, y: 250, s: 1.1 },
      { x: 820, y: 285, s: 1.3 },
      { x: 1420, y: 245, s: 1.05 },
      { x: 60, y: 288, s: 0.8 }
    ]
  }
];

/** One seamless cloud tile: overlapping puffs blurred into a cloud silhouette. */
function CloudTile({ band, instance }) {
  const gradientId = `cloud-grad-${band.id}-${instance}`;
  const filterId = `cloud-blur-${band.id}`;

  return (
    <svg
      viewBox={`0 0 ${TILE_W} ${TILE_H}`}
      preserveAspectRatio="none"
      className="h-full w-1/2 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={band.tint} stopOpacity="0.2" />
          <stop offset="55%" stopColor={band.tint} stopOpacity="0.1" />
          <stop offset="100%" stopColor={band.tint} stopOpacity="0" />
        </radialGradient>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={band.blur} />
        </filter>
      </defs>

      <g filter={`url(#${filterId})`} fill={`url(#${gradientId})`}>
        {band.puffs.map((puff, i) => (
          <g key={i} transform={`translate(${puff.x} ${puff.y}) scale(${puff.s})`}>
            <ellipse cx="0" cy="0" rx="132" ry="66" />
            <ellipse cx="-76" cy="20" rx="92" ry="48" />
            <ellipse cx="82" cy="18" rx="98" ry="52" />
            <ellipse cx="-16" cy="-42" rx="76" ry="48" />
            <ellipse cx="50" cy="-26" rx="58" ry="38" />
            <ellipse cx="-84" cy="-8" rx="54" ry="34" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function CloudBackdrop() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef(null);

  // Gentle parallax: the cloud field drifts slower than the page scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const fadeOut = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <div ref={sectionRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={shouldReduceMotion ? undefined : { y: parallaxY, opacity: fadeOut }}
      >
        {BANDS.map((band, index) => (
          <div
            key={band.id}
            className="absolute inset-x-0"
            style={{
              top: band.top,
              height: band.height,
              opacity: band.opacity,
              // Fade the tile edges so the band has no visible seam
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, #000 18%, #000 74%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, #000 18%, #000 74%, transparent 100%)'
            }}
          >
            <div
              className={`cloud-track flex h-full w-[200%] ${band.reverse ? 'cloud-track--reverse' : ''}`}
              style={
                shouldReduceMotion
                  ? undefined
                  : { animationDuration: `${band.duration}s`, animationDelay: `${-index * 37}s` }
              }
            >
              <CloudTile band={band} instance="a" />
              <CloudTile band={band} instance="b" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Light pool behind the headline keeps the copy crisp on white */}
      <div
        className="absolute left-1/2 top-[38%] h-[520px] w-[min(900px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.92),rgba(255,255,255,0.55)_55%,transparent_78%)]"
        aria-hidden="true"
      />

      {/* Soften the section's leading edge into the navbar */}
      <div
        className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(to_bottom,#FFFFFF_0%,rgba(255,255,255,0.65)_45%,transparent_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}
import { memo, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  useAnimation,
} from 'framer-motion';
import './HeroHackathon.css';

/* ══════════════════════════════════════════════
   PHASE TIMELINE (seconds from `ready`)
   ══════════════════════════════════════════════ */

const T = {
  grid:           0,
  botTo:          0.3,
  agent:          0.5,      // 200ms after BOT TO
  shapes:         0.55,
  shapeStagger:   0.06,
  datePill:       1.0,
  cta:            1.15,
  ctaArrowNudge:  1.55,
  countdown:      1.35,
  countdownStagger: 0.09,
  badge:          1.6,
  focusDimStart:  1.85,
  location:       1.95,
};

/* ══════════════════════════════════════════════
   SVG SHAPE LIBRARY
   ══════════════════════════════════════════════ */

const SquigglyLine = ({ color }: { color: string }) => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
    <path d="M2 20C10 5 20 35 30 20C40 5 50 35 60 20C70 5 80 35 90 20C100 5 110 35 118 20"
      stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
  </svg>
);

const Blob = ({ color }: { color: string }) => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="40" rx="35" ry="28" fill={color} />
  </svg>
);

const Starburst = ({ color }: { color: string }) => (
  <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
    <polygon points="35,2 42,25 65,25 46,40 53,63 35,48 17,63 24,40 5,25 28,25" fill={color} />
  </svg>
);

const StarburstAlt = ({ color }: { color: string }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
    <path d="M30 0 L34 22 L56 18 L38 30 L56 42 L34 38 L30 60 L26 38 L4 42 L22 30 L4 18 L26 22 Z" fill={color} />
  </svg>
);

const SpeechBubble = ({ color }: { color: string }) => (
  <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
    <rect x="5" y="2" width="50" height="32" rx="16" fill={color} />
    <polygon points="15,32 22,32 12,46" fill={color} />
  </svg>
);

const CrossShape = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="15" y="2" width="10" height="36" rx="3" fill={color} />
    <rect x="2" y="15" width="36" height="10" rx="3" fill={color} />
  </svg>
);

const Ring = ({ color }: { color: string }) => (
  <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
    <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="5" fill="none" />
  </svg>
);

const ZigzagLine = ({ color }: { color: string }) => (
  <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
    <polyline points="2,26 12,2 22,26 32,2 42,26 52,2 62,26 72,2 82,26 92,2 98,20"
      stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const Sphere3D = ({ color, size = 50 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
    <defs>
      <radialGradient id={`s-${color.replace('#','')}-${size}`} cx="35%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="40%" stopColor={color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={color} />
      </radialGradient>
    </defs>
    <circle cx="25" cy="25" r="22" fill={`url(#s-${color.replace('#','')}-${size})`} />
    <ellipse cx="20" cy="18" rx="6" ry="4" fill="#fff" opacity="0.35" transform="rotate(-15 20 18)" />
  </svg>
);

const Cube3D = ({ color }: { color: string }) => (
  <svg width="50" height="55" viewBox="0 0 50 55" fill="none">
    <polygon points="25,5 45,15 25,25 5,15" fill={color} opacity="0.9" />
    <polygon points="45,15 45,40 25,50 25,25" fill={color} opacity="0.55" />
    <polygon points="5,15 25,25 25,50 5,40" fill={color} opacity="0.72" />
  </svg>
);

const Cone3D = ({ color }: { color: string }) => (
  <svg width="45" height="55" viewBox="0 0 45 55" fill="none">
    <defs>
      <linearGradient id={`cn-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={color} stopOpacity="0.45" />
      </linearGradient>
    </defs>
    <polygon points="22,2 40,48 4,48" fill={`url(#cn-${color.replace('#','')})`} />
    <ellipse cx="22" cy="48" rx="18" ry="5" fill={color} opacity="0.6" />
  </svg>
);

const Torus3D = ({ color }: { color: string }) => (
  <svg width="60" height="35" viewBox="0 0 60 35" fill="none">
    <ellipse cx="30" cy="18" rx="28" ry="14" stroke={color} strokeWidth="6" fill="none" opacity="0.65" />
    <ellipse cx="30" cy="18" rx="28" ry="14" stroke={color} strokeWidth="2.5" fill="none" opacity="0.35" />
  </svg>
);

/* ══════════════════════════════════════════════
   SHAPE CONFIGURATION
   ══════════════════════════════════════════════ */

interface ShapeDef {
  id: number;
  render: () => JSX.Element;
  depth: number;
  float: 'a' | 'b' | 'c';
  delay: number;
  opacity?: number;
}

const SHAPES: ShapeDef[] = [
  { id: 1,  render: () => <SquigglyLine color="#A3E635" />,        depth: -0.7,  float: 'a', delay: 0 },
  { id: 2,  render: () => <Blob color="#8B5CF6" />,                depth: 0.5,   float: 'b', delay: 0.04, opacity: 0.85 },
  { id: 3,  render: () => <Starburst color="#F5C400" />,           depth: -0.5,  float: 'c', delay: 0.08 },
  { id: 4,  render: () => <Sphere3D color="#FF6B6B" size={35} />,  depth: 0.8,   float: 'a', delay: 0.12 },
  { id: 5,  render: () => <SpeechBubble color="#8B5CF6" />,        depth: -0.6,  float: 'b', delay: 0.16 },
  { id: 6,  render: () => <Sphere3D color="#A3E635" size={16} />,  depth: 0.4,   float: 'c', delay: 0.2 },
  { id: 7,  render: () => <Ring color="#1a1a1a" />,                depth: -0.3,  float: 'a', delay: 0.24 },
  { id: 8,  render: () => <ZigzagLine color="#FB923C" />,          depth: -0.8,  float: 'b', delay: 0.28 },
  { id: 9,  render: () => <Cube3D color="#A3E635" />,              depth: 0.9,   float: 'c', delay: 0.32 },
  { id: 10, render: () => <CrossShape color="#F5C400" />,          depth: -0.4,  float: 'a', delay: 0.36 },
  { id: 11, render: () => <Sphere3D color="#8B5CF6" size={18} />,  depth: 0.6,   float: 'b', delay: 0.4 },
  { id: 12, render: () => <Cone3D color="#FF6B6B" />,              depth: 0.7,   float: 'c', delay: 0.44 },
  { id: 13, render: () => <SquigglyLine color="#F5C400" />,        depth: -0.5,  float: 'a', delay: 0.48 },
  { id: 14, render: () => <Torus3D color="#FB923C" />,             depth: 0.3,   float: 'b', delay: 0.52 },
  { id: 15, render: () => <SquigglyLine color="#1a1a1a" />,        depth: -0.6,  float: 'c', delay: 0.56 },
  { id: 16, render: () => <SpeechBubble color="#FF6B6B" />,        depth: 0.5,   float: 'a', delay: 0.6 },
  { id: 17, render: () => <StarburstAlt color="#F5C400" />,        depth: -0.35, float: 'b', delay: 0.64 },
  { id: 18, render: () => <Sphere3D color="#A3E635" size={42} />,  depth: 0.65,  float: 'c', delay: 0.68, opacity: 0.7 },
];

/* ══════════════════════════════════════════════
   INTERACTIVE SHAPE WRAPPER
   ══════════════════════════════════════════════ */

const InteractiveShape = memo(({
  children, depth, mouseX, mouseY, delay = 0, ready = false,
}: {
  children: React.ReactNode;
  depth: number;
  mouseX: any;
  mouseY: any;
  delay?: number;
  ready?: boolean;
}) => {
  const px = useTransform(mouseX, (v: number) => v * depth * 22);
  const py = useTransform(mouseY, (v: number) => v * depth * 16);

  return (
    <motion.div
      style={{ x: px, y: py }}
      initial={{ opacity: 0, scale: 0, rotate: -30 }}
      animate={
        ready
          ? { opacity: 1, scale: 1, rotate: 0 }
          : { opacity: 0, scale: 0, rotate: -30 }
      }
      transition={{
        type: 'spring',
        stiffness: 160,
        damping: 14,
        delay: ready ? T.shapes + delay : 0,
      }}
      whileTap={{ scale: 1.35, rotate: 10 }}
      className="shape-interactive"
    >
      {children}
    </motion.div>
  );
});

/* ══════════════════════════════════════════════
   COUNTDOWN CARD (flip animation on change)
   ══════════════════════════════════════════════ */

const CountdownCard = memo(({ value, label }: { value: number; label: string }) => {
  const display = value.toString().padStart(2, '0');

  return (
    <div className="countdown-card">
      <div className="countdown-card-inner">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            className="countdown-card-value"
            initial={{ y: -18, opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 18, opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="countdown-card-label">{label}</span>
    </div>
  );
});

/* ══════════════════════════════════════════════
   COUNTDOWN TIMER
   ══════════════════════════════════════════════ */

const CountdownTimer = memo(({ ready = false }: { ready?: boolean }) => {
  const targetDate = useMemo(() => new Date('2026-04-27T00:00:00').getTime(), []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = targetDate - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const entries = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div className="hero-countdown">
      {entries.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 28 }}
          animate={
            ready
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 28 }
          }
          transition={{
            type: 'spring',
            stiffness: 130,
            damping: 16,
            delay: ready ? T.countdown + idx * T.countdownStagger : 0,
          }}
        >
          <CountdownCard value={item.value} label={item.label} />
        </motion.div>
      ))}
    </div>
  );
});

/* ══════════════════════════════════════════════
   MAIN HERO COMPONENT — PHASED ENTRANCE
   ══════════════════════════════════════════════ */

const HeroHackathon = memo(({ ready = false }: { ready?: boolean }) => {
  const heroRef = useRef<HTMLElement>(null);
  const focusControls = useAnimation();

  /* ── Mouse tracking (normalized -1…1) ── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 45, damping: 28, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 28, mass: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width * 2 - 1);
    mouseY.set((e.clientY - rect.top) / rect.height * 2 - 1);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  /* ── Grid parallax ── */
  const grid1X = useTransform(springX, [-1, 1], [-4, 4]);
  const grid1Y = useTransform(springY, [-1, 1], [-4, 4]);
  const grid2X = useTransform(springX, [-1, 1], [-8, 8]);
  const grid2Y = useTransform(springY, [-1, 1], [-8, 8]);

  /* ── Mouse glow ── */
  const glowLeft = useTransform(springX, [-1, 1], ['20%', '80%']);
  const glowTop = useTransform(springY, [-1, 1], ['20%', '80%']);

  /* ── Badge 3D tilt ── */
  const badgeTiltX = useTransform(springY, [-1, 1], [8, -8]);
  const badgeTiltY = useTransform(springX, [-1, 1], [-8, 8]);

  /* ── Phase 7: Focus dim overlay ── */
  useEffect(() => {
    if (ready) {
      focusControls.start({
        opacity: [0, 0, 1, 1, 0],
        transition: {
          duration: 3.2,
          times: [0, 0.56, 0.62, 0.74, 1],
          ease: 'easeInOut',
        },
      });
    }
  }, [ready, focusControls]);

  /* Premium easing curve */
  const EASE = [0.22, 1, 0.36, 1] as const;

  return (
    <section id="hero-section" className="hero-hackathon" aria-label="Hackathon Hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ════ PHASE 1: BACKGROUND REVEAL ════ */}

      {/* Grid layer 1 – fine (scale zoom-in) */}
      <motion.div
        className="hero-grid-fine"
        style={{ x: grid1X, y: grid1Y }}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        transition={{ duration: 0.6, ease: EASE, delay: ready ? T.grid : 0 }}
        aria-hidden="true"
      />

      {/* Grid layer 2 – coarse */}
      <motion.div
        className="hero-grid-coarse"
        style={{ x: grid2X, y: grid2Y }}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
        transition={{ duration: 0.7, ease: EASE, delay: ready ? T.grid + 0.1 : 0 }}
        aria-hidden="true"
      />

      {/* Warm cursor glow */}
      <motion.div
        className="hero-mouse-glow"
        style={{ left: glowLeft, top: glowTop }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: ready ? 0.5 : 0 }}
        aria-hidden="true"
      />

      {/* Depth gradient */}
      <div className="hero-gradient-overlay" aria-hidden="true" />

      {/* ════ PHASE 7: FOCUS DIM OVERLAY ════ */}
      <motion.div
        className="hero-focus-overlay"
        initial={{ opacity: 0 }}
        animate={focusControls}
        aria-hidden="true"
      />

      {/* ════ PHASE 3: DECORATIVE SHAPES ════ */}
      <div className="hero-shapes" aria-hidden="true">
        {SHAPES.map((s) => (
          <div
            key={s.id}
            className={`hero-shape shape-${s.id} shape-float-${s.float}`}
            style={s.opacity != null ? { opacity: s.opacity } : undefined}
          >
            <InteractiveShape
              depth={s.depth}
              mouseX={springX}
              mouseY={springY}
              delay={s.delay}
              ready={ready}
            >
              {s.render()}
            </InteractiveShape>
          </div>
        ))}
      </div>

      {/* ── MLH Logo ── */}
      <motion.div
        className="hero-mlh-logo"
        initial={{ opacity: 0, x: 30, rotate: 8 }}
        animate={ready ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: 30, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16, delay: ready ? 0.4 : 0 }}
      >
        <img src="/mlh.png" alt="MLH – Major League Hacking" />
      </motion.div>

      {/* ════ PHASE 6: SPRINT BADGE ════ */}
      <motion.div
        className="hero-sprint-badge"
        style={{ rotateX: badgeTiltX, rotateY: badgeTiltY }}
        initial={{ opacity: 0, scale: 0.3, rotate: -20, x: 80 }}
        animate={
          ready
            ? { opacity: 1, scale: 1, rotate: -8, x: 0 }
            : { opacity: 0, scale: 0.3, rotate: -20, x: 80 }
        }
        transition={{
          type: 'spring',
          stiffness: 110,
          damping: 12,
          delay: ready ? T.badge : 0,
        }}
        whileHover={{ scale: 1.1, rotate: -3 }}
      >
        <span>8 Hours Sprint<br />Hackathon</span>
      </motion.div>

      {/* ════ PHASE 2 + 4: CONTENT ════ */}
      <div className="hero-content">

        {/* Top label */}
        <motion.span
          className="hero-top-label"
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE, delay: ready ? T.botTo - 0.1 : 0 }}
        >
          MLH HACK DAYS
        </motion.span>

        {/* ── PHASE 2: HEADLINE ── */}
        <h1 className="hero-headline">
          {/* "BOT TO" — spring overshoot slide-up */}
          <motion.span
            className="hero-headline-bot"
            initial={{ opacity: 0, y: 45 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 45 }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 10,
              mass: 0.8,
              delay: ready ? T.botTo : 0,
            }}
          >
            <span className="hero-text-yellow">BOT</span>{' '}
            <span className="hero-text-blue">TO</span>
          </motion.span>

          {/* "Agent" — glitch reveal */}
          <motion.span
            className="hero-headline-agent"
            initial={{ opacity: 0, x: 20, scaleX: 0.88 }}
            animate={
              ready
                ? {
                    opacity: [0, 0.5, 1, 0.82, 1],
                    x: [20, -3, 2, -1, 0],
                    scaleX: [0.88, 1.03, 0.97, 1.01, 1],
                  }
                : { opacity: 0, x: 20, scaleX: 0.88 }
            }
            transition={{
              duration: 0.55,
              ease: EASE,
              delay: ready ? T.agent : 0,
            }}
          >
            Agent
          </motion.span>
        </h1>

        {/* ── PHASE 4: DATE PILL ── */}
        <motion.div
          className="hero-date-pill"
          initial={{ opacity: 0, scale: 0.75, rotate: -5 }}
          animate={
            ready
              ? { opacity: 1, scale: 1, rotate: -2 }
              : { opacity: 0, scale: 0.75, rotate: -5 }
          }
          transition={{
            type: 'spring',
            stiffness: 250,
            damping: 13,
            delay: ready ? T.datePill : 0,
          }}
          whileHover={{ y: -3, boxShadow: '6px 6px 0 #000' }}
        >
          <span>27TH APRIL 2026</span>
        </motion.div>

        {/* ── PHASE 4: CTA BUTTON ── */}
        <motion.a
          href="https://events.mlh.io/events/14079-bot-to-agent"
          target="_blank"
          rel="noopener noreferrer"
          className="hero-cta-btn"
          id="hero-register-btn"
          initial={{ opacity: 0, y: 25 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 16,
            delay: ready ? T.cta : 0,
          }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          <span>Register Now</span>
          {/* Arrow with delayed nudge */}
          <motion.svg
            className="cta-arrow"
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            animate={ready ? { x: [0, 0, 5, 0] } : { x: 0 }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
              delay: ready ? T.ctaArrowNudge : 0,
            }}
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </motion.svg>
        </motion.a>

        {/* ── PHASE 5: COUNTDOWN ── */}
        <CountdownTimer ready={ready} />
      </div>

      {/* ════ PHASE 7: LOCATION — FINAL ANCHOR ════ */}
      <motion.div
        className="hero-location"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={
          ready
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 30, scale: 0.95 }
        }
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 18,
          mass: 0.9,
          delay: ready ? T.location : 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5C400" stroke="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>IEM ASHRAM BUILDING, KOLKATA, INDIA</span>
      </motion.div>
    </section>
  );
});

export default HeroHackathon;

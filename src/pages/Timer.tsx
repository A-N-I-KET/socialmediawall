import { memo, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  useAnimation,
} from 'framer-motion';
import confetti from 'canvas-confetti';
import '@/components/HeroHackathon.css'; // Reuse existing styles

/* ══════════════════════════════════════════════
   PHASE TIMELINE
   ══════════════════════════════════════════════ */

const T = {
  grid:           0,
  botTo:          0.3,
  agent:          0.5,
  shapes:         0.55,
  shapeStagger:   0.06,
  datePill:       1.0,
  countdown:      1.2,
  countdownStagger: 0.09,
  focusDimStart:  1.5,
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
  children, depth, mouseX, mouseY, delay = 0, ready = true,
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
   COUNTDOWN CARD
   ══════════════════════════════════════════════ */

const CountdownCard = memo(({ value, label }: { value: number; label: string }) => {
  const display = value.toString().padStart(2, '0');

  return (
    <div className="countdown-card" style={{ transform: 'scale(1.5)', margin: '0 25px' }}>
      <div className="countdown-card-inner" style={{ minWidth: '90px', height: '110px' }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            className="countdown-card-value"
            style={{ fontSize: '4.5rem' }}
            initial={{ y: -18, opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 18, opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="countdown-card-label" style={{ fontSize: '1rem', marginTop: '16px' }}>{label}</span>
    </div>
  );
});

/* ══════════════════════════════════════════════
   COUNTDOWN TIMER
   ══════════════════════════════════════════════ */

const CountdownTimer = memo(({ ready = true }: { ready?: boolean }) => {
  // Start: April 27, 2026, 09:30:00 (9:30 AM)
  const startDate = useMemo(() => new Date('2026-04-27T09:30:00').getTime(), []);
  // Target: April 27, 2026, 15:30:00 (3:30 PM)
  const targetDate = useMemo(() => new Date('2026-04-27T15:30:00').getTime(), []);
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    let wasEnded = false;
    const tick = () => {
      const now = Date.now();
      let diff = 0;

      if (now < startDate) {
        // Timer hasn't started yet, show the total duration
        diff = targetDate - startDate;
      } else if (now >= startDate && now < targetDate) {
        // Timer is running
        diff = targetDate - now;
      } else {
        // Timer has ended
        diff = 0;
        if (!wasEnded) {
          wasEnded = true;
          setHasEnded(true);
        }
      }

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startDate, targetDate]);

  useEffect(() => {
    if (hasEnded) {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [hasEnded]);

  const entries = [
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  if (hasEnded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
        className="hero-countdown"
        style={{ marginTop: '3rem', flexDirection: 'column', alignItems: 'center' }}
      >
        <h2 style={{ fontSize: '7rem', fontWeight: 900, background: 'linear-gradient(135deg, #FF6B6B, #F5C400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', textShadow: '0 10px 40px rgba(245, 196, 0, 0.3)', textAlign: 'center', lineHeight: '1.1' }}>
          TIME'S UP!
        </h2>
        <p style={{ fontSize: '2rem', fontWeight: 600, color: '#555', marginTop: '1.5rem', textAlign: 'center' }}>
          Congratulations Hackers! Drop your keyboards.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="hero-countdown" style={{ marginTop: '3rem', gap: '2.5rem' }}>
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
   ONGOING EVENTS
   ══════════════════════════════════════════════ */

const SCHEDULE_EVENTS = [
  { title: 'Check In', start: new Date('2026-04-27T08:30:00').getTime(), end: new Date('2026-04-27T09:30:00').getTime(), accent: '#1D539F' },
  { title: 'Hacking', start: new Date('2026-04-27T09:30:00').getTime(), end: new Date('2026-04-27T15:30:00').getTime(), accent: '#F5C400' },
  { title: 'Best Active Hacker', start: new Date('2026-04-27T09:30:00').getTime(), end: new Date('2026-04-27T15:30:00').getTime(), accent: '#14B8A6' },
  { title: 'HackerRank Mini Event', start: new Date('2026-04-27T11:30:00').getTime(), end: new Date('2026-04-27T12:00:00').getTime(), accent: '#FF6B6B' },
  { title: 'Lunch', start: new Date('2026-04-27T13:15:00').getTime(), end: new Date('2026-04-27T14:15:00').getTime(), accent: '#A3E635' },
  { title: 'Judging', start: new Date('2026-04-27T15:30:00').getTime(), end: new Date('2026-04-27T16:00:00').getTime(), accent: '#8B5CF6' },
  { title: 'Closing Ceremony', start: new Date('2026-04-27T16:00:00').getTime(), end: new Date('2026-04-27T16:30:00').getTime(), accent: '#FB923C' }
];

const OngoingEvents = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ongoing = SCHEDULE_EVENTS.filter(e => now >= e.start && now < e.end);
  const upcoming = SCHEDULE_EVENTS.filter(e => now < e.start).sort((a, b) => a.start - b.start);

  if (ongoing.length > 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, type: 'spring' }} className="ongoing-events" style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Happening Now</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '800px' }}>
          <AnimatePresence>
            {ongoing.map(e => (
              <motion.div key={e.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="ongoing-badge" style={{ background: `${e.accent}15`, border: `2px solid ${e.accent}50`, color: e.accent, padding: '12px 24px', borderRadius: '50px', fontWeight: 700, fontSize: '1.5rem', boxShadow: `0 4px 20px ${e.accent}20` }}>
                <span className="relative flex h-3 w-3 inline-flex mr-3" style={{ top: '-2px' }}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: e.accent }} />
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: e.accent }} />
                </span>
                {e.title}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  } else if (upcoming.length > 0) {
    const next = upcoming[0];
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, type: 'spring' }} className="ongoing-events" style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Up Next</h2>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="ongoing-badge" style={{ background: `${next.accent}15`, border: `2px solid ${next.accent}50`, color: next.accent, padding: '12px 24px', borderRadius: '50px', fontWeight: 700, fontSize: '1.5rem', boxShadow: `0 4px 20px ${next.accent}20` }}>
          {next.title}
        </motion.div>
      </motion.div>
    );
  } else {
     return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, type: 'spring' }} className="ongoing-events" style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Hackathon Concluded</h2>
      </motion.div>
    );
  }
};

/* ══════════════════════════════════════════════
   MAIN TIMER PAGE
   ══════════════════════════════════════════════ */

const Timer = () => {
  const ready = true; // Timer is always ready
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
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAFA]" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <section id="hero-section" className="hero-hackathon" aria-label="Hackathon Timer"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* ════ PHASE 1: BACKGROUND REVEAL ════ */}
        <motion.div
          className="hero-grid-fine"
          style={{ x: grid1X, y: grid1Y }}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.6, ease: EASE, delay: ready ? T.grid : 0 }}
          aria-hidden="true"
        />

        <motion.div
          className="hero-grid-coarse"
          style={{ x: grid2X, y: grid2Y }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.7, ease: EASE, delay: ready ? T.grid + 0.1 : 0 }}
          aria-hidden="true"
        />

        <motion.div
          className="hero-mouse-glow"
          style={{ left: glowLeft, top: glowTop }}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: ready ? 0.5 : 0 }}
          aria-hidden="true"
        />

        <div className="hero-gradient-overlay" aria-hidden="true" />

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

        {/* ════ PHASE 2 + 4: CONTENT ════ */}
        <div className="hero-content" style={{ transform: 'translateY(-5vh)' }}>

          <motion.span
            className="hero-top-label"
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: EASE, delay: ready ? T.botTo - 0.1 : 0 }}
            style={{ fontSize: '1.2rem', marginBottom: '2rem' }}
          >
            MLH HACK DAYS - BOT TO AGENT
          </motion.span>

          <h1 className="hero-headline" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.span
              className="hero-headline-agent"
              initial={{ opacity: 0, y: 45 }}
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 45 }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 10,
                mass: 0.8,
                delay: ready ? T.botTo : 0,
              }}
              style={{ fontSize: '6vw', letterSpacing: '-0.02em', WebkitTextStroke: '2px #000' }}
            >
              Hacking Ends In
            </motion.span>
          </h1>



          {/* ── PHASE 5: COUNTDOWN ── */}
          <CountdownTimer ready={ready} />

          {/* ── PHASE 6: ONGOING EVENTS ── */}
          <OngoingEvents />
        </div>
      </section>
    </div>
  );
};

export default Timer;

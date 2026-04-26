import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/integrations/firebase/client';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import MasonryGrid from '@/components/MasonryGrid';
import HeroHackathon from '@/components/HeroHackathon';
import { FloatingNav } from '../components/FloatingNav';
import ProjectsSection from '@/components/public/ProjectsSection';

// --- Types ---
interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

/* ═══════════════════════════════════════
   PHASE 0 – CINEMATIC LOADING SCREEN
   Dark reveal with MLH logo + glow pulse
   ═══════════════════════════════════════ */

const CinematicLoader = memo(({
  onHeroReady,
  onComplete,
}: {
  onHeroReady: () => void;
  onComplete: () => void;
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // At 1.0s: signal hero to start its phased entrance
    const readyTimer = setTimeout(onHeroReady, 1000);
    // At 1.15s: begin wipe-out transition
    const exitTimer = setTimeout(() => setExiting(true), 1150);
    // At 1.75s: fully remove overlay from DOM
    const doneTimer = setTimeout(onComplete, 1750);
    return () => {
      clearTimeout(readyTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onHeroReady, onComplete]);

  return (
    <motion.div
      className="cinematic-loader"
      initial={{ opacity: 1 }}
      animate={exiting ? { opacity: 0, scale: 1.12 } : { opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* Glow pulse behind logo */}
      <motion.div
        className="loader-glow"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* MLH Logo */}
      <motion.img
        src="/mlh.png"
        alt="MLH"
        className="loader-logo"
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
        animate={
          exiting
            ? { opacity: 0, scale: 0.85, filter: 'blur(8px)' }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{
          duration: exiting ? 0.3 : 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Thin bottom line accent */}
      <motion.div
        className="loader-accent-line"
        initial={{ scaleX: 0 }}
        animate={exiting ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
    </motion.div>
  );
});

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

const ModernLoader = memo(() => (
  <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        className="h-[350px] sm:h-[400px] rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.5)',
          border: '2px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </div>
));

const EmptyState = memo(() => (
  <motion.div
    className="flex flex-col items-center justify-center py-20 sm:py-32 text-center px-4"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
  >
    <motion.div
      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-6"
      style={{ background: 'rgba(245, 196, 0, 0.15)', border: '3px solid rgba(245, 196, 0, 0.3)' }}
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#F5C400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </motion.div>
    <h3 className="text-xl sm:text-2xl tracking-tight mb-3" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, color: '#000' }}>
      No agents spotted yet
    </h3>
    <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.5)' }}>
      The hackathon hasn't started yet. Dispatches will appear here automatically.
    </p>
  </motion.div>
));

const ScrollToTopFAB = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 sm:bottom-10 right-6 sm:right-10 z-[100]"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full focus:outline-none"
            style={{ background: '#000', border: '3px solid #000', boxShadow: '3px 3px 0 rgba(245, 196, 0, 0.6)', color: '#fff' }}
            whileHover={{ y: -4, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const LiveFeedHeader = memo(() => (
  <motion.div
    className="flex justify-center items-center gap-3 mb-10 sm:mb-14"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
  >
    <motion.div
      className="h-[2px] sm:w-24"
      style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.1))' }}
      initial={{ width: 0 }}
      whileInView={{ width: 96 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    <div
      className="flex flex-row items-center gap-2.5 px-5 py-2 rounded-full"
      style={{ background: 'rgba(255,255,255,0.7)', border: '2px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', backdropFilter: 'blur(8px)' }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#A3E635' }} />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#65A30D' }} />
      </span>
      <span className="text-xs sm:text-sm uppercase" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, letterSpacing: '0.2em', color: '#000' }}>
        Live Feed
      </span>
    </div>
    <motion.div
      className="h-[2px] sm:w-24"
      style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.1))' }}
      initial={{ width: 0 }}
      whileInView={{ width: 96 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
  </motion.div>
));

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */

const Index = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [heroReady, setHeroReady] = useState(false);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, mass: 0.5 });
  const heroParallaxY = useTransform(smoothProgress, [0, 0.3], [0, -60]);

  const handleHeroReady = useCallback(() => setHeroReady(true), []);
  const handleLoaderComplete = useCallback(() => setShowLoader(false), []);

  useEffect(() => {
    const tweetsRef = query(ref(database, 'approved_tweets'), orderByChild('created_at'), limitToLast(50));
    const unsubscribe = onValue(tweetsRef, (snapshot) => {
      const data: Tweet[] = [];
      snapshot.forEach((childSnapshot) => {
        data.push({ id: childSnapshot.key as string, ...childSnapshot.val() });
      });
      setTweets(data.reverse());
      setLoading(false);
    });
    return () => { unsubscribe(); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* ── Phase 0: Cinematic Loader ── */}
      <AnimatePresence>
        {showLoader && (
          <CinematicLoader onHeroReady={handleHeroReady} onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>

      <FloatingNav />

      <main className="relative z-10">
        <motion.div style={{ y: heroParallaxY }} className="gpu-layer">
          <HeroHackathon ready={heroReady} />
        </motion.div>

        {/* ═══════════════════════════════════════
           SPONSORS SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="sponsors-section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="hack-section-grid" aria-hidden="true" />

          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">🤝 Our Partners</span>
            <h2 className="hack-section-title">Sponsors</h2>
            <p className="hack-section-subtitle">Backed by amazing partners who make this possible</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
            {[
              { name: 'MLH', src: '/mlhsponsor.png', url: 'https://mlh.io' },
              { name: 'Mastra', src: '/mastra.png', url: 'https://mastra.ai' },
              { name: 'Pujo Planner', src: '/pujo.png', url: 'https://pujoplanner.com' },
              { name: 'HackerRank', src: '/hacker.png', url: 'https://hackerrank.com' },
            ].map((sponsor, i) => (
              <a
                key={sponsor.name}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
              <motion.div
                className="flex flex-col items-center justify-center p-6 sm:p-10 bg-white/85 border-2 border-black/5 rounded-3xl backdrop-blur-md cursor-pointer overflow-hidden"
                style={{
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 + i * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 16px 40px rgba(0, 0, 0, 0.1)', scale: 1.02 }}
              >
                <img
                  src={sponsor.src}
                  alt={sponsor.name}
                  style={{
                    width: '100%',
                    maxHeight: '160px',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease, filter 0.3s ease',
                    filter: 'grayscale(10%)',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.filter = 'grayscale(10%)'; e.currentTarget.style.transform = 'scale(1)'; }}
                />
                <span
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#555',
                    fontFamily: "'Poppins', sans-serif",
                    textTransform: 'uppercase',
                  }}
                >
                  {sponsor.name}
                </span>
              </motion.div>
              </a>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
           PRIZES SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="prizes-section">
          {/* Section grid background */}
          <div className="hack-section-grid" aria-hidden="true" />

          {/* Section header */}
          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">🏆 What You Win</span>
            <h2 className="hack-section-title">Prizes</h2>
            <p className="hack-section-subtitle">Build something amazing and walk away with exclusive rewards</p>
          </motion.div>

          {/* Prize cards */}
          <div className="hack-cards-grid">
            <motion.div
              className="hack-card hack-card-featured"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
            >
              <div className="hack-card-icon hack-card-icon-gold">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="6" width="32" height="36" rx="4" fill="#F5C400" opacity="0.2" />
                  <rect x="12" y="10" width="24" height="28" rx="2" fill="#F5C400" opacity="0.4" />
                  <circle cx="24" cy="24" r="6" fill="#F5C400" />
                  <path d="M21 23.5L23 25.5L27 21.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="hack-card-badge">Winners</div>
              <h3 className="hack-card-title">Winner Certificate</h3>
              <p className="hack-card-desc">
                Official certificates recognizing the top executing Participants of the hackathon.
              </p>
              <div className="hack-card-tag-row">
                <span className="hack-pill">📜 Official Cert</span>
                <span className="hack-pill">🏆 Top Participants</span>
              </div>
            </motion.div>

            <motion.div
              className="hack-card hack-card-featured"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
            >
              <div className="hack-card-icon hack-card-icon-gold">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="20" width="32" height="22" rx="4" fill="#F5C400" opacity="0.2" />
                  <rect x="12" y="24" width="24" height="14" rx="2" fill="#F5C400" opacity="0.4" />
                  <path d="M24 6L28 14H20L24 6Z" fill="#F5C400" />
                  <circle cx="24" cy="18" r="6" fill="#F5C400" />
                  <path d="M21 17.5L23 19.5L27 15.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="hack-card-badge">Winners</div>
              <h3 className="hack-card-title">Gemini Swags Kit</h3>
              <p className="hack-card-desc">
                Top Participants will receive surprise goodies from Google.
              </p>
              <div className="hack-card-tag-row">
                <span className="hack-pill">🎁 Exclusive Merch</span>
                <span className="hack-pill">✨ Limited Edition</span>
              </div>
            </motion.div>
          </div>

          {/* Decorative shapes */}
          <div className="hack-section-shapes" aria-hidden="true">
            <svg className="hack-deco hack-deco-1" width="60" height="60" viewBox="0 0 60 60"><polygon points="30,2 37,22 58,22 41,34 48,55 30,42 12,55 19,34 2,22 23,22" fill="#F5C400" opacity="0.2" /></svg>
            <svg className="hack-deco hack-deco-2" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#E73427" strokeWidth="3" opacity="0.15" /></svg>
            <svg className="hack-deco hack-deco-3" width="50" height="20" viewBox="0 0 50 20"><path d="M2 10C8 2 14 18 20 10C26 2 32 18 38 10C44 2 48 14 48 10" stroke="#1D539F" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.15" /></svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════
           OFFERINGS SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="offerings-section">
          <div className="hack-section-grid" aria-hidden="true" />

          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">🎉 What You Get</span>
            <h2 className="hack-section-title">Offerings</h2>
            <p className="hack-section-subtitle">Every participant walks away with something special</p>
          </motion.div>

          <div className="hack-cards-grid">
            {[
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <circle cx="22" cy="22" r="18" fill="#FF9380" opacity="0.2" />
                    <path d="M14 28C14 28 16 22 22 22C28 22 30 28 30 28" stroke="#E73427" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="22" cy="16" r="5" fill="#E73427" opacity="0.3" />
                    <path d="M19 14L22 10L25 14" fill="#E73427" />
                    <rect x="18" y="26" width="8" height="8" rx="2" fill="#E73427" opacity="0.15" />
                  </svg>
                ),
                title: 'Free Food',
                desc: 'Stay fuelled throughout the hackathon with complimentary Lunch for all participants.',
                pills: ['🍕 Free Lunch'],
                accent: '#E73427',
              },
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <rect x="6" y="12" width="32" height="22" rx="4" fill="#1D539F" opacity="0.15" />
                    <rect x="10" y="16" width="24" height="14" rx="2" fill="#1D539F" opacity="0.1" />
                    <path d="M16 22H28M22 18V26" stroke="#1D539F" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="34" cy="10" r="6" fill="#F5C400" opacity="0.3" />
                    <path d="M32 10L34 12L37 8" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                title: 'Free Swags from MLH',
                desc: 'Get official Major League Hacking swags, just for showing up and hacking.',
                pills: ['🎁 MLH Swags', '✨ Surprise Goodies'],
                accent: '#1D539F',
              },
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <rect x="8" y="6" width="28" height="32" rx="3" fill="#F5C400" opacity="0.15" />
                    <rect x="12" y="10" width="20" height="24" rx="1" fill="#F5C400" opacity="0.1" />
                    <circle cx="22" cy="20" r="6" fill="#F5C400" opacity="0.25" />
                    <path d="M19 20L21 22L25 18" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="16" y="30" width="12" height="2" rx="1" fill="#F5C400" opacity="0.4" />
                  </svg>
                ),
                title: 'Participation Certificate',
                desc: 'Every participant receives an official certificate recognising their contribution to the hackathon.',
                pills: ['📜 Official Cert', '🌟 Portfolio-Ready'],
                accent: '#F5C400',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                className="hack-card"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 + idx * 0.12 }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              >
                <div className="hack-card-icon">{item.icon}</div>
                <h3 className="hack-card-title">{item.title}</h3>
                <p className="hack-card-desc">{item.desc}</p>
                <div className="hack-card-tag-row">
                  {item.pills.map((p) => (
                    <span key={p} className="hack-pill">{p}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hack-section-shapes" aria-hidden="true">
            <svg className="hack-deco hack-deco-4" width="80" height="30" viewBox="0 0 80 30"><polyline points="2,28 10,2 18,28 26,2 34,28 42,2 50,28 58,2 66,28 74,2 78,20" stroke="#F5C400" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.12" /></svg>
            <svg className="hack-deco hack-deco-5" width="40" height="40" viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="6" fill="none" stroke="#A3E635" strokeWidth="3" opacity="0.15" transform="rotate(15 20 20)" /></svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════
           SCHEDULE SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="schedule-section">
          <div className="hack-section-grid" aria-hidden="true" />
          
          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">⏱️ Timeline</span>
            <h2 className="hack-section-title">Schedule</h2>
            <p className="hack-section-subtitle">Plan your hackathon day from start to finish</p>
          </motion.div>

          <div className="hack-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {[
              { time: '8:30 AM - 9:30 AM', title: 'Check In', desc: 'Welcome! Get your swags and settle in.', accent: '#1D539F' },
              { time: '9:30 AM', title: 'Hacking Starts', desc: 'Start building your projects.', accent: '#F5C400' },
              { time: '9:30 AM - 3:30 PM', title: 'Best Active Hacker Mini Event', desc: 'Participate and stay active to win exciting rewards.', accent: '#14B8A6' },
              { time: '11:30 AM - 12:00 PM', title: 'HackerRank Mini Event', desc: 'Show off your coding skills in this mini challenge.', accent: '#FF6B6B' },
              { time: '1:00 PM - 2:00 PM', title: 'Lunch', desc: 'Refuel with some amazing food.', accent: '#A3E635' },
              { time: '3:00 PM', title: 'Hacking & Submission Ends', desc: 'Wrap up and submit your projects.', accent: '#FF3B30' },
              { time: '3:00 PM - 3:30 PM', title: 'Judging', desc: 'Present your demos to the judges.', accent: '#8B5CF6' },
              { time: '3:30 PM - 4:30 PM', title: 'Closing Ceremony', desc: 'Winner announcements and final goodbye.', accent: '#FB923C' }
            ].map((evt, idx) => (
              <motion.div
                key={evt.title + idx}
                className="hack-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 + idx * 0.08 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: evt.accent }}
                style={{ borderTop: `4px solid ${evt.accent}` }}
              >
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: evt.accent, marginBottom: '8px' }}>
                  {evt.time}
                </div>
                <h3 className="hack-card-title">{evt.title}</h3>
                <p className="hack-card-desc" style={{ margin: 0 }}>{evt.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="hack-section-shapes" aria-hidden="true">
            <svg className="hack-deco hack-deco-2" width="60" height="60" viewBox="0 0 60 60"><polygon points="30,5 55,50 5,50" fill="none" stroke="#1D539F" strokeWidth="4" opacity="0.15" /></svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════
           ORGANIZERS SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="organizers-section">
          <div className="hack-section-grid" aria-hidden="true" />
          
          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">👋 Meet the Team</span>
            <h2 className="hack-section-title">Organizers</h2>
            <p className="hack-section-subtitle">The people working behind the scenes to make this event possible</p>
          </motion.div>

          <div className="hack-cards-grid">
            {[
              {
                name: 'Aniket',
                role: 'Lead Organizer',
                desc: 'AI ENGINEER , Founder @pujoplanner , Hackathon winner 5x , MLH hackathon winner 3x',
                image: '/aniket.jpeg',
                linkedin: 'https://www.linkedin.com/in/aniketchakrabortydev/',
                website: 'https://www.aniketchakrabortydev.in/',
                accent: '#F5C400',
                featured: true,
              },
              {
                name: 'Rohan',
                role: 'Co-Organizer',
                desc: 'Handles logistics, operations, and technical infrastructure for the event.',
                image: '/rohan.png',
                linkedin: 'https://www.linkedin.com/in/rohan-sinha-0b926225a/',
                website: '',
                accent: '#1D539F',
                featured: false,
              },
              {
                name: 'Saikat',
                role: 'Co-Organizer',
                desc: 'Engages with participants, handles outreach, and manages the community.',
                image: '/saikat.png',
                linkedin: 'https://www.linkedin.com/in/heyysaikat/',
                website: 'https://heyysaikat.in/',
                accent: '#FF6B6B',
                featured: false,
              },
              {
                name: 'Souvik',
                role: 'Co-Organizer',
                desc: 'I’m Souvik Ghosh, a final-year BCA student, organizer of Hackolution and Campus Tank, and a Techno Wiz awardee from IEM Kolkata.',
                image: '/souvik.png',
                linkedin: 'https://www.linkedin.com/in/souvik-ghosh-1bb26a282/',
                website: 'https://www.devsouvik.in/',
                accent: '#8B5CF6',
                featured: false,
              },
              {
                name: 'Subhradeep',
                role: 'Coordinator',
                desc: 'A computer science student from IEM Kolkata Skilled in Python, Java and C++ & Campus Ambassador @ HackerRank ',
                image: '/Subhradeep.jpeg',
                linkedin: 'https://www.linkedin.com/in/subhradeep-roy-chowdhury-715264318/',
                website: '',
                accent: '#22e028ff',
                featured: false,
              },
              {
                name: 'Anirban',
                role: 'Co-Organizer',
                desc: 'Tech enthusiast and Flutter developer building smart solutions, Co-Founder @pujoplanner, 5× Hackathon Winner, 3× MLH Winner',
                image: '/anirban.png',
                linkedin: 'https://www.linkedin.com/in/anirban-das-croundous/',
                website: 'https://www.anirbandasdev.in/',
                accent: '#FB923C',
                featured: false,
              }
            ].map((item, idx) => (
              <motion.div
                key={item.name + idx}
                className={`hack-card ${item.featured ? 'hack-card-featured' : ''}`}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 + idx * 0.12 }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '16px' }}>
                  <div 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: `rgba(${item.accent === '#F5C400' ? '245, 196, 0' : item.accent === '#1D539F' ? '29, 83, 159' : '255, 107, 107'}, 0.15)`,
                      border: `2px solid ${item.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }}
                    />
                  </div>
                  <div>
                    {item.featured && <div className="hack-card-badge" style={{ marginBottom: '6px' }}>Lead</div>}
                    <h3 className="hack-card-title" style={{ margin: 0, fontSize: '1.3rem' }}>{item.name}</h3>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: item.accent, fontWeight: 700 }}>{item.role}</span>
                  </div>
                </div>
                <p className="hack-card-desc">{item.desc}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                  {item.linkedin && (
                    <a href={item.linkedin} target="_blank" rel="noopener noreferrer" className="hack-pill hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center gap-1.5" style={{ textDecoration: 'none', background: 'rgba(10, 102, 194, 0.1)', color: '#0A66C2', border: '1px solid rgba(10, 102, 194, 0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {item.website && (
                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="hack-pill hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center gap-1.5" style={{ textDecoration: 'none', background: 'rgba(0, 0, 0, 0.06)', color: '#333', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                      Website
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hack-section-shapes" aria-hidden="true">
            <svg className="hack-deco hack-deco-1" width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#FF6B6B" strokeWidth="4" opacity="0.15" /></svg>
            <svg className="hack-deco hack-deco-3" width="60" height="60" viewBox="0 0 60 60"><rect x="15" y="15" width="30" height="30" fill="#8B5CF6" opacity="0.1" transform="rotate(45 30 30)" /></svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════
           JUDGES SECTION
           ═══════════════════════════════════════ */}
        <section className="hack-section" id="judges-section">
          <div className="hack-section-grid" aria-hidden="true" />
          
          <motion.div
            className="hack-section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          >
            <span className="hack-section-tag">⚖️ The Panel</span>
            <h2 className="hack-section-title">Judges</h2>
            <p className="hack-section-subtitle">Meet the experts who will evaluate your innovations</p>
          </motion.div>

          <div className="hack-cards-grid">
            {[
              {
                name: 'Souradip Pal',
                role: 'Judge',
                desc: 'AI Engineer focused on building agentic AI systems and real-world automation solutions & 5× hackathon winner.',
                image: '/subra.png',
                linkedin: 'https://www.linkedin.com/in/souradip-pal-codes/',
                accent: '#8B5CF6',
              },
              {
                name: 'Avik Agarwala',
                role: 'Judge',
                desc: 'A recognized pioneer in the field of artificial thought. He insights guide our technical evaluations with precise logic.',
                image: '/avik.png',
                linkedin: 'https://www.linkedin.com/in/avikagarwala/',
                accent: '#1D539F',
              },
              {
                name: 'Aniket Chakraborty',
                role: 'Judge',
                desc: 'AI Engineer, Founder @pujoplanner, 5× Hackathon Winner, 3× MLH Hackathon Winner.',
                image: '/aniket.jpeg',
                linkedin: 'https://www.linkedin.com/in/aniketchakrabortydev/',
                accent: '#F5C400',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.name + idx}
                className="hack-card"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.1 + idx * 0.12 }}
                whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', gap: '16px' }}>
                  <div 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: `rgba(${item.accent === '#8B5CF6' ? '139, 92, 246' : item.accent === '#1D539F' ? '29, 83, 159' : '245, 196, 0'}, 0.15)`,
                      border: `2px solid ${item.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }}
                    />
                  </div>
                  <div>
                    <h3 className="hack-card-title" style={{ margin: 0, fontSize: '1.3rem' }}>{item.name}</h3>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem', color: item.accent, fontWeight: 700 }}>{item.role}</span>
                  </div>
                </div>
                <p className="hack-card-desc">{item.desc}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <a href={item.linkedin} target="_blank" rel="noopener noreferrer" className="hack-pill hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center gap-1.5" style={{ textDecoration: 'none', background: 'rgba(10, 102, 194, 0.1)', color: '#0A66C2', border: '1px solid rgba(10, 102, 194, 0.2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hack-section-shapes" aria-hidden="true">
            <svg className="hack-deco hack-deco-2" width="50" height="50" viewBox="0 0 50 50"><polygon points="25,2 48,40 2,40" fill="none" stroke="#8B5CF6" strokeWidth="3" opacity="0.15" /></svg>
            <svg className="hack-deco hack-deco-4" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#F5C400" strokeWidth="3" opacity="0.12" /></svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════
           PROJECTS SECTION (Dynamic from Firestore)
           ═══════════════════════════════════════ */}
        <ProjectsSection />

        <div id="social-wall-section" className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-16 contain-paint">
          <LiveFeedHeader />
          <div className="min-h-[40vh]">
            {loading ? (
              <ModernLoader />
            ) : (
              <AnimatePresence mode="wait">
                {tweets.length > 0 ? (
                  <motion.div
                    key="tweets-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                  >
                    <MasonryGrid tweets={tweets} />
                  </motion.div>
                ) : (
                  <EmptyState />
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <ScrollToTopFAB />
    </div>
  );
};

export default Index;
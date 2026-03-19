import { useEffect, useState, useMemo, memo } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/integrations/firebase/client';
import MasonryGrid from '@/components/MasonryGrid';
import vercelLogoImg from '@/assets/vercel.png';

// --- Types ---
interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

// --- Icons & Logos ---
const VercelLogo = () => (
  <img 
    src={vercelLogoImg} 
    alt="Vercel Logo" 
    className="h-16 sm:h-18 w-auto object-contain brightness-0 invert transition-transform hover:scale-105" 
  />
);

// --- Sub-Components ---
const Navbar = memo(() => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
    <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <VercelLogo />
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Handbook</a>
        <a href="https://v0.dev" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">v0</a>
        <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">Vercel</a>
      </div>
    </div>
  </nav>
));

const HeroBadge = memo(() => (
  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.08]">
    <span className="flex h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-pulse"></span>
    <span className="text-sm font-medium text-gray-200 tracking-wide">Powered by Vercel</span>
  </div>
));

const CountdownTimer = memo(() => {
  const targetDate = useMemo(() => new Date('2026-04-27T00:00:00').getTime(), []);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 mt-10 pt-8 border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center min-w-[64px] sm:min-w-[80px]">
          <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-white mb-2 tracking-tighter tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all">
            {item.value.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
});

const CTAButton = memo(() => (
  <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
    <a 
      href="#" 
      className="group relative inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 font-semibold text-black bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] tracking-tight text-sm sm:text-base cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <span className="relative z-10 flex items-center gap-2.5">
        Register Now on Luma
        <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
    </a>
  </div>
));

const HeroSection = memo(() => (
  <header className="relative z-10 pt-28 sm:pt-40 pb-12 sm:pb-20 text-center flex flex-col items-center justify-center min-h-[50vh] px-4">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none"></div>
    
    <div className="flex flex-row flex-wrap items-center justify-center gap-4 mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
      <HeroBadge />
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.08]">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <span className="font-semibold tracking-wide text-sm text-gray-200">27th April</span>
      </div>
    </div>

    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 animate-fade-in-up drop-shadow-2xl flex flex-col items-center" style={{ animationDelay: '0.1s' }}>
      <span className="flex flex-wrap justify-center items-baseline gap-2 sm:gap-3 md:gap-4 whitespace-nowrap">
        <span>Zero to</span> 
        <span className="font-pixel text-[1.1em] align-baseline leading-none translate-y-[-0.03em] font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] antialiased-false" style={{ imageRendering: 'pixelated' }}>Agent</span>
      </span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-gray-400 to-gray-600 block mt-2 sm:mt-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl whitespace-normal break-words text-center w-full max-w-[90vw]">
        a worldwide build week
      </span>
    </h1>
    
    <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-4 animate-fade-in-up font-mono px-4" style={{ animationDelay: '0.2s' }}>
      "to go from idea to agent with v0 and Vercel"
    </p>

    <p className="text-xs sm:text-sm text-gray-500/80 w-full max-w-[90vw] md:max-w-none mx-auto mb-2 animate-fade-in-up uppercase tracking-widest font-medium px-4 leading-relaxed whitespace-normal md:whitespace-nowrap" style={{ animationDelay: '0.25s' }}>
      In association with Hackolution &nbsp;&bull;&nbsp; Community host Aniket Chakraborty
    </p>

    <CTAButton />
    <CountdownTimer />
  </header>
));

const ModernLoader = memo(() => (
  <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-[350px] sm:h-[400px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse shadow-xl"></div>
    ))}
  </div>
));

const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center px-4">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
    </div>
    <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-3">No agents spotted yet</h3>
    <p className="text-gray-400 text-xs sm:text-sm max-w-sm leading-relaxed">The build week has just begun. Dispatches will appear here automatically.</p>
  </div>
));

const ScrollToTopFAB = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <div className={`fixed bottom-6 sm:bottom-10 right-6 sm:right-10 z-[100] transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
      <button 
        onClick={scrollToTop}
        className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:border-white/30 focus:outline-none"
        aria-label="Scroll to top"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-70 group-hover:opacity-100 transition-opacity"
        >
          <path d="M12 2L24 22H0L12 2Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
});

// --- Main Component ---

const Index = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query Firebase for last 50 approved tweets ordered by creation time
    const tweetsRef = query(
      ref(database, 'approved_tweets'),
      orderByChild('created_at'),
      limitToLast(50)
    );

    const unsubscribe = onValue(tweetsRef, (snapshot) => {
      const data: Tweet[] = [];
      
      snapshot.forEach((childSnapshot) => {
        data.push({
          id: childSnapshot.key as string,
          ...childSnapshot.val()
        });
      });

      // Reverse to show Newest First (index 0)
      setTweets(data.reverse());
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-white/20 selection:text-white overflow-x-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');
        .font-pixel {
          font-family: 'Pixelify Sans', system-ui, sans-serif;
          font-weight: 700;
        }
        .antialiased-false {
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
      `}</style>
      <Navbar />
      
      <main className="relative z-10">
        <HeroSection />

        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          {/* Live Feed Header */}
          <div className="flex justify-center items-center gap-3 mb-10 sm:mb-14 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="h-px bg-gradient-to-r from-transparent to-white/10 w-12 sm:w-24"></div>
            <div className="flex flex-row items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/10 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] text-gray-300 uppercase">Live Feed</span>
            </div>
            <div className="h-px bg-gradient-to-l from-transparent to-white/10 w-12 sm:w-24"></div>
          </div>

          <div className="transition-all duration-1000 ease-out min-h-[40vh]">
            {loading ? (
              <ModernLoader />
            ) : (
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {tweets.length > 0 ? (
                  <MasonryGrid tweets={tweets} />
                ) : (
                  <EmptyState />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <ScrollToTopFAB />
    </div>
  );
};

export default Index;
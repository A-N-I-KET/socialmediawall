import { useEffect, useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/integrations/firebase/client';
import MasonryGrid from '@/components/MasonryGrid';
import hackolutionLogo from '@/assets/hackolution-logo.png';
import hackolutionBg from '@/assets/hackolution-background.png';

// --- Types ---
interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

// --- Dynamic Styles (Memoized) ---
const GlobalStyles = memo(() => (
  <style>{`
    @keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
    @keyframes flicker { 0%, 100% { opacity: 0.15; } 25% { opacity: 0.1; } 50% { opacity: 0.25; } 75% { opacity: 0.12; } }
    @keyframes float-dust { 0% { transform: translateY(100vh) translateX(-20px); opacity: 0; } 20% { opacity: 0.8; } 80% { opacity: 0.8; } 100% { transform: translateY(-20vh) translateX(20px); opacity: 0; } }
    @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
    @keyframes grain { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-5%, -10%); } 20% { transform: translate(-15%, 5%); } 30% { transform: translate(7%, -25%); } 40% { transform: translate(-5%, 25%); } 50% { transform: translate(-15%, 10%); } 60% { transform: translate(15%, 0%); } 70% { transform: translate(0%, 15%); } 80% { transform: translate(3%, 35%); } 90% { transform: translate(-10%, 10%); } }
    @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    /* Animation for Tumbleweed */
    @keyframes roll-across {
      0% { transform: translateX(-20vw) rotate(0deg); }
      100% { transform: translateX(120vw) rotate(720deg); }
    }
    
    .animate-sway { animation: sway 6s ease-in-out infinite; transform-origin: top center; }
    .animate-flicker { animation: flicker 4s infinite alternate; }
    .animate-marquee { animation: marquee 20s linear infinite; }
    .animate-grain { animation: grain 8s steps(10) infinite; }
    
    .bg-wood-pattern {
      background-color: #3E2723;
      background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px),
                        repeating-linear-gradient(-45deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 10px);
    }
    .rope-texture {
      background: repeating-linear-gradient(90deg, #8B7355 0px, #6B5645 2px, #8B7355 4px);
    }
  `}</style>
));

// --- Sub-Components ---

const Tumbleweed = memo(() => (
  <div 
    className="fixed bottom-[15%] left-0 z-20 pointer-events-none w-24 h-24 opacity-60 animate-[roll-across_25s_linear_infinite]"
    style={{ animationDelay: '2s' }} 
  >
    {/* SVG Tumbleweed Construction */}
    <svg viewBox="0 0 100 100" fill="none" stroke="#6D4C41" strokeWidth="1.5" className="w-full h-full drop-shadow-md">
      {/* Outer messy circles */}
      <path d="M50 10 C 20 10, 10 40, 10 50 C 10 80, 30 90, 50 90 C 80 90, 90 60, 90 50 C 90 20, 70 10, 50 10" strokeDasharray="12 4" />
      <path d="M20 30 Q 50 5 80 30 T 80 70 T 20 70 T 20 30" strokeDasharray="8 6" transform="rotate(45 50 50)" />
      <path d="M30 20 Q 10 50 30 80 T 70 80 T 70 20 T 30 20" strokeDasharray="10 5" transform="rotate(-30 50 50)" />
      {/* Inner messy branches */}
      <path d="M10 50 L 90 50 M 50 10 L 50 90" strokeDasharray="4 8" opacity="0.7" />
      <path d="M20 20 L 80 80 M 80 20 L 20 80" strokeDasharray="3 6" opacity="0.7" />
    </svg>
  </div>
));

const DustLayer = memo(() => {
  const particles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * -30,
  })), []);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full bg-[#FDF5E6] mix-blend-overlay"
          style={{ left: p.left, width: `${p.size}px`, height: `${p.size}px`, animation: `float-dust ${p.duration}s linear infinite`, animationDelay: `${p.delay}s`, opacity: 0.6 }}
        />
      ))}
    </div>
  );
});

const AtmosphericOverlays = memo(() => (
  <>
    <div className="fixed inset-0 bg-[#3E2723] mix-blend-multiply opacity-60 z-10 pointer-events-none" />
    <div className="fixed inset-0 z-30 opacity-20 pointer-events-none mix-blend-overlay overflow-hidden">
      <div className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] animate-grain bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
    </div>
    <div className="fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(10,5,0,0.85)_100%)] pointer-events-none" />
    <div className="fixed inset-0 z-40 bg-[radial-gradient(circle_at_50%_30%,rgba(255,160,50,0.15),transparent_70%)] animate-flicker pointer-events-none mix-blend-screen" />
  </>
));

const HangingSignHeader = memo(() => (
  <header className="relative z-50 text-center mb-12 mt-4">
    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[380px] h-28 flex justify-between px-12 pointer-events-none -z-10">
      <div className="w-2 h-full rope-texture shadow-[2px_0_8px_rgba(0,0,0,0.6)] rounded-sm"></div>
      <div className="w-2 h-full rope-texture shadow-[2px_0_8px_rgba(0,0,0,0.6)] rounded-sm"></div>
    </div>
    <div className="animate-sway inline-block relative group">
      <div className="bg-wood-pattern border-8 border-[#2a1b15] px-14 py-10 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_0_50px_rgba(0,0,0,0.6)] rounded-sm transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_30px_70px_rgba(0,0,0,1),inset_0_0_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-3 left-3 w-8 h-8 border-l-4 border-t-4 border-[#4A4A4A] rounded-tl-lg"></div>
        <div className="absolute top-3 right-3 w-8 h-8 border-r-4 border-t-4 border-[#4A4A4A] rounded-tr-lg"></div>
        <div className="absolute bottom-3 left-3 w-8 h-8 border-l-4 border-b-4 border-[#4A4A4A] rounded-bl-lg"></div>
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-4 border-b-4 border-[#4A4A4A] rounded-br-lg"></div>
        
        <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#1a110d] shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.8)]"></div>
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1a110d] shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.8)]"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-[#1a110d] shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.8)]"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#1a110d] shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.3),2px_2px_4px_rgba(0,0,0,0.8)]"></div>

        <Link to="/">
          <img src={hackolutionLogo} alt="Hackolution 2K26" className="mx-auto max-w-[220px] md:max-w-[300px] drop-shadow-[0_6px_8px_rgba(0,0,0,0.7)] filter sepia-[0.3] brightness-95 contrast-125 hover:brightness-105 transition-all duration-300" />
        </Link>
        <div className="mt-6 mb-4 h-1 bg-gradient-to-r from-transparent via-[#8B4513] to-transparent"></div>
        <h1 className="font-western text-5xl md:text-7xl text-[#ffebcd] tracking-[0.3em] uppercase drop-shadow-[3px_5px_0_rgba(40,20,10,1)] hover:tracking-[0.35em] transition-all duration-300">Social Wall</h1>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-3xl text-[#D2691E]">★</div>
          <span className="font-mono text-[#ffebcd]/70 text-sm tracking-[0.5em] uppercase">Est. 2026</span>
          <div className="text-3xl text-[#D2691E]">★</div>
        </div>
      </div>
    </div>
  </header>
));

const TelegraphLoader = memo(() => (
  <div className="relative max-w-lg mx-auto my-20 p-1">
    <div className="absolute inset-0 bg-[#FDF5E6] rotate-2 shadow-2xl opacity-90 rounded-sm"></div>
    <div className="absolute inset-0 bg-[#FDF5E6] -rotate-1 shadow-2xl opacity-80 rounded-sm"></div>
    <div className="relative z-10 bg-[#FDF5E6] p-10 border-4 border-dashed border-[#8B4513] text-center rounded-sm shadow-[inset_0_0_20px_rgba(139,69,19,0.2)]">
      <div className="flex justify-center gap-4 font-black text-[#8B4513] text-4xl mb-6 animate-pulse">
        <span>•</span><span>•</span><span>•</span><span className="mx-3 tracking-wider">− − −</span><span>•</span><span>•</span><span>•</span>
      </div>
      <h2 className="font-western text-4xl text-[#8B4513] tracking-widest mb-3">TELEGRAPH BUSY</h2>
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#8B4513] to-transparent"></div>
      <p className="font-mono text-sm text-[#5D4037] uppercase tracking-[0.3em] mb-6">Decoding signals from the frontier...</p>
      <div className="mt-6 text-5xl animate-[spin-slow_3s_linear_infinite]">⚙️</div>
    </div>
  </div>
));

const ScrollingTicker = memo(() => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a0f0a] via-[#2a1b15] to-[#1a0f0a] border-t-4 border-[#8B4513] h-14 flex items-center overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
    <div className="whitespace-nowrap animate-marquee flex gap-16 text-[#ffebcd] font-western tracking-[0.2em] text-xl">
      {["BREAKING: HACKERS SPOTTED", "REWARD: 1000 BTC", "SHERIFF WARNS: NO BUGS", "DEPLOYMENT TRAIN AT NOON", "KEEP YOUR API KEYS SAFE"].map((text, i) => (
        <span key={i} className="flex items-center gap-3">
          <span className="text-[#D2691E]">★</span>{text}<span className="text-[#D2691E]">★</span>
        </span>
      ))}
    </div>
  </div>
));

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

      // Reverse to show Newest First (index 0) to trigger sideways animation
      setTweets(data.reverse());
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1a0f0a] overflow-x-hidden text-[#FDF5E6] font-body">
      <GlobalStyles />
      <AtmosphericOverlays />
      <DustLayer />
      
      {/* The Lonely Tumbleweed rolling in the background */}
      <Tumbleweed />

      <div className="relative z-40 pb-20">
        <div className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale-[30%] sepia-[50%]"
          style={{ backgroundImage: `url(${hackolutionBg})` }}
        />

        <div className="container max-w-[100rem] mx-auto px-4 md:px-8 py-8 relative z-10">
          <HangingSignHeader />

          <main className="transition-all duration-1000 ease-out min-h-[60vh]">
            {loading ? (
              <TelegraphLoader />
            ) : (
              <div className="relative animate-in fade-in duration-700">
                <div className="absolute -inset-6 bg-wood-pattern rounded-xl opacity-90 shadow-[0_0_80px_rgba(0,0,0,0.9)] border-8 border-[#5D4037] -z-10"></div>
                
                <div className="bg-[#FDF5E6]/5 backdrop-blur-sm p-8 md:p-10 rounded-lg border-2 border-[#FDF5E6]/20 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] min-h-[50vh]">
                  {tweets.length > 0 ? (
                     <MasonryGrid tweets={tweets} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-70">
                      <div className="text-9xl mb-6 text-[#8B4513] opacity-50 animate-[bounce-subtle_3s_ease-in-out_infinite]">☠</div>
                      <h3 className="font-western text-5xl text-[#FDF5E6] tracking-[0.3em] mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">GHOST TOWN</h3>
                      <div className="h-px w-32 bg-[#8B4513] mb-4"></div>
                      <p className="font-mono uppercase text-sm tracking-[0.4em] text-[#FDF5E6]/60">No bounties posted yet.</p>
                    </div>
                  )}
                </div>
                
                {/* Decorative Screws */}
                {['-top-2 -left-2', '-top-2 -right-2', '-bottom-2 -left-2', '-bottom-2 -right-2'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5 bg-[#1a0f0a] rounded-full border-2 border-[#8B7355] shadow-[0_0_10px_rgba(139,115,85,0.5)]`} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      <ScrollingTicker />
    </div>
  );
};

export default Index;
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '@/integrations/firebase/client';
import MasonryGrid from '@/components/MasonryGrid';
import hackolutionLogo from '@/assets/hackolution-logo.png';
import hackolutionBg from '@/assets/hackolution-background.png';

interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

interface FirebaseTweet {
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

const Index = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTweets = () => {
    const tweetsRef = ref(database, 'approved_tweets');
    onValue(tweetsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tweetsArray = Object.entries(data).map(([id, tweet]: [string, FirebaseTweet]) => ({
          id,
          ...tweet
        })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTweets(tweetsArray);
      } else {
        setTweets([]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: `url(${hackolutionBg})`,
      }}
    >
      {/* Overlay for better readability */}
      <div className="min-h-screen bg-background/70 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <Link to="/">
              <img 
                src={hackolutionLogo} 
                alt="Hackolution 2K26" 
                className="mx-auto max-w-xs md:max-w-md animate-float drop-shadow-2xl"
              />
            </Link>
            <h1 className="font-western text-3xl md:text-4xl text-rust mt-6 text-shadow-western">
              SOCIAL WALL
            </h1>
            <p className="font-body text-muted-foreground mt-2 max-w-lg mx-auto">
              Dispatches from hackers across the frontier. Real-time updates from the telegraph wire.
            </p>
          </header>

          {/* Admin Link */}
          {/* <div className="text-center mb-8">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 font-western text-sm text-primary hover:text-rust transition-colors border-b-2 border-dashed border-primary hover:border-rust"
            >
              🤠 Sheriff's Office (Admin Panel)
            </Link>
          </div> */}

          {/* Tweet Gallery */}
          <main>
            {loading ? (
              <div className="wanted-poster max-w-md mx-auto p-8 text-center">
                <div className="animate-pulse">
                  <p className="font-western text-xl text-rust">
                    Gathering dispatches...
                  </p>
                  <p className="font-body text-muted-foreground mt-2">
                    Hold your horses, partner!
                  </p>
                </div>
              </div>
            ) : (
              <MasonryGrid tweets={tweets} />
            )}
          </main>

          {/* Footer */}
          <footer className="text-center mt-16 pb-8">
            <div className="font-western text-sm text-muted-foreground">
              ★ ★ ★ HACKOLUTION 2K26 ★ ★ ★
            </div>
            <p className="font-body text-xs text-muted-foreground mt-2">
              Where Code Meets the Wild West
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
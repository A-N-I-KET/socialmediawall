import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, database } from '@/integrations/firebase/client';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import AuthForm from '@/components/AuthForm';
import AddTweetForm from '@/components/AddTweetForm';
import AdminTweetList from '@/components/AdminTweetList';
import hackolutionLogo from '@/assets/hackolution-logo.png';
import hackolutionBg from '@/assets/hackolution-background.png';
import { toast } from '@/hooks/use-toast';

interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchTweets();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTweets = () => {
    const tweetsRef = ref(database, 'approved_tweets');
    const tweetsQuery = query(tweetsRef, orderByChild('created_at'));

    const unsubscribe = onValue(tweetsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tweetsArray = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        })).reverse(); // Reverse to show newest first
        setTweets(tweetsArray);
      } else {
        setTweets([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    toast({
      title: "Ride off into the sunset!",
      description: "You've logged out successfully.",
    });
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: `url(${hackolutionBg})`,
      }}
    >
      {/* Overlay */}
      <div className="min-h-screen bg-leather/90 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <Link to="/">
              <img 
                src={hackolutionLogo} 
                alt="Hackolution 2K26" 
                className="mx-auto max-w-[200px] drop-shadow-2xl"
              />
            </Link>
            <h1 className="font-western text-2xl md:text-3xl text-gold mt-4 text-shadow-western">
              SHERIFF'S OFFICE
            </h1>
            <p className="font-body text-cream/80 mt-2">
              Admin Control Panel
            </p>
          </header>

          {/* Back Link */}
          <div className="text-center mb-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 font-body text-sm text-cream hover:text-gold transition-colors"
            >
              ← Back to Social Wall
            </Link>
          </div>

          {/* Main Content */}
          {!user ? (
            <AuthForm onSuccess={() => {}} />
          ) : (
            <div className="space-y-8">
              {/* User Info & Logout */}
              <div className="wanted-poster p-4 flex items-center justify-between">
                <div>
                  <p className="font-western text-sm text-rust">Logged in as:</p>
                  <p className="font-body text-sm text-foreground truncate max-w-[200px] md:max-w-none">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="font-western text-xs text-destructive hover:text-destructive/80 transition-colors border border-destructive/30 px-3 py-2 rounded-sm hover:bg-destructive/10"
                >
                  Hang Up Badge
                </button>
              </div>

              {/* Add Tweet Form */}
              <div className="wanted-poster p-6">
                <h2 className="font-western text-xl text-rust mb-4 text-center border-b-2 border-leather pb-3">
                  POST NEW DISPATCH
                </h2>
                <AddTweetForm onSuccess={fetchTweets} />
              </div>

              {/* Tweet List */}
              <div className="wanted-poster p-6">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="font-body text-muted-foreground animate-pulse">
                      Loading dispatches...
                    </p>
                  </div>
                ) : (
                  <AdminTweetList tweets={tweets} onDelete={fetchTweets} />
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="text-center mt-12 pb-8">
            <div className="font-western text-sm text-cream/60">
              ★ HACKOLUTION 2K26 - ADMIN ★
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Admin;
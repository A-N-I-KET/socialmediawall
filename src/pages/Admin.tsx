import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, database } from '@/integrations/firebase/client';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import AuthForm from '@/components/AuthForm';
import AddTweetForm from '@/components/AddTweetForm';
import AdminTweetList from '@/components/AdminTweetList';
import ParticipantsManager from '@/components/admin/ParticipantsManager';
import ProjectsManager from '@/components/admin/ProjectsManager';
import SubmissionToggle from '@/components/admin/SubmissionToggle';
import ProjectSectionToggle from '@/components/admin/ProjectSectionToggle';
import ExportData from '@/components/admin/ExportData';
import { toast } from '@/hooks/use-toast';

interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

type AdminTab = 'dispatches' | 'participants' | 'projects' | 'settings';

const TAB_CONFIG: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'dispatches', label: 'Dispatches', icon: '📡' },
  { id: 'participants', label: 'Participants', icon: '👥' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dispatches');

  useEffect(() => {
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
        const tweetsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Tweet, 'id'>)
        })).reverse();
        setTweets(tweetsArray as Tweet[]);
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
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <div className="container max-w-5xl mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Manage your social wall dispatches
          </p>
        </header>

        <div className="text-center mb-8">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Social Wall
          </Link>
        </div>

        {!user ? (
          <AuthForm onSuccess={() => {}} />
        ) : (
          <div className="space-y-6">
            <div className="glass-panel p-6 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Logged in as</p>
                <p className="text-sm text-gray-200 truncate max-w-[200px] md:max-w-none font-mono">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors border border-red-900/50 px-4 py-2 rounded-md hover:bg-red-950/30"
              >
                Sign Out
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'dispatches' && (
              <div className="space-y-6">
                <div className="glass-panel p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">
                    Post New Dispatch
                  </h2>
                  <AddTweetForm onSuccess={fetchTweets} />
                </div>

                <div className="glass-panel p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 animate-pulse text-sm">
                        Loading dispatches...
                      </p>
                    </div>
                  ) : (
                    <AdminTweetList tweets={tweets} onDelete={fetchTweets} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'participants' && <ParticipantsManager />}
            {activeTab === 'projects' && <ProjectsManager />}

            {activeTab === 'settings' && (
              <div className="glass-panel p-6 md:p-8 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Settings</h3>
                <SubmissionToggle />
                <ProjectSectionToggle />
                <div className="border-t border-white/10 pt-4 mt-4">
                  <ExportData />
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="text-center mt-16 pb-8 border-t border-white/10 pt-8">
          <div className="text-xs text-gray-600 font-mono tracking-widest uppercase">
            Zero to Agent © 2026 Admin
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Admin;
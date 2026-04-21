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

const TAB_CONFIG: { id: AdminTab; label: string; icon: string; description: string }[] = [
  { id: 'dispatches', label: 'Dispatches', icon: '📡', description: 'Social wall posts' },
  { id: 'participants', label: 'Participants', icon: '👥', description: 'Manage team members' },
  { id: 'projects', label: 'Projects', icon: '🚀', description: 'Review submissions' },
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Controls & export' },
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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/20">
      {/* Subtle gradient background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at top, rgba(245, 196, 0, 0.04) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Site
            </Link>
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-mono">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/30 border border-transparent hover:border-red-900/50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <div className="flex items-end gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3" style={{ background: 'rgba(245, 196, 0, 0.1)', color: '#F5C400', border: '1px solid rgba(245, 196, 0, 0.2)' }}>
                ⚡ Admin Console
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Mission Control
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your hackathon — participants, projects, and settings
              </p>
            </div>
          </div>
        </header>

        {!user ? (
          <AuthForm onSuccess={() => {}} />
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <nav
              className="flex gap-1 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <div className="text-left">
                    <span className="block">{tab.label}</span>
                    {activeTab === tab.id && (
                      <span className="block text-[10px] text-gray-400 font-normal">{tab.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </nav>

            {/* Active indicator line */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'dispatches' && (
                <div className="space-y-6">
                  <div
                    className="rounded-2xl p-6 md:p-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <span className="text-lg">📡</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">Post New Dispatch</h2>
                        <p className="text-xs text-gray-500">Add tweets to the social wall</p>
                      </div>
                    </div>
                    <AddTweetForm onSuccess={fetchTweets} />
                  </div>

                  <div
                    className="rounded-2xl p-6 md:p-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
                        <p className="text-gray-500 animate-pulse text-sm mt-3">Loading dispatches...</p>
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
                <div className="space-y-6">
                  {/* Toggles Section */}
                  <div
                    className="rounded-2xl p-6 md:p-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-500/20">
                        <span className="text-lg">🎛️</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">Controls</h2>
                        <p className="text-xs text-gray-500">Toggle submissions and public visibility</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <SubmissionToggle />
                      <ProjectSectionToggle />
                    </div>
                  </div>

                  {/* Export Section */}
                  <div
                    className="rounded-2xl p-6 md:p-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                        <span className="text-lg">📊</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">Data Export</h2>
                        <p className="text-xs text-gray-500">Download hackathon data as Excel</p>
                      </div>
                    </div>
                    <ExportData />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="text-center mt-20 pb-8 border-t border-white/5 pt-8">
          <div className="text-[10px] text-gray-700 font-mono tracking-widest uppercase">
            Bot to Agent © 2026 • Admin Console
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Admin;
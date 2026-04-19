import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useParticipant } from '@/contexts/ParticipantContext';
import { getParticipantByEmail, getProjectByEmail, getSubmissionSettings } from '@/utils/firestoreHelpers';
import type { Project } from '@/utils/firestoreHelpers';
import ProjectSubmissionForm from '@/components/participant/ProjectSubmissionForm';
import ProjectReadOnlyView from '@/components/participant/ProjectReadOnlyView';
import { motion } from 'framer-motion';

const ParticipantSubmission = () => {
  const { participantEmail, isLoggedIn, logout } = useParticipant();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submittedProject, setSubmittedProject] = useState<Project | null>(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/participant-login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [participant, project, settings] = await Promise.all([
          getParticipantByEmail(participantEmail!),
          getProjectByEmail(participantEmail!),
          getSubmissionSettings(),
        ]);

        if (!participant) {
          // Invalid session — participant no longer exists
          logout();
          navigate('/participant-login');
          return;
        }

        setSubmissionsOpen(settings.submissionsOpen);

        if (participant.projectSubmitted && project) {
          setSubmittedProject(project);
        }
      } catch (error) {
        console.error('Error loading submission page:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, participantEmail, navigate, logout]);

  const handleSubmitted = async () => {
    // Reload the project after submission
    if (participantEmail) {
      const project = await getProjectByEmail(participantEmail);
      if (project) {
        setSubmittedProject(project);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isLoggedIn) return null;

  return (
    <div
      className="min-h-screen px-4 py-8 md:py-12 relative"
      style={{ background: 'var(--hack-cream)', fontFamily: "'Inter', 'Poppins', sans-serif" }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(245, 196, 0, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 196, 0, 0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header bar */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back to homepage
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono hidden md:block">{participantEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="rounded-2xl p-6 md:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '2px solid rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-4">Loading your submission…</p>
            </div>
          ) : submittedProject ? (
            <ProjectReadOnlyView project={submittedProject} />
          ) : !submissionsOpen ? (
            <div className="text-center py-16">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                style={{ background: 'rgba(255, 59, 48, 0.1)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Submissions Closed
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Project submissions are currently closed. Please check back later or contact the organizers.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'rgba(245, 196, 0, 0.15)', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.3)' }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  🚀 Bot to Agent
                </motion.div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Submit Your Project
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Fill in the details below to submit your hackathon project. You can only submit once.
                </p>
              </div>
              <ProjectSubmissionForm
                participantEmail={participantEmail!}
                onSubmitted={handleSubmitted}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ParticipantSubmission;

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useParticipant } from '@/contexts/ParticipantContext';
import { getParticipantByEmail, getProjectByEmail, getSubmissionSettings } from '@/utils/firestoreHelpers';
import type { Project } from '@/utils/firestoreHelpers';
import ProjectSubmissionForm from '@/components/participant/ProjectSubmissionForm';
import ProjectReadOnlyView from '@/components/participant/ProjectReadOnlyView';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ParticipantSubmission = () => {
  const { participantEmail, isLoggedIn, logout } = useParticipant();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submittedProject, setSubmittedProject] = useState<Project | null>(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFirstSubmission, setIsFirstSubmission] = useState(true);

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
          logout();
          navigate('/participant-login');
          return;
        }

        setSubmissionsOpen(settings.submissionsOpen);

        if (participant.projectSubmitted && project) {
          setSubmittedProject(project);
          setIsFirstSubmission(false);
        }
      } catch (error) {
        console.error('Error loading submission page:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, participantEmail, navigate, logout]);

  const fireCelebration = useCallback(() => {
    // Fire confetti from left
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.15, y: 0.6 },
      colors: ['#F5C400', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F093FB', '#FFF'],
    });
    // Fire confetti from right
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.85, y: 0.6 },
        colors: ['#F5C400', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F093FB', '#FFF'],
      });
    }, 200);
    // Big burst from center
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 120,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#F5C400', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F093FB', '#FFF'],
        startVelocity: 35,
      });
    }, 500);
  }, []);

  const handleSubmitted = async () => {
    if (participantEmail) {
      const project = await getProjectByEmail(participantEmail);
      if (project) {
        // Check if this was a first-time submission (not an edit)
        if (isFirstSubmission) {
          setShowCelebration(true);
          fireCelebration();
          setIsFirstSubmission(false);
        }
        setSubmittedProject(project);
        setIsEditing(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isLoggedIn) return null;

  const showReadOnly = submittedProject && !isEditing && !showCelebration;
  const showEditForm = submittedProject && isEditing && submissionsOpen;
  const showNewForm = !submittedProject && submissionsOpen;
  const showClosed = !submittedProject && !submissionsOpen;

  return (
    <div
      className="min-h-screen px-4 py-8 md:py-12 relative"
      style={{ background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF9E5 50%, #FFF5D6 100%)', fontFamily: "'Inter', 'Poppins', sans-serif" }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(245, 196, 0, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 196, 0, 0.06) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Decorative blobs */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(245, 196, 0, 0.06) 0%, transparent 35%), radial-gradient(circle at 10% 90%, rgba(29, 83, 159, 0.04) 0%, transparent 30%)',
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
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to homepage
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500 font-mono">{participantEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="rounded-3xl p-6 md:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        >
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-10 h-10 border-3 border-gray-200 border-t-[#F5C400] rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-4">Loading your submission…</p>
            </div>

          ) : showCelebration ? (
            /* 🎉 CELEBRATION SCREEN */
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            >
              <motion.div
                className="text-7xl mb-6"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              >
                🎉
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                style={{ fontFamily: "'Poppins', sans-serif", background: 'linear-gradient(135deg, #000 0%, #333 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Congratulations!
              </motion.h2>
              <motion.p
                className="text-gray-500 text-sm max-w-sm mx-auto mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Your project has been submitted successfully!
              </motion.p>
              <motion.p
                className="text-gray-400 text-xs max-w-sm mx-auto mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Great work, hacker! Your project is now live and visible to the judges. 🚀
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={() => setShowCelebration(false)}
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={{
                    background: '#000',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
                  }}
                >
                  View Your Submission →
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  Back to Homepage
                </Link>
              </motion.div>
            </motion.div>

          ) : showReadOnly ? (
            <>
              <ProjectReadOnlyView project={submittedProject!} />
              {submissionsOpen && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                    style={{
                      background: '#000',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
                    }}
                  >
                    ✏️ Edit Your Submission
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    You can edit your project while submissions are open.
                  </p>
                </div>
              )}
              {!submissionsOpen && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Submissions are closed. Your project can no longer be edited.
                  </p>
                </div>
              )}
            </>

          ) : showEditForm ? (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#1D539F', border: '1px solid rgba(59, 130, 246, 0.15)' }}
                  >
                    ✏️ Edit Mode
                  </motion.div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    ← Cancel
                  </button>
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Edit Your Project
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Update your project details. Changes will overwrite your previous submission.
                </p>
              </div>
              <ProjectSubmissionForm
                participantEmail={participantEmail!}
                onSubmitted={handleSubmitted}
                existingProject={submittedProject}
              />
            </>

          ) : showClosed ? (
            <div className="text-center py-20">
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                style={{ background: 'rgba(255, 59, 48, 0.06)', border: '1px solid rgba(255, 59, 48, 0.1)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Submissions Closed
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Project submissions are currently closed. Please check back later or contact the organizers.
              </p>
            </div>

          ) : showNewForm ? (
            <>
              <div className="mb-8">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(245, 196, 0, 0.15), rgba(245, 196, 0, 0.05))', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.25)' }}
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
                  Fill in the details below to submit your hackathon project.
                </p>
              </div>
              <ProjectSubmissionForm
                participantEmail={participantEmail!}
                onSubmitted={handleSubmitted}
              />
            </>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

export default ParticipantSubmission;

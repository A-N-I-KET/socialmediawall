import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '@/utils/firestoreHelpers';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectDetailModal = ({ project, onClose }: ProjectDetailModalProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [project]);

  if (!project) return null;

  const getWinnerBadge = () => {
    switch (project.winner) {
      case '1st': return { label: '🥇 1st Place Winner', color: '#F5C400', bg: 'rgba(245, 196, 0, 0.12)' };
      case '1st_runner_up': return { label: '🥈 1st Runner Up', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.12)' };
      case '2nd_runner_up': return { label: '🥉 2nd Runner Up', color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.12)' };
      case '3rd_runner_up': return { label: '🏅 3rd Runner Up', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      default: return null;
    }
  };

  const winnerBadge = getWinnerBadge();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-12 md:pt-20 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl rounded-2xl overflow-hidden mb-12"
          style={{
            background: 'rgba(253, 251, 247, 0.98)',
            border: '2px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
          }}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Image Gallery */}
          {project.projectImages?.length > 0 && (
            <div className="relative">
              <div className="aspect-video overflow-hidden">
                <img
                  src={project.projectImages[activeImageIndex]}
                  alt={`${project.projectName} screenshot ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {project.projectImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
                  {project.projectImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeImageIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Thumbnails strip */}
              {project.projectImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-white/50">
                  {project.projectImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === activeImageIndex ? 'border-[#F5C400]' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Title & Badge */}
            <div>
              {winnerBadge && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
                  style={{ background: winnerBadge.bg, color: winnerBadge.color, border: `1.5px solid ${winnerBadge.color}30` }}
                >
                  {winnerBadge.label}
                </span>
              )}
              <h2
                className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {project.projectName}
              </h2>
              <p className="text-gray-500 mt-2 text-sm">{project.shortDescription}</p>
              <p className="text-gray-400 text-xs mt-2">by {project.participantName || project.participantEmail}</p>
            </div>

            {/* Links */}
            {project.projectLinks?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.projectLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md"
                    style={{ background: 'rgba(29, 83, 159, 0.08)', color: '#1D539F', border: '1px solid rgba(29, 83, 159, 0.15)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {link.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                ))}
              </div>
            )}

            {/* Technologies */}
            {project.technologiesUsed?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.technologiesUsed.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(245, 196, 0, 0.12)', color: 'rgba(0,0,0,0.6)', border: '1px solid rgba(245, 196, 0, 0.2)' }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Problem It Solves */}
            {project.problemItSolves && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">💡 Problem It Solves</h3>
                <div className="px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 prose prose-sm max-w-none">
                  <ReactMarkdown>{project.problemItSolves}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Challenges */}
            {project.challengesRanInto && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">🧗 Challenges I Ran Into</h3>
                <div className="px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 prose prose-sm max-w-none">
                  <ReactMarkdown>{project.challengesRanInto}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectDetailModal;

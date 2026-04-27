import { motion } from 'framer-motion';
import type { Project } from '@/utils/firestoreHelpers';

interface WinnersPodiumProps {
  projects: Project[];
  onViewDetails: (project: Project) => void;
}

const WINNER_CONFIG = {
  '1st': {
    label: '1st Place',
    emoji: '🥇',
    accentColor: '#F5C400',
    accentBg: 'rgba(245, 196, 0, 0.08)',
    borderColor: 'rgba(245, 196, 0, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,196,0,0.06) 100%)',
    order: 0,
  },
  '1st_runner_up': {
    label: '1st Runner Up',
    emoji: '🥈',
    accentColor: '#9CA3AF',
    accentBg: 'rgba(156, 163, 175, 0.08)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(156,163,175,0.06) 100%)',
    order: 1,
  },
  '2nd_runner_up': {
    label: '2nd Runner Up',
    emoji: '🥉',
    accentColor: '#CD7F32',
    accentBg: 'rgba(205, 127, 50, 0.08)',
    borderColor: 'rgba(205, 127, 50, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(205,127,50,0.06) 100%)',
    order: 2,
  },
  '3rd_runner_up': {
    label: '3rd Runner Up',
    emoji: '🏅',
    accentColor: '#8B5CF6',
    accentBg: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(139,92,246,0.06) 100%)',
    order: 3,
  },
};

const WinnersPodium = ({ projects, onViewDetails }: WinnersPodiumProps) => {
  const winners = projects
    .filter((p) => p.winner && WINNER_CONFIG[p.winner as keyof typeof WINNER_CONFIG])
    .sort((a, b) => {
      const configA = WINNER_CONFIG[a.winner as keyof typeof WINNER_CONFIG];
      const configB = WINNER_CONFIG[b.winner as keyof typeof WINNER_CONFIG];
      return configA.order - configB.order;
    });

  if (winners.length === 0) return null;

  return (
    <div className="mb-16">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      >
        <span className="hack-section-tag">🏆 Winners</span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
        {winners.map((project, idx) => {
          const config = WINNER_CONFIG[project.winner as keyof typeof WINNER_CONFIG];
          return (
            <motion.div
              key={project.participantEmail}
              className="rounded-2xl p-6 cursor-pointer group"
              style={{
                background: config.gradient,
                border: `2.5px solid ${config.borderColor}`,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, delay: idx * 0.1 }}
              whileHover={{ y: -8, boxShadow: `0 20px 50px rgba(0,0,0,0.1)` }}
              onClick={() => onViewDetails(project)}
            >
              {/* Winner badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                style={{ background: config.accentBg, color: config.accentColor, border: `1.5px solid ${config.borderColor}` }}
              >
                {config.emoji} {config.label}
              </div>

              {/* Thumbnail */}
              {project.projectImages?.length > 0 && (
                <div className="rounded-xl overflow-hidden mb-4 border border-gray-100" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={project.projectImages[0]}
                    alt={project.projectName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Project name */}
              <h3
                className="text-lg font-bold text-gray-900 mb-1 tracking-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {project.projectName}
              </h3>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{project.shortDescription}</p>
              <p className="text-xs text-gray-400 mb-3">{project.participantName || project.participantEmail}</p>

              {/* Tech tags */}
              {project.technologiesUsed?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.technologiesUsed.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.6rem] font-semibold"
                      style={{ background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.5)' }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WinnersPodium;

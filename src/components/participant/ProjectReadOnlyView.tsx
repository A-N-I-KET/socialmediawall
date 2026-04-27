import ReactMarkdown from 'react-markdown';
import type { Project } from '@/utils/firestoreHelpers';

interface ProjectReadOnlyViewProps {
  project: Project;
}

const ProjectReadOnlyView = ({ project }: ProjectReadOnlyViewProps) => {
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        {winnerBadge && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
            style={{ background: winnerBadge.bg, color: winnerBadge.color, border: `1.5px solid ${winnerBadge.color}30` }}
          >
            {winnerBadge.label}
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{project.projectName}</h2>
        <p className="text-gray-500 mt-2 text-sm">{project.shortDescription}</p>
        <p className="text-gray-400 text-xs mt-2">Submitted by {project.participantName || project.participantEmail}</p>
      </div>

      {/* Success Banner */}
      <div
        className="px-5 py-4 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(163, 230, 53, 0.1)', border: '1.5px solid rgba(163, 230, 53, 0.3)' }}
      >
        <span className="text-lg">✅</span>
        <div>
          <p className="text-sm font-semibold text-green-800">Project Submitted Successfully</p>
          <p className="text-xs text-green-700/70 mt-0.5">Your project has been recorded. You cannot modify it after submission.</p>
        </div>
      </div>

      {/* Project Links */}
      {project.projectLinks?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🔗 Project Links</h3>
          <div className="flex flex-wrap gap-2">
            {project.projectLinks.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
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
        </div>
      )}

      {/* Technologies */}
      {project.technologiesUsed?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🛠️ Technologies Used</h3>
          <div className="flex flex-wrap gap-2">
            {project.technologiesUsed.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(245, 196, 0, 0.15)', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.3)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Problem It Solves */}
      {project.problemItSolves && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">💡 Problem It Solves</h3>
          <div className="px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 prose prose-sm max-w-none">
            <ReactMarkdown>{project.problemItSolves}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Challenges */}
      {project.challengesRanInto && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🧗 Challenges I Ran Into</h3>
          <div className="px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 prose prose-sm max-w-none">
            <ReactMarkdown>{project.challengesRanInto}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Images */}
      {project.projectImages?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">📸 Project Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {project.projectImages.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`${project.projectName} screenshot ${i + 1}`}
                  className="w-full rounded-xl object-cover border-2 border-gray-100 hover:border-[#F5C400] transition-colors cursor-pointer aspect-video"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReadOnlyView;

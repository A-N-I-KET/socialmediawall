import { motion } from 'framer-motion';
import type { Project } from '@/utils/firestoreHelpers';

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
}

const ProjectCard = ({ project, onViewDetails }: ProjectCardProps) => {
  return (
    <motion.div
      className="hack-card group cursor-pointer"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
      onClick={() => onViewDetails(project)}
    >
      {/* Thumbnail Placeholder */}
      {project.projectImages?.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4 border border-gray-100 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors" style={{ aspectRatio: '21/9' }}>
          <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">Click to View Media</span>
          </div>
        </div>
      )}

      {/* Content */}
      <h3 className="hack-card-title" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
        {project.projectName}
      </h3>
      <p className="hack-card-desc" style={{ marginBottom: '12px', fontSize: '0.82rem' }}>
        {project.shortDescription}
      </p>

      {/* Tech tags */}
      {project.technologiesUsed?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.technologiesUsed.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-semibold"
              style={{ background: 'rgba(245, 196, 0, 0.12)', color: 'rgba(0,0,0,0.6)', border: '1px solid rgba(245, 196, 0, 0.2)' }}
            >
              {tech}
            </span>
          ))}
          {project.technologiesUsed.length > 5 && (
            <span className="text-[0.65rem] text-gray-400 self-center">+{project.technologiesUsed.length - 5}</span>
          )}
        </div>
      )}

      {/* View details link */}
      <div className="flex items-center gap-1 text-xs font-semibold text-[#1D539F] group-hover:text-[#1D539F]/80 transition-colors mt-2">
        View Details
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
};

export default ProjectCard;

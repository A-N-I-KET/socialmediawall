import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProjects, getSubmissionSettings, type Project } from '@/utils/firestoreHelpers';
import ProjectCard from './ProjectCard';
import WinnersPodium from './WinnersPodium';
import ProjectDetailModal from './ProjectDetailModal';

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, allProjects] = await Promise.all([
          getSubmissionSettings(),
          getProjects(),
        ]);
        setVisible(settings.projectsSectionVisible);
        setProjects(allProjects);
      } catch (error) {
        console.error('Failed to load projects section:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Don't render anything if not visible or still loading
  if (loading || !visible) return null;
  if (projects.length === 0) return null;

  const nonWinnerProjects = projects.filter((p) => !p.winner);

  return (
    <section className="hack-section" id="projects-section">
      <div className="hack-section-grid" aria-hidden="true" />

      <motion.div
        className="hack-section-header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      >
        <span className="hack-section-tag">🚀 What Was Built</span>
        <h2 className="hack-section-title">Projects</h2>
        <p className="hack-section-subtitle">Check out the amazing projects built during the hackathon</p>
      </motion.div>

      {/* Winners Podium */}
      <WinnersPodium projects={projects} onViewDetails={setSelectedProject} />

      {/* All Projects Grid */}
      {nonWinnerProjects.length > 0 && (
        <div className="hack-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {nonWinnerProjects.map((project) => (
            <ProjectCard
              key={project.participantEmail}
              project={project}
              onViewDetails={setSelectedProject}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Decorative shapes */}
      <div className="hack-section-shapes" aria-hidden="true">
        <svg className="hack-deco hack-deco-1" width="60" height="60" viewBox="0 0 60 60">
          <polygon points="30,2 37,22 58,22 41,34 48,55 30,42 12,55 19,34 2,22 23,22" fill="#F5C400" opacity="0.15" />
        </svg>
        <svg className="hack-deco hack-deco-2" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#8B5CF6" strokeWidth="3" opacity="0.12" />
        </svg>
      </div>
    </section>
  );
};

export default ProjectsSection;

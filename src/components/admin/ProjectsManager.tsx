import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  getProjects,
  deleteProject,
  updateProject,
  type Project,
} from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';
import WinnerSelector from './WinnerSelector';

const ProjectsManager = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load projects.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete project by ${email}? This will also reset their submission status.`)) return;
    try {
      await deleteProject(email);
      toast({ title: 'Deleted', description: `Project by ${email} has been removed.` });
      setViewingProject(null);
      await fetchProjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete project.', variant: 'destructive' });
    }
  };

  const toggleReviewed = async (project: Project) => {
    const newValue = !project.reviewed;
    try {
      await updateProject(project.participantEmail, { reviewed: newValue });
      toast({ title: newValue ? 'Marked as Reviewed ✅' : 'Marked as Unreviewed', description: project.projectName });
      // Update local state
      setProjects((prev) =>
        prev.map((p) => p.participantEmail === project.participantEmail ? { ...p, reviewed: newValue } : p)
      );
      if (viewingProject?.participantEmail === project.participantEmail) {
        setViewingProject({ ...project, reviewed: newValue });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update review status.', variant: 'destructive' });
    }
  };

  const openEditModal = (project: Project) => {
    setViewingProject(null);
    setEditingProject(project);
    setEditForm({
      projectName: project.projectName,
      shortDescription: project.shortDescription,
      projectLinks: project.projectLinks,
      problemItSolves: project.problemItSolves,
      challengesRanInto: project.challengesRanInto,
      technologiesUsed: project.technologiesUsed,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProject) return;
    setSaving(true);
    try {
      await updateProject(editingProject.participantEmail, editForm);
      toast({ title: 'Saved', description: 'Project has been updated.' });
      setEditingProject(null);
      await fetchProjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getWinnerLabel = (winner: string) => {
    switch (winner) {
      case '1st': return '🥇 1st Place';
      case '1st_runner_up': return '🥈 1st Runner Up';
      case '2nd_runner_up': return '🥉 2nd Runner Up';
      default: return '';
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const reviewedCount = projects.filter((p) => p.reviewed).length;

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Submitted Projects ({projects.length})
          </h3>
          {projects.length > 0 && (
            <span className="text-xs text-gray-500">
              {reviewedCount}/{projects.length} reviewed
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse py-4">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className be="text-gray-500 text-sm py-4">No projects submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.participantEmail}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setViewingProject(p)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Reviewed indicator */}
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] flex-shrink-0 ${
                          p.reviewed
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-gray-600 border border-white/10'
                        }`}
                      >
                        {p.reviewed ? '✓' : ''}
                      </span>
                      <h4 className="text-white font-semibold text-sm truncate">{p.projectName}</h4>
                      {p.winner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-medium whitespace-nowrap">
                          {getWinnerLabel(p.winner)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs truncate ml-7">
                      {p.participantName || p.participantEmail}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 ml-7 line-clamp-1">{p.shortDescription}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-7 md:ml-0" onClick={(e) => e.stopPropagation()}>
                    <WinnerSelector
                      email={p.participantEmail}
                      currentWinner={p.winner}
                      onUpdate={fetchProjects}
                    />
                    <button
                      onClick={() => toggleReviewed(p)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                        p.reviewed
                          ? 'text-green-400 border border-green-900/50 hover:bg-green-950/30'
                          : 'text-gray-500 border border-white/10 hover:bg-white/5 hover:text-gray-300'
                      }`}
                    >
                      {p.reviewed ? '✅ Reviewed' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
         VIEW PROJECT MODAL
         ═══════════════════════════════════════ */}
      {viewingProject && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-8 md:pt-16 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden mb-12"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {/* Close button */}
            <button
              onClick={() => setViewingProject(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image Gallery */}
            {viewingProject.projectImages?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {viewingProject.projectImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full aspect-video object-cover hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  {viewingProject.reviewed && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
                      ✅ Reviewed
                    </span>
                  )}
                  {viewingProject.winner && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 font-medium">
                      {getWinnerLabel(viewingProject.winner)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{viewingProject.projectName}</h2>
                <p className="text-gray-400 mt-2 text-sm">{viewingProject.shortDescription}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span>by <span className="text-gray-300">{viewingProject.participantName || viewingProject.participantEmail}</span></span>
                  <span>•</span>
                  <span className="font-mono">{viewingProject.participantEmail}</span>
                  <span>•</span>
                  <span>{formatDate(viewingProject.submittedAt)}</span>
                </div>
              </div>

              {/* Links */}
              {viewingProject.projectLinks?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🔗 Project Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingProject.projectLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
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
              {viewingProject.technologiesUsed?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🛠️ Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingProject.technologiesUsed.map((tech) => (
                      <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem It Solves */}
              {viewingProject.problemItSolves && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">💡 Problem It Solves</h4>
                  <div className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 prose prose-sm prose-invert max-w-none text-sm">
                    <ReactMarkdown>{viewingProject.problemItSolves}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Challenges */}
              {viewingProject.challengesRanInto && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🧗 Challenges Ran Into</h4>
                  <div className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 prose prose-sm prose-invert max-w-none text-sm">
                    <ReactMarkdown>{viewingProject.challengesRanInto}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => toggleReviewed(viewingProject)}
                  className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewingProject.reviewed
                      ? 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {viewingProject.reviewed ? '✅ Reviewed — Click to unmark' : '☐ Mark as Reviewed'}
                </button>
                <button
                  onClick={() => openEditModal(viewingProject)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-900/50 px-4 py-2 rounded-lg hover:bg-blue-950/30"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(viewingProject.participantEmail)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-900/50 px-4 py-2 rounded-lg hover:bg-red-950/30"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         EDIT PROJECT MODAL
         ═══════════════════════════════════════ */}
      {editingProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editForm.projectName || ''}
                  onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={editForm.shortDescription || ''}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Problem It Solves (Markdown)</label>
                <textarea
                  value={editForm.problemItSolves || ''}
                  onChange={(e) => setEditForm({ ...editForm, problemItSolves: e.target.value })}
                  className="w-full h-28 px-4 py-3 bg-black border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Challenges Ran Into (Markdown)</label>
                <textarea
                  value={editForm.challengesRanInto || ''}
                  onChange={(e) => setEditForm({ ...editForm, challengesRanInto: e.target.value })}
                  className="w-full h-28 px-4 py-3 bg-black border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.technologiesUsed?.join(', ') || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      technologiesUsed: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Project Links (one per line)</label>
                <textarea
                  value={editForm.projectLinks?.join('\n') || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      projectLinks: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                    })
                  }
                  className="w-full h-20 px-4 py-3 bg-black border border-white/20 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="premium-button px-6 py-2.5"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;

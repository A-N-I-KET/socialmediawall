import { useState, useEffect } from 'react';
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
      await fetchProjects();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete project.', variant: 'destructive' });
    }
  };

  const openEditModal = (project: Project) => {
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
      default: return '—';
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">
          Submitted Projects ({projects.length})
        </h3>

        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse py-4">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No projects submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.participantEmail}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-sm truncate">{p.projectName}</h4>
                      {p.winner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-medium whitespace-nowrap">
                          {getWinnerLabel(p.winner)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-mono truncate">{p.participantEmail}</p>
                    <p className="text-gray-500 text-xs mt-1">{p.shortDescription}</p>
                    <p className="text-gray-600 text-xs mt-1">Submitted: {formatDate(p.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <WinnerSelector
                      email={p.participantEmail}
                      currentWinner={p.winner}
                      onUpdate={fetchProjects}
                    />
                    <button
                      onClick={() => openEditModal(p)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-900/50 px-3 py-1.5 rounded-md hover:bg-blue-950/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.participantEmail)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-900/50 px-3 py-1.5 rounded-md hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Tech tags */}
                {p.technologiesUsed?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.technologiesUsed.map((tech) => (
                      <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Image thumbnails */}
                {p.projectImages?.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {p.projectImages.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Project image ${i + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
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

import { useState, useEffect } from 'react';
import { getSubmissionSettings, toggleProjectsVisibility } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';

const ProjectSectionToggle = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmissionSettings()
      .then((s) => setVisible(s.projectsSectionVisible))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    const newValue = !visible;
    try {
      await toggleProjectsVisibility(newValue);
      setVisible(newValue);
      toast({
        title: newValue ? 'Projects Section Visible' : 'Projects Section Hidden',
        description: newValue
          ? 'Projects section is now visible on the website.'
          : 'Projects section is hidden from the website.',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update setting.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading…</div>;

  return (
    <div className="flex items-center justify-between border border-white/10 rounded-xl p-4">
      <div>
        <h4 className="text-white font-semibold text-sm">Projects Section on Website</h4>
        <p className="text-gray-500 text-xs mt-0.5">
          {visible ? 'Projects section is visible to visitors' : 'Projects section is hidden'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
          visible ? 'bg-green-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
            visible ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ProjectSectionToggle;

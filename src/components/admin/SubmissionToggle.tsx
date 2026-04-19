import { useState, useEffect } from 'react';
import { getSubmissionSettings, toggleSubmissions } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';

const SubmissionToggle = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmissionSettings()
      .then((s) => setOpen(s.submissionsOpen))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    const newValue = !open;
    try {
      await toggleSubmissions(newValue);
      setOpen(newValue);
      toast({
        title: newValue ? 'Submissions Opened' : 'Submissions Closed',
        description: newValue
          ? 'Participants can now submit projects.'
          : 'Participants can no longer submit projects.',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update setting.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-gray-400 text-sm animate-pulse">Loading…</div>;

  return (
    <div className="flex items-center justify-between border border-white/10 rounded-xl p-4">
      <div>
        <h4 className="text-white font-semibold text-sm">Project Submissions</h4>
        <p className="text-gray-500 text-xs mt-0.5">
          {open ? 'Participants can submit projects' : 'Submissions are currently closed'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
          open ? 'bg-green-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
            open ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SubmissionToggle;

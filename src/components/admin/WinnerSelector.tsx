import { useState } from 'react';
import { setWinner } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';

interface WinnerSelectorProps {
  email: string;
  currentWinner: string;
  onUpdate: () => void;
}

const WINNER_OPTIONS = [
  { value: '', label: 'None' },
  { value: '1st', label: '🥇 1st Place' },
  { value: '1st_runner_up', label: '🥈 1st Runner Up' },
  { value: '2nd_runner_up', label: '🥉 2nd Runner Up' },
  { value: '3rd_runner_up', label: '🏅 3rd Runner Up' },
];

const WinnerSelector = ({ email, currentWinner, onUpdate }: WinnerSelectorProps) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (value: string) => {
    setLoading(true);
    try {
      await setWinner(email, value);
      toast({
        title: 'Winner Updated',
        description: value
          ? `${email} assigned as ${WINNER_OPTIONS.find((o) => o.value === value)?.label}`
          : `Winner status removed from ${email}`,
      });
      onUpdate();
    } catch {
      toast({ title: 'Error', description: 'Failed to update winner.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={currentWinner}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="bg-black border border-white/20 text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all cursor-pointer"
      style={{ minWidth: '130px' }}
    >
      {WINNER_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default WinnerSelector;

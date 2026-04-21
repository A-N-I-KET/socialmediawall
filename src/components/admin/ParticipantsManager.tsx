import { useState } from 'react';
import {
  bulkImportParticipants,
  getParticipants,
  deleteParticipant,
  clearAllParticipants,
  deleteProject,
  resetParticipantPassword,
  type Participant,
} from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const ParticipantsManager = () => {
  const [emailsInput, setEmailsInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const data = await getParticipants();
      setParticipants(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load participants.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleImport = async () => {
    const emails = emailsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      toast({ title: 'No emails', description: 'Please enter at least one email.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const result = await bulkImportParticipants(emails);
      toast({
        title: 'Import Complete',
        description: `Added ${result.added} participants. Skipped ${result.skipped} (duplicates or invalid).`,
      });
      setEmailsInput('');
      await fetchParticipants();
    } catch (error) {
      toast({ title: 'Import Failed', description: 'An error occurred during import.', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete participant ${email}? This will also delete their project if any.`)) return;
    try {
      await deleteProject(email).catch(() => {}); // delete project if exists
      await deleteParticipant(email);
      toast({ title: 'Deleted', description: `${email} has been removed.` });
      await fetchParticipants();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete participant.', variant: 'destructive' });
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Reset password for ${email}? They will need to set a new password on next login.`)) return;
    try {
      await resetParticipantPassword(email);
      toast({ title: 'Password Reset', description: `${email} will be prompted to set a new password.` });
      await fetchParticipants();
    } catch {
      toast({ title: 'Error', description: 'Failed to reset password.', variant: 'destructive' });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL participants and their projects? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearAllParticipants();
      toast({ title: 'Cleared', description: 'All participants have been removed.' });
      setParticipants([]);
    } catch {
      toast({ title: 'Error', description: 'Failed to clear participants.', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Import */}
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <span className="text-lg">📧</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Import Participants</h3>
            <p className="text-xs text-gray-500">Paste emails below, one per line or comma-separated</p>
          </div>
        </div>
        <textarea
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          className="w-full h-32 px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-mono resize-none"
          placeholder={"participant1@example.com\nparticipant2@example.com\nparticipant3@example.com"}
        />
        <button
          onClick={handleImport}
          disabled={importing || !emailsInput.trim()}
          className="premium-button px-6 py-2.5 mt-3"
        >
          {importing ? 'Importing…' : 'Import Emails'}
        </button>
      </div>

      {/* Participants Table */}
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
            All Participants ({participants.length})
          </h3>
          {participants.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors border border-red-900/50 px-4 py-2 rounded-md hover:bg-red-950/30"
            >
              {clearing ? 'Clearing…' : 'Clear All'}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse py-4">Loading participants…</p>
        ) : participants.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No participants imported yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Name</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Password</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Submitted</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.email} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 text-gray-200 font-mono text-xs truncate max-w-[200px]">{p.email}</td>
                    <td className="py-3 px-2 text-gray-300 text-xs truncate max-w-[150px]">
                      {p.firstName || p.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '—'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.passwordSet ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.projectSubmitted ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.passwordSet && (
                          <button
                            onClick={() => handleResetPassword(p.email)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            Reset Pwd
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p.email)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsManager;

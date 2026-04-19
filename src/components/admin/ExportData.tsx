import { useState } from 'react';
import { exportAllData } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const ExportData = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();

      // Build a project lookup by email
      const projectMap = new Map(data.projects.map((p) => [p.participantEmail, p]));

      // Sheet 1: Combined view — participant + project side by side
      const combinedRows = data.participants.map((p) => {
        const project = projectMap.get(p.email);
        return {
          'Email': p.email,
          'First Name': p.firstName || '',
          'Last Name': p.lastName || '',
          'Password Set': p.passwordSet ? 'Yes' : 'No',
          'Project Submitted': p.projectSubmitted ? 'Yes' : 'No',
          'Registered At': p.createdAt?.toDate?.() ? p.createdAt.toDate().toLocaleString('en-IN') : '',
          // Project fields
          'Project Name': project?.projectName || '',
          'Short Description': project?.shortDescription || '',
          'Project Links': (project?.projectLinks || []).join(', '),
          'Problem It Solves': project?.problemItSolves || '',
          'Challenges Ran Into': project?.challengesRanInto || '',
          'Technologies Used': (project?.technologiesUsed || []).join(', '),
          'Project Images': (project?.projectImages || []).join(', '),
          'Winner': project?.winner || '',
          'Submitted At': project?.submittedAt?.toDate?.() ? project.submittedAt.toDate().toLocaleString('en-IN') : '',
        };
      });

      // Sheet 2: Only participants
      const participantsRows = data.participants.map((p) => ({
        Email: p.email,
        'First Name': p.firstName || '',
        'Last Name': p.lastName || '',
        'Password Set': p.passwordSet ? 'Yes' : 'No',
        'Project Submitted': p.projectSubmitted ? 'Yes' : 'No',
        'Created At': p.createdAt?.toDate?.() ? p.createdAt.toDate().toLocaleString('en-IN') : '',
      }));

      // Sheet 3: Only projects
      const projectsRows = data.projects.map((p) => ({
        'Participant Email': p.participantEmail,
        'Participant Name': p.participantName || '',
        'Project Name': p.projectName,
        'Short Description': p.shortDescription,
        'Project Links': (p.projectLinks || []).join(', '),
        'Problem It Solves': p.problemItSolves || '',
        'Challenges Ran Into': p.challengesRanInto || '',
        'Technologies Used': (p.technologiesUsed || []).join(', '),
        'Project Images': (p.projectImages || []).join(', '),
        'Winner': p.winner || 'None',
        'Submitted At': p.submittedAt?.toDate?.() ? p.submittedAt.toDate().toLocaleString('en-IN') : '',
      }));

      // Create workbook with three sheets
      const wb = XLSX.utils.book_new();

      const combinedSheet = XLSX.utils.json_to_sheet(combinedRows);
      XLSX.utils.book_append_sheet(wb, combinedSheet, 'All Data');

      const participantsSheet = XLSX.utils.json_to_sheet(participantsRows);
      XLSX.utils.book_append_sheet(wb, participantsSheet, 'Participants');

      const projectsSheet = XLSX.utils.json_to_sheet(projectsRows);
      XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');

      // Auto-size columns
      const autoFitColumns = (sheet: XLSX.WorkSheet, rows: Record<string, unknown>[]) => {
        if (rows.length === 0) return;
        const colWidths = Object.keys(rows[0]).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...rows.map((row) => String(row[key] || '').slice(0, 60).length)
          );
          return { wch: Math.min(maxLen + 2, 50) };
        });
        sheet['!cols'] = colWidths;
      };

      autoFitColumns(combinedSheet, combinedRows);
      autoFitColumns(participantsSheet, participantsRows);
      autoFitColumns(projectsSheet, projectsRows);

      // Download
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `hackathon_data_${dateStr}.xlsx`);

      toast({
        title: 'Export Complete',
        description: `Exported ${data.participants.length} participants and ${data.projects.length} projects.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to export data.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between border border-white/10 rounded-xl p-4">
      <div>
        <h4 className="text-white font-semibold text-sm">Export All Data</h4>
        <p className="text-gray-500 text-xs mt-0.5">
          Download all participants and projects as Excel spreadsheet
        </p>
      </div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="premium-button px-5 py-2 text-xs"
      >
        {exporting ? 'Exporting…' : 'Download Excel'}
      </button>
    </div>
  );
};

export default ExportData;

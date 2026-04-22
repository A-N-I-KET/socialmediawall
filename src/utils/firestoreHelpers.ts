import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

/* ═══════════════════════════════════════
   TYPES
   ═══════════════════════════════════════ */

export interface Participant {
  email: string;
  firstName: string;
  lastName: string;
  passwordSet: boolean;
  hashedPassword: string;
  projectSubmitted: boolean;
  createdAt: Timestamp;
}

export interface Project {
  participantEmail: string;
  participantName: string;
  projectName: string;
  shortDescription: string;
  projectLinks: string[];
  problemItSolves: string;
  challengesRanInto: string;
  technologiesUsed: string[];
  projectImages: string[];
  submittedAt: Timestamp;
  winner: string; // "" | "1st" | "1st_runner_up" | "2nd_runner_up"
  reviewed: boolean;
}

export interface SubmissionSettings {
  submissionsOpen: boolean;
  projectsSectionVisible: boolean;
}

/* ═══════════════════════════════════════
   PARTICIPANTS
   ═══════════════════════════════════════ */

export async function bulkImportParticipants(emails: string[]): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  for (const rawEmail of emails) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped++;
      continue;
    }

    const docRef = doc(db, 'participants', email);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      skipped++;
      continue;
    }

    await setDoc(docRef, {
      email,
      passwordSet: false,
      hashedPassword: '',
      projectSubmitted: false,
      createdAt: Timestamp.now(),
    });
    added++;
  }

  return { added, skipped };
}

export async function getParticipants(): Promise<Participant[]> {
  const snapshot = await getDocs(collection(db, 'participants'));
  return snapshot.docs.map((d) => d.data() as Participant);
}

export async function getParticipantByEmail(email: string): Promise<Participant | null> {
  const docRef = doc(db, 'participants', email.toLowerCase());
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as Participant) : null;
}

export async function setParticipantPassword(
  email: string,
  hashedPassword: string,
  firstName: string,
  lastName: string
): Promise<void> {
  const docRef = doc(db, 'participants', email.toLowerCase());
  await updateDoc(docRef, { passwordSet: true, hashedPassword, firstName, lastName });
}

export async function resetParticipantPassword(email: string): Promise<void> {
  const docRef = doc(db, 'participants', email.toLowerCase());
  await updateDoc(docRef, { passwordSet: false, hashedPassword: '' });
}

export async function deleteParticipant(email: string): Promise<void> {
  await deleteDoc(doc(db, 'participants', email.toLowerCase()));
}

export async function clearAllParticipants(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'participants'));
  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

/* ═══════════════════════════════════════
   PROJECTS
   ═══════════════════════════════════════ */

export async function submitProject(email: string, projectData: Omit<Project, 'participantEmail' | 'participantName' | 'submittedAt' | 'winner' | 'reviewed'>): Promise<void> {
  // Fetch participant name
  const participant = await getParticipantByEmail(email);
  const participantName = participant
    ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || email
    : email;

  const docRef = doc(db, 'projects', email.toLowerCase());

  // Check if a project already exists (edit case) — preserve winner & reviewed
  const existingDoc = await getDoc(docRef);
  let existingWinner = '';
  let existingReviewed = false;
  if (existingDoc.exists()) {
    const data = existingDoc.data();
    existingWinner = data.winner || '';
    existingReviewed = data.reviewed || false;
  }

  await setDoc(docRef, {
    ...projectData,
    participantEmail: email.toLowerCase(),
    participantName,
    submittedAt: Timestamp.now(),
    winner: existingWinner,
    reviewed: existingReviewed,
  });

  // Mark participant as having submitted
  const participantRef = doc(db, 'participants', email.toLowerCase());
  await updateDoc(participantRef, { projectSubmitted: true });
}

export async function getProjects(): Promise<Project[]> {
  const snapshot = await getDocs(collection(db, 'projects'));
  return snapshot.docs.map((d) => d.data() as Project);
}

export async function getProjectByEmail(email: string): Promise<Project | null> {
  const docRef = doc(db, 'projects', email.toLowerCase());
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as Project) : null;
}

export async function updateProject(email: string, data: Partial<Project>): Promise<void> {
  const docRef = doc(db, 'projects', email.toLowerCase());
  await updateDoc(docRef, data);
}

export async function deleteProject(email: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', email.toLowerCase()));

  // Reset participant's projectSubmitted flag
  const participantRef = doc(db, 'participants', email.toLowerCase());
  const participantSnap = await getDoc(participantRef);
  if (participantSnap.exists()) {
    await updateDoc(participantRef, { projectSubmitted: false });
  }
}

/* ═══════════════════════════════════════
   WINNER MANAGEMENT
   ═══════════════════════════════════════ */

export async function setWinner(email: string, winnerStatus: string): Promise<void> {
  // If assigning a non-empty status, clear previous holder of that status
  if (winnerStatus) {
    const q = query(collection(db, 'projects'), where('winner', '==', winnerStatus));
    const snapshot = await getDocs(q);
    const clearPromises = snapshot.docs.map((d) => updateDoc(d.ref, { winner: '' }));
    await Promise.all(clearPromises);
  }

  // Assign the new winner status
  const docRef = doc(db, 'projects', email.toLowerCase());
  await updateDoc(docRef, { winner: winnerStatus });
}

/* ═══════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════ */

const SETTINGS_DOC = doc(db, 'settings', 'submissionControl');

export async function getSubmissionSettings(): Promise<SubmissionSettings> {
  const snapshot = await getDoc(SETTINGS_DOC);
  if (snapshot.exists()) {
    return snapshot.data() as SubmissionSettings;
  }
  // Initialize with defaults
  const defaults: SubmissionSettings = { submissionsOpen: false, projectsSectionVisible: false };
  await setDoc(SETTINGS_DOC, defaults);
  return defaults;
}

export async function toggleSubmissions(open: boolean): Promise<void> {
  await setDoc(SETTINGS_DOC, { submissionsOpen: open }, { merge: true });
}

export async function toggleProjectsVisibility(visible: boolean): Promise<void> {
  await setDoc(SETTINGS_DOC, { projectsSectionVisible: visible }, { merge: true });
}

/* ═══════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════ */

export async function exportAllData(): Promise<{ participants: Participant[]; projects: Project[] }> {
  const [participants, projects] = await Promise.all([getParticipants(), getProjects()]);
  return { participants, projects };
}

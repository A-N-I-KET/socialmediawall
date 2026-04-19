import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { uploadMultipleToCloudinary } from '@/utils/cloudinaryUpload';
import { submitProject } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';

interface ProjectSubmissionFormProps {
  participantEmail: string;
  onSubmitted: () => void;
}

const ProjectSubmissionForm = ({ participantEmail, onSubmitted }: ProjectSubmissionFormProps) => {
  const [projectName, setProjectName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [projectLinks, setProjectLinks] = useState<string[]>(['']);
  const [problemItSolves, setProblemItSolves] = useState('');
  const [challengesRanInto, setChallengesRanInto] = useState('');
  const [techInput, setTechInput] = useState('');
  const [technologiesUsed, setTechnologiesUsed] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Project Links ---
  const addLink = () => setProjectLinks([...projectLinks, '']);
  const removeLink = (idx: number) => setProjectLinks(projectLinks.filter((_, i) => i !== idx));
  const updateLink = (idx: number, value: string) => {
    const updated = [...projectLinks];
    updated[idx] = value;
    setProjectLinks(updated);
  };

  // --- Technologies ---
  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !technologiesUsed.includes(trimmed)) {
      setTechnologiesUsed([...technologiesUsed, trimmed]);
      setTechInput('');
    }
  };
  const removeTech = (tech: string) => setTechnologiesUsed(technologiesUsed.filter((t) => t !== tech));
  const handleTechKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTech();
    }
  };

  // --- Images ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validFiles = files.filter((f) => validTypes.includes(f.type));

    if (validFiles.length !== files.length) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, GIF, and WebP images are allowed.', variant: 'destructive' });
    }

    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    // Generate previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({ title: 'Required', description: 'Project name is required.', variant: 'destructive' });
      return;
    }
    if (!shortDescription.trim()) {
      toast({ title: 'Required', description: 'Short description is required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Upload images to Cloudinary
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadProgress({ completed: 0, total: imageFiles.length });
        imageUrls = await uploadMultipleToCloudinary(imageFiles, (completed, total) => {
          setUploadProgress({ completed, total });
        });
      }

      // Submit to Firestore
      await submitProject(participantEmail, {
        projectName: projectName.trim(),
        shortDescription: shortDescription.trim(),
        projectLinks: projectLinks.filter((l) => l.trim()),
        problemItSolves,
        challengesRanInto,
        technologiesUsed,
        projectImages: imageUrls,
      });

      toast({ title: 'Success! 🎉', description: 'Your project has been submitted.' });
      onSubmitted();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Submission failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Project Name *</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
          placeholder="e.g., AI-Powered Study Assistant"
          required
        />
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Short Description * <span className="text-gray-400 font-normal">({shortDescription.length}/200)</span>
        </label>
        <input
          type="text"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
          placeholder="A brief one-liner about your project"
          required
          maxLength={200}
        />
      </div>

      {/* Project Links */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Project Links</label>
        <div className="space-y-2">
          {projectLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => updateLink(idx, e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                placeholder="https://github.com/your-project"
              />
              {projectLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="text-sm text-[#1D539F] hover:text-[#1D539F]/80 font-medium transition-colors"
          >
            + Add another link
          </button>
        </div>
      </div>

      {/* Problem It Solves */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Problem It Solves <span className="text-gray-400 font-normal">(Markdown supported)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">Describe what people can use it for, or how it makes existing tasks easier/safer.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            value={problemItSolves}
            onChange={(e) => setProblemItSolves(e.target.value)}
            className="w-full h-40 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm font-mono resize-none"
            placeholder="Write in markdown..."
          />
          <div className="h-40 overflow-y-auto px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm prose prose-sm max-w-none">
            {problemItSolves ? (
              <ReactMarkdown>{problemItSolves}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Preview will appear here…</p>
            )}
          </div>
        </div>
      </div>

      {/* Challenges Ran Into */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Challenges I Ran Into <span className="text-gray-400 font-normal">(Markdown supported)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">Tell us about any specific bug or hurdle you ran into while building this project. How did you get over it?</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            value={challengesRanInto}
            onChange={(e) => setChallengesRanInto(e.target.value)}
            className="w-full h-40 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm font-mono resize-none"
            placeholder="Write in markdown..."
          />
          <div className="h-40 overflow-y-auto px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm prose prose-sm max-w-none">
            {challengesRanInto ? (
              <ReactMarkdown>{challengesRanInto}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Preview will appear here…</p>
            )}
          </div>
        </div>
      </div>

      {/* Technologies Used */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Technologies Used</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
            placeholder="Type a technology and press Enter"
          />
          <button
            type="button"
            onClick={addTech}
            className="px-4 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>
        {technologiesUsed.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {technologiesUsed.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(245, 196, 0, 0.15)', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.3)' }}
              >
                {tech}
                <button
                  type="button"
                  onClick={() => removeTech(tech)}
                  className="hover:text-red-500 transition-colors ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Project Images */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Project Images</label>
        <p className="text-xs text-gray-400 mb-2">Upload screenshots or images of your project (JPG, PNG, GIF, WebP).</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-8 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#F5C400] hover:text-gray-700 transition-colors text-sm cursor-pointer"
        >
          <div className="flex flex-col items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Click to upload images
          </div>
        </button>

        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        {uploadProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading images…</span>
              <span>{uploadProgress.completed}/{uploadProgress.total}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C400] transition-all duration-300"
                style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300"
          style={{
            background: submitting ? '#666' : '#000',
            color: '#fff',
            boxShadow: submitting ? 'none' : '4px 4px 0 rgba(245, 196, 0, 0.5)',
          }}
        >
          {submitting ? 'Submitting your project…' : 'Submit Project 🚀'}
        </button>
      </div>
    </form>
  );
};

export default ProjectSubmissionForm;

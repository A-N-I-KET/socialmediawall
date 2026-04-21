import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { uploadMultipleToCloudinary } from '@/utils/cloudinaryUpload';
import { submitProject } from '@/utils/firestoreHelpers';
import type { Project } from '@/utils/firestoreHelpers';
import { toast } from '@/hooks/use-toast';

interface ProjectSubmissionFormProps {
  participantEmail: string;
  onSubmitted: () => void;
  existingProject?: Project | null;
}

const ProjectSubmissionForm = ({ participantEmail, onSubmitted, existingProject }: ProjectSubmissionFormProps) => {
  const isEdit = !!existingProject;

  const [projectName, setProjectName] = useState(existingProject?.projectName || '');
  const [shortDescription, setShortDescription] = useState(existingProject?.shortDescription || '');
  const [projectLinks, setProjectLinks] = useState<string[]>(
    existingProject?.projectLinks?.length ? existingProject.projectLinks : ['']
  );
  const [problemItSolves, setProblemItSolves] = useState(existingProject?.problemItSolves || '');
  const [challengesRanInto, setChallengesRanInto] = useState(existingProject?.challengesRanInto || '');
  const [techInput, setTechInput] = useState('');
  const [technologiesUsed, setTechnologiesUsed] = useState<string[]>(existingProject?.technologiesUsed || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Existing Cloudinary URLs from previous submission
  const [existingImages, setExistingImages] = useState<string[]>(existingProject?.projectImages || []);
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
  const MAX_IMAGES = 4;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const totalImageCount = existingImages.length + imageFiles.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Filter by type
    const typeValid = files.filter((f) => validTypes.includes(f.type));
    if (typeValid.length !== files.length) {
      toast({ title: 'Invalid file type', description: 'Only JPG, PNG, GIF, and WebP images are allowed.', variant: 'destructive' });
    }

    // Filter by size
    const sizeValid = typeValid.filter((f) => f.size <= MAX_FILE_SIZE);
    if (sizeValid.length !== typeValid.length) {
      toast({ title: 'File too large', description: 'Each image must be under 10MB.', variant: 'destructive' });
    }

    // Check total count
    const remaining = MAX_IMAGES - existingImages.length - imageFiles.length;
    if (remaining <= 0) {
      toast({ title: 'Limit reached', description: `You can only upload up to ${MAX_IMAGES} images.`, variant: 'destructive' });
      return;
    }
    const allowed = sizeValid.slice(0, remaining);
    if (sizeValid.length > remaining) {
      toast({ title: 'Some images skipped', description: `Only ${remaining} more image(s) allowed. Extra images were skipped.`, variant: 'destructive' });
    }

    setImageFiles((prev) => [...prev, ...allowed]);

    // Generate previews
    allowed.forEach((file) => {
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

  const removeExistingImage = (idx: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
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
      // Upload NEW images to Cloudinary
      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadProgress({ completed: 0, total: imageFiles.length });
        newImageUrls = await uploadMultipleToCloudinary(imageFiles, (completed, total) => {
          setUploadProgress({ completed, total });
        });
      }

      // Merge existing images (kept) with newly uploaded ones
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Submit to Firestore (setDoc overwrites, so works for both create and update)
      await submitProject(participantEmail, {
        projectName: projectName.trim(),
        shortDescription: shortDescription.trim(),
        projectLinks: projectLinks.filter((l) => l.trim()),
        problemItSolves,
        challengesRanInto,
        technologiesUsed,
        projectImages: allImageUrls,
      });

      toast({ title: isEdit ? 'Updated! ✅' : 'Success! 🎉', description: isEdit ? 'Your project has been updated.' : 'Your project has been submitted.' });
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
          className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm"
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
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm"
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
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm"
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
            className="w-full min-h-[200px] px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm font-mono resize-y"
            placeholder="Write in markdown..."
          />
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm prose prose-sm max-w-none">
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
            className="w-full min-h-[200px] px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm font-mono resize-y"
            placeholder="Write in markdown..."
          />
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm prose prose-sm max-w-none">
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
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm"
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
        <label className="block text-sm font-semibold text-gray-800 mb-1">Project Images</label>
        <p className="text-xs text-gray-400 mb-1">Upload screenshots or images of your project (JPG, PNG, GIF, WebP).</p>
        <p className="text-xs text-amber-600 font-medium mb-3">⚠️ Max 4 images · Max 10MB per image</p>
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
          disabled={totalImageCount >= MAX_IMAGES}
          className={`w-full px-4 py-8 rounded-xl border-2 border-dashed text-sm cursor-pointer transition-colors ${
            totalImageCount >= MAX_IMAGES
              ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
              : 'border-gray-300 text-gray-500 hover:border-[#F5C400] hover:text-gray-700'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {totalImageCount >= MAX_IMAGES
              ? 'Maximum 4 images reached'
              : `Click to upload images (${totalImageCount}/${MAX_IMAGES})`
            }
          </div>
        </button>

        {/* Existing images (from previous submission) */}
        {existingImages.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Existing images (click ✕ to remove):</p>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group">
                  <img
                    src={url}
                    alt={`Existing ${idx + 1}`}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Newly selected images */}
        {imagePreviews.length > 0 && (
          <div className="mt-3">
            {existingImages.length > 0 && <p className="text-xs text-gray-500 mb-2">New images to upload:</p>}
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-blue-200"
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
          className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
          style={{
            background: submitting ? '#999' : '#000',
            color: '#fff',
            boxShadow: submitting ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
          }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Updating your project…' : 'Submitting your project…'}
            </span>
          ) : (
            isEdit ? 'Update Project ✏️' : 'Submit Project 🚀'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectSubmissionForm;

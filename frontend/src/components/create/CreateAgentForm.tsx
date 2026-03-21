'use client';

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { Bot, Sparkles, Brain, MessageSquare, Shield, Zap, Upload, X } from 'lucide-react';

interface CreateAgentFormProps {
  onSubmit: (data: AgentFormData) => void;
  onChange?: (data: Partial<AgentFormData>) => void;
  isSubmitting: boolean;
}

export interface AgentFormData {
  name: string;
  description: string;
  traits: string[];
  image?: File | null;
  knowledgeBase?: File | null;
}

const PERSONALITY_TRAITS = [
  { id: 'friendly', label: 'Friendly', icon: MessageSquare },
  { id: 'creative', label: 'Creative', icon: Sparkles },
  { id: 'analytical', label: 'Analytical', icon: Brain },
  { id: 'protective', label: 'Protective', icon: Shield },
  { id: 'energetic', label: 'Energetic', icon: Zap },
];

export function CreateAgentForm({ onSubmit, onChange, isSubmitting }: CreateAgentFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update preview in real-time
  useEffect(() => {
    onChange?.({ name, description, traits, image, knowledgeBase });
  }, [name, description, traits, image, knowledgeBase, onChange]);

  const toggleTrait = (traitId: string) => {
    setTraits((prev) =>
      prev.includes(traitId)
        ? prev.filter((t) => t !== traitId)
        : [...prev, traitId]
    );
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept image files under 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, image: 'Please upload a JPEG, PNG, GIF, or WebP image' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image must be under 10MB' }));
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept txt, pdf, md files under 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: 'File must be under 5MB' }));
        return;
      }
      setKnowledgeBase(file);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const removeFile = () => {
    setKnowledgeBase(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (name.length > 50) {
      newErrors.name = 'Name must be under 50 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Personality description is required';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (traits.length === 0) {
      newErrors.traits = 'Select at least one personality trait';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name, description, traits, image, knowledgeBase });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Nova AI, TradeMaster, ArtBot"
          className={`w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
            errors.name
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20'
          }`}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Personality Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Personality Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your agent's personality, expertise, and how it should interact with users..."
          rows={4}
          className={`w-full px-4 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 resize-none transition-all ${
            errors.description
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20'
          }`}
          disabled={isSubmitting}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-400">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${description.length < 20 ? 'text-gray-500' : 'text-emerald-400'}`}>
            {description.length}/500
          </span>
        </div>
      </div>

      {/* Personality Traits */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Personality Traits *
        </label>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TRAITS.map((trait) => {
            const Icon = trait.icon;
            const isSelected = traits.includes(trait.id);
            return (
              <button
                key={trait.id}
                type="button"
                onClick={() => toggleTrait(trait.id)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {trait.label}
              </button>
            );
          })}
        </div>
        {errors.traits && (
          <p className="mt-2 text-sm text-red-400">{errors.traits}</p>
        )}
      </div>

      {/* Agent Image (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Image <span className="text-gray-500">(Optional)</span>
        </label>
        {imagePreview ? (
          <div className="relative w-32 h-32">
            <img
              src={imagePreview}
              alt="Agent preview"
              className="w-32 h-32 object-cover rounded-xl border border-emerald-500/30"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-32 h-32 bg-black/20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/30 hover:bg-black/30 transition-all">
            <Upload className="w-6 h-6 text-gray-500 mb-1" />
            <span className="text-xs text-gray-400">Upload</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
        )}
        {errors.image && (
          <p className="mt-1 text-sm text-red-400">{errors.image}</p>
        )}
      </div>

      {/* Knowledge Base Upload (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Knowledge Base <span className="text-gray-500">(Optional)</span>
        </label>
        {knowledgeBase ? (
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 truncate max-w-[200px]">
                {knowledgeBase.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(knowledgeBase.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center px-4 py-8 bg-black/20 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/30 hover:bg-black/30 transition-all">
            <Upload className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-400">
              Drop a file or click to upload
            </span>
            <span className="text-xs text-gray-500 mt-1">
              TXT, PDF, MD up to 5MB
            </span>
            <input
              type="file"
              accept=".txt,.pdf,.md"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
        )}
        {errors.file && (
          <p className="mt-1 text-sm text-red-400">{errors.file}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-bold text-lg rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
      >
        <Bot className="w-5 h-5" />
        Create Agent NFT
      </button>
    </form>
  );
}

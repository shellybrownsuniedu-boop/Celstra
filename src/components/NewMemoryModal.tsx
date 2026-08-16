import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Sliders, ChevronDown } from 'lucide-react';
import { MemoryStar, MoodId, VoiceNoteData } from '../types/journal';
import { BASIC_MOOD_LIST, getMood } from '../utils/moods';
import { VoiceRecorder } from './VoiceRecorder';

interface NewMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStar: (star: Omit<MemoryStar, 'id'>) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80'
];

export function NewMemoryModal({ isOpen, onClose, onSaveStar }: NewMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodId>('joy');
  const [moodIntensity, setMoodIntensity] = useState<number>(4);
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState<VoiceNoteData | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoPresets, setShowPhotoPresets] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // Clear all previous form inputs every time the modal is opened
  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedMood('joy');
    setMoodIntensity(4);
    setPhotos([]);
    setVoiceNote(undefined);
    setShowPhotoPresets(false);
    setShowExtras(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMoodObj = getMood(selectedMood);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    // Randomize slight spread around origin
    const randomAngle = Math.random() * Math.PI * 2;
    const randomRadius = Math.random() * 320 + 80;
    const newX = Math.round(Math.cos(randomAngle) * randomRadius);
    const newY = Math.round(Math.sin(randomAngle) * randomRadius);

    setTimeout(() => {
      onSaveStar({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
        mood: selectedMood,
        moodIntensity,
        tags: [selectedMood],
        photos,
        videos: [],
        voiceNote,
        x: newX,
        y: newY,
        z: Math.round(Math.random() * 30 + 10),
        starType: 'radiant',
      });

      resetForm();
      onClose();
    }, 550);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* "inscribe a memory" Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-[#eed09d]/25 bg-[#090d1a]/95 shadow-[0_0_60px_rgba(238,208,157,0.12)] p-7 sm:p-9 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Ambient Top Subtle Stardust Halo */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 blur-3xl opacity-30 pointer-events-none rounded-full"
          style={{ backgroundColor: currentMoodObj.color }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center pb-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#eed09d] mb-1 font-serif italic tracking-wider">
            <span>✦</span>
            <span>celestial horizon</span>
            <span>✦</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#fdfaf3] tracking-wide font-normal lowercase">
            inscribe a memory
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* name: field */}
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-1.5 focus-within:border-[#eed09d]/70 transition">
            <span className="text-xs font-serif text-[#eed09d]/80 italic shrink-0">name:</span>
            <input
              type="text"
              required
              placeholder="your name or memory star name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* memory: field */}
          <div className="space-y-1.5 border-b border-slate-700/60 pb-2 focus-within:border-[#eed09d]/70 transition">
            <span className="text-xs font-serif text-[#eed09d]/80 italic">memory:</span>
            <textarea
              rows={3}
              placeholder="write your memory, reflection, gratitude, or thought to cast into the sky..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Emotional Mood Tone Selector (Basic Moods) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-serif text-[#eed09d]/80 italic">
                emotional resonance:
              </span>
              <span className="text-xs font-serif italic" style={{ color: currentMoodObj.color }}>
                {currentMoodObj.name}
              </span>
            </div>
            
            <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 w-full box-border">
              {BASIC_MOOD_LIST.map((m) => {
                const isCurrent = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    title={m.name}
                    className={`relative py-2 px-1 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1.5 min-w-0 w-full ${
                      isCurrent
                        ? 'bg-slate-800/90 shadow-sm border border-[#eed09d]/60 text-white'
                        : 'hover:bg-slate-900/80 border border-transparent opacity-65 hover:opacity-100 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full transition-transform shrink-0"
                      style={{
                        backgroundColor: m.color,
                        boxShadow: isCurrent ? `0 0 8px ${m.glowColor}` : 'none',
                      }}
                    />
                    <span className="text-[11px] text-slate-300 font-serif truncate w-full text-center block px-0.5 leading-none">
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Recorder Integration */}
          <div className="pt-1">
            <VoiceRecorder onRecorded={(data) => setVoiceNote(data)} />
          </div>

          {/* Optional Attachments (Photos & Luminosity) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="flex items-center justify-between w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-serif italic text-xs text-[#eed09d]/90">
                <Sliders className="w-3 h-3 text-[#eed09d]" />
                photos & luminosity (optional)
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtras ? 'rotate-180' : ''}`} />
            </button>

            {showExtras && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                
                {/* Intensity */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-serif italic mb-1">
                    <span>star brightness</span>
                    <span className="text-[#eed09d]">level {moodIntensity}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={moodIntensity}
                    onChange={(e) => setMoodIntensity(Number(e.target.value))}
                    className="w-full accent-[#eed09d] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-serif italic text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-[#eed09d]" />
                      photo memory
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPhotoPresets(!showPhotoPresets)}
                      className="text-[11px] text-[#eed09d] hover:underline font-serif italic"
                    >
                      sample presets ▾
                    </button>
                  </div>

                  {showPhotoPresets && (
                    <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-900 rounded-xl border border-slate-800 mb-2">
                      {SAMPLE_PHOTO_PRESETS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (!photos.includes(url)) setPhotos([...photos, url]);
                          }}
                          className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 hover:border-[#eed09d] transition cursor-pointer"
                        >
                          <img src={url} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 group">
                        <img src={p} alt="attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label className="w-12 h-12 rounded-lg border border-dashed border-slate-700 hover:border-[#eed09d] bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-[#eed09d]">
                      <ImageIcon className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[8px] uppercase font-mono">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3 text-center">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-8 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif text-sm font-medium tracking-wide shadow-[0_0_20px_rgba(250,237,217,0.35)] transition cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#0f1424]" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send your memory</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

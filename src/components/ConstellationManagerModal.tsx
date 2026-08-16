import { useState } from 'react';
import { X, Sparkles, Trash2, Compass, Eye } from 'lucide-react';
import { Constellation, MemoryStar, MoodId } from '../types/journal';
import { getMood } from '../utils/moods';

interface ConstellationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  constellations: Constellation[];
  memories: MemoryStar[];
  onFocusConstellation: (id: string) => void;
  onDeleteConstellation: (id: string) => void;
  onStartDrawingConstellation: () => void;
  onAutoGenerateByMood: (mood: MoodId) => void;
}

export function ConstellationManagerModal({
  isOpen,
  onClose,
  constellations,
  onFocusConstellation,
  onDeleteConstellation,
  onStartDrawingConstellation,
  onAutoGenerateByMood,
}: ConstellationManagerModalProps) {
  const [selectedMoodToAuto, setSelectedMoodToAuto] = useState<MoodId>('joy');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#eed09d]/30 bg-[#080c18]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-7 sm:p-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-serif text-[#eed09d] flex items-center gap-1.5 mb-1">
              <Compass className="w-3 h-3 text-[#eed09d]" />
              celestial constellations
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#fdfaf3] lowercase">
              your sky constellations
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <div>
            <h4 className="text-xs font-serif text-slate-200">Weave a new constellation</h4>
            <p className="text-[11px] text-slate-400">Connect stars directly in your sky canvas or auto-group by emotion.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onStartDrawingConstellation();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif font-medium text-xs tracking-wider transition cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#0f1424]" />
              <span>weave on sky</span>
            </button>
          </div>
        </div>

        {/* Auto Grouping Bar */}
        <div className="mt-3 flex items-center gap-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800/60">
          <span className="text-xs font-serif text-slate-400 shrink-0 italic">auto-link mood:</span>
          <select
            value={selectedMoodToAuto}
            onChange={(e) => setSelectedMoodToAuto(e.target.value as MoodId)}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none font-serif"
          >
            {['joy', 'serenity', 'gratitude', 'love', 'wonder', 'strength', 'hope'].map((m) => (
              <option key={m} value={m}>
                {getMood(m as MoodId).name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onAutoGenerateByMood(selectedMoodToAuto)}
            className="px-3.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-[#eed09d] border border-[#eed09d]/20 rounded-full text-xs font-serif transition cursor-pointer ml-auto"
          >
            auto-form constellation
          </button>
        </div>

        {/* Constellations List */}
        <div className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
          {constellations.length === 0 ? (
            <div className="text-center py-8 text-xs font-serif text-slate-500 italic">
              no constellations formed yet. start connecting your stars!
            </div>
          ) : (
            constellations.map((constellation) => {
              const starCount = constellation.starIds.length;
              return (
                <div
                  key={constellation.id}
                  className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 transition flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: constellation.color }}
                      />
                      <h3 className="text-sm font-serif font-medium text-[#fdfaf3] lowercase">
                        {constellation.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        {starCount} stars
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {constellation.description}
                    </p>

                    {constellation.mythology && (
                      <p className="text-[11px] text-[#eed09d]/90 font-serif italic">
                        "{constellation.mythology}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onFocusConstellation(constellation.id);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#eed09d] border border-slate-700/80 text-xs transition cursor-pointer"
                      title="Focus in Sky"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {deletingId === constellation.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800/80 rounded-xl p-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteConstellation(constellation.id);
                            setDeletingId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-serif font-medium transition cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-white text-[11px] font-serif transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(constellation.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition cursor-pointer"
                        title="Delete Constellation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

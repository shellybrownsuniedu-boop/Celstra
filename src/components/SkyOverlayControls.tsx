import { useState } from 'react';
import { Filter, Sparkles, Compass } from 'lucide-react';
import { MOOD_LIST, getMood } from '../utils/moods';
import { MoodId } from '../types/journal';

interface SkyOverlayControlsProps {
  activeFilterMood: string | null;
  onSelectMoodFilter: (mood: string | null) => void;
  onStartDrawingConstellation: () => void;
  onOpenConstellationManager: () => void;
  totalStars: number;
  totalConstellations: number;
}

export function SkyOverlayControls({
  activeFilterMood,
  onSelectMoodFilter,
  onStartDrawingConstellation,
  onOpenConstellationManager,
  totalStars,
  totalConstellations,
}: SkyOverlayControlsProps) {
  const [showMoodTray, setShowMoodTray] = useState(false);

  return (
    <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-3 select-none">
      
      {/* Left side: Constellation & Star Counters & Filter */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowMoodTray(!showMoodTray)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border backdrop-blur-xl text-xs font-serif tracking-wide transition cursor-pointer shadow-lg ${
            activeFilterMood && activeFilterMood !== 'all'
              ? 'border-[#eed09d] bg-[#090d1a]/95 text-[#eed09d]'
              : 'border-slate-800/80 bg-[#090d1a]/80 text-slate-300 hover:bg-[#0f1527]'
          }`}
        >
          <Filter className="w-3 h-3 text-[#eed09d]" />
          <span>{activeFilterMood && activeFilterMood !== 'all' ? getMood(activeFilterMood as MoodId).name : 'all moods'}</span>
        </button>

        {showMoodTray && (
          <div className="absolute top-12 left-0 z-20 flex flex-col p-2 rounded-2xl border border-[#eed09d]/30 bg-[#080c18]/95 backdrop-blur-xl shadow-2xl space-y-1 w-52 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                onSelectMoodFilter(null);
                setShowMoodTray(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800/80 text-left transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#eed09d]" />
              <span className="font-serif">all celestial stars</span>
            </button>
            {MOOD_LIST.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectMoodFilter(m.id);
                  setShowMoodTray(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                  activeFilterMood === m.id ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <span className="truncate font-serif">{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Constellation tools */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenConstellationManager}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-800/80 bg-[#090d1a]/80 hover:bg-[#0f1527] text-slate-300 text-xs font-serif backdrop-blur-xl shadow-lg transition cursor-pointer"
        >
          <Compass className="w-3 h-3 text-[#eed09d]" />
          <span>{totalConstellations} constellations</span>
        </button>

        <button
          type="button"
          onClick={onStartDrawingConstellation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#eed09d]/35 bg-[#eed09d]/10 hover:bg-[#eed09d]/20 text-[#eed09d] text-xs font-serif backdrop-blur-xl shadow-lg transition cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[#eed09d]" />
          <span>weave constellation</span>
        </button>
      </div>
    </div>
  );
}

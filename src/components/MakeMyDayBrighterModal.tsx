import { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Sun,
  Compass,
  ArrowRight,
  RefreshCw,
  Heart,
  Calendar,
  BookOpen,
  Feather,
} from 'lucide-react';
import { MemoryStar } from '../types/journal';
import { getMood } from '../utils/moods';
import { sound } from '../utils/audio';

interface MakeMyDayBrighterModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryStar[];
  onWarpToStar: (star: MemoryStar) => void;
  onOpenNewMemoryModal?: () => void;
}

export function MakeMyDayBrighterModal({
  isOpen,
  onClose,
  memories,
  onWarpToStar,
  onOpenNewMemoryModal,
}: MakeMyDayBrighterModalProps) {
  const [selectedAnchorIndex, setSelectedAnchorIndex] = useState(0);

  // Group and analyze past entries
  const analysis = useMemo(() => {
    if (memories.length === 0) {
      return {
        totalMemories: 0,
        upliftingCount: 0,
        topMood: 'serenity',
        anchorStars: [],
        insights: [],
        intentions: [],
      };
    }

    const upliftingStars = memories.filter(
      (m) =>
        ['joy', 'serenity', 'hope', 'love', 'gratitude', 'wonder'].includes(m.mood) ||
        m.moodIntensity >= 4 ||
        m.isFavorite
    );

    const difficultStars = memories.filter((m) =>
      ['sad', 'awful', 'anxious', 'melancholy'].includes(m.mood)
    );

    // Count mood frequencies
    const moodCounts: Record<string, number> = {};
    memories.forEach((m) => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const dominantMood = sortedMoods[0]?.[0] || 'serenity';

    // Prioritize anchor stars: favorites first, then highest intensity, then most recent uplifting
    const anchorStars = [...upliftingStars].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return (b.moodIntensity || 3) - (a.moodIntensity || 3);
    });

    // Curate tailored insights and tomorrow intentions based on past entries
    const generatedInsights: Array<{ title: string; note: string; sourceStar?: string }> = [];
    const tomorrowIntentions: Array<{ label: string; detail: string; iconType: string }> = [];

    if (anchorStars.length > 0) {
      const topStar = anchorStars[0];
      generatedInsights.push({
        title: 'What illuminated your past sky',
        note: `In "${topStar.title}", you found starlight through "${
          topStar.content ? topStar.content.slice(0, 110) + '…' : 'a moment of quiet presence'
        }"`,
        sourceStar: topStar.title,
      });
    }

    if (difficultStars.length > 0 && upliftingStars.length > 0) {
      generatedInsights.push({
        title: 'Your resilience pattern',
        note: `You have navigated ${difficultStars.length} heavier days and emerged into clearer skies. Your memories show that difficult emotions always soften with time.`,
      });
    } else if (upliftingStars.length > 2) {
      generatedInsights.push({
        title: 'Enduring positivity',
        note: `You have inscribed ${upliftingStars.length} uplifting moments into your sky. Revisiting these reflections acts as a protective reservoir for tomorrow.`,
      });
    }

    // Concrete suggestions for making tomorrow brighter derived from journal patterns
    if (dominantMood === 'anxious' || dominantMood === 'awful') {
      tomorrowIntentions.push({
        label: 'Create a 15-Minute Quiet Threshold',
        detail: 'Past reflections show that slowing down early reduces tomorrow’s mental noise.',
        iconType: 'wind',
      });
      tomorrowIntentions.push({
        label: 'Release Unfinished Pressures Tonight',
        detail: 'Write down any lingering tasks on paper before sleep to clear your celestial space.',
        iconType: 'feather',
      });
    } else {
      tomorrowIntentions.push({
        label: 'Start Tomorrow With One Small Joy',
        detail: 'Plan one pleasant ritual for the morning—like warm tea, sunlight, or a favorite song.',
        iconType: 'sun',
      });
      tomorrowIntentions.push({
        label: 'Anchor a Moment of Gratitude',
        detail: 'Notice one peaceful moment during midday and inscribe it before dusk.',
        iconType: 'sparkles',
      });
    }

    tomorrowIntentions.push({
      label: 'Protect Your Rest Tonight',
      detail: 'Give yourself permission to close today’s chapter without needing everything solved.',
      iconType: 'moon',
    });

    return {
      totalMemories: memories.length,
      upliftingCount: upliftingStars.length,
      topMood: dominantMood,
      anchorStars: anchorStars.length > 0 ? anchorStars : memories,
      insights: generatedInsights,
      intentions: tomorrowIntentions,
    };
  }, [memories]);

  const currentAnchorStar =
    analysis.anchorStars.length > 0
      ? analysis.anchorStars[selectedAnchorIndex % analysis.anchorStars.length]
      : null;

  const cycleAnchorStar = () => {
    if (analysis.anchorStars.length <= 1) return;
    const nextIdx = (selectedAnchorIndex + 1) % analysis.anchorStars.length;
    setSelectedAnchorIndex(nextIdx);
    const star = analysis.anchorStars[nextIdx];
    if (star) {
      sound.playStarSelect(getMood(star.mood).frequency);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#eed09d]/30 bg-[#080c18]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top ambient starlight glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-28 bg-[#eed09d]/15 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[#eed09d]">✦</span>
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#eed09d]">
                celestial sanctuary
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#fdfaf3] lowercase">
              how to make tomorrow brighter
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 space-y-5">
          
          {memories.length === 0 ? (
            /* Empty State when no entries exist yet */
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#eed09d]/10 border border-[#eed09d]/30 flex items-center justify-center mx-auto text-[#eed09d]">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-slate-100">No memory stars yet</h3>
                <p className="text-xs text-slate-400 font-serif italic max-w-md mx-auto mt-1 leading-relaxed">
                  Inscribe your first memory or thought today. Celstra will automatically reflect upon your entries to illuminate patterns and guide tomorrow towards greater peace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenNewMemoryModal) onOpenNewMemoryModal();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif text-xs font-medium tracking-wide transition cursor-pointer shadow-md"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Inscribe your first memory</span>
              </button>
            </div>
          ) : (
            /* Full Past Entries Synthesis */
            <>
              {/* 1. Starlight Anchor from Past Entries */}
              {currentAnchorStar && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-[#eed09d]/35 relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#eed09d] animate-ping" />
                      <span className="text-[11px] font-serif uppercase tracking-wider text-[#eed09d]">
                        Wisdom from your past sky
                      </span>
                    </div>

                    {analysis.anchorStars.length > 1 && (
                      <button
                        type="button"
                        onClick={cycleAnchorStar}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#eed09d] font-serif transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>another entry</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-serif text-[#fdfaf3]">
                        "{currentAnchorStar.title}"
                      </h3>
                      {currentAnchorStar.isFavorite && (
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                      )}
                    </div>

                    {currentAnchorStar.content && (
                      <p className="text-xs text-slate-300 font-sans italic line-clamp-3 leading-relaxed">
                        "{currentAnchorStar.content}"
                      </p>
                    )}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#eed09d]" />
                      {new Date(currentAnchorStar.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onWarpToStar(currentAnchorStar);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif text-xs font-medium transition cursor-pointer shadow-sm"
                    >
                      <span>Visit this star in the sky</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Key Journal Takeaways */}
              {analysis.insights.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#eed09d] font-serif italic">
                    <BookOpen className="w-3.5 h-3.5 text-[#eed09d]" />
                    <span>Reflection synthesis ({analysis.totalMemories} total entries)</span>
                  </div>
                  {analysis.insights.map((ins, idx) => (
                    <div key={idx} className="text-xs text-slate-300 font-sans leading-relaxed">
                      <span className="font-serif text-[#eed09d]/90 font-medium block">
                        ✦ {ins.title}:
                      </span>
                      <span className="text-slate-300/90 pl-3 block">{ins.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Three Concrete Ways to Make Tomorrow Brighter */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs text-[#eed09d] font-serif italic">
                  <Compass className="w-3.5 h-3.5 text-[#eed09d]" />
                  <span>3 simple starlight intentions for tomorrow:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {analysis.intentions.map((intent, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-[#eed09d] block mb-1">
                          0{i + 1}
                        </span>
                        <h4 className="text-xs font-serif text-[#fdfaf3] font-medium leading-snug mb-1">
                          {intent.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                          {intent.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 font-serif italic">
                  "Each new day begins with a tranquil night."
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenNewMemoryModal) onOpenNewMemoryModal();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[#eed09d] border border-[#eed09d]/30 text-xs font-serif italic transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#eed09d]" />
                  <span>Inscribe new memory</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

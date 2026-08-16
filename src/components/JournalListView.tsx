import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, Sparkles, Heart, Mic, Image as ImageIcon, Eye, Plus, Trash2 } from 'lucide-react';
import { MemoryStar, MoodId } from '../types/journal';
import { getMood, MOOD_LIST } from '../utils/moods';

interface JournalListViewProps {
  memories: MemoryStar[];
  onSelectStar: (star: MemoryStar) => void;
  onOpenNewMemoryModal: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteStar?: (id: string) => void;
}

export function JournalListView({
  memories,
  onSelectStar,
  onOpenNewMemoryModal,
  onToggleFavorite,
  onDeleteStar,
}: JournalListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'voice' | 'photo' | 'favorites'>('all');
  const [deletingStarId, setDeletingStarId] = useState<string | null>(null);

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Search
      const matchSearch =
        searchQuery.trim() === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()));

      // Mood
      const matchMood = selectedMoodFilter === 'all' || m.mood === selectedMoodFilter;

      // Media
      let matchMedia = true;
      if (mediaFilter === 'voice') matchMedia = !!m.voiceNote;
      if (mediaFilter === 'photo') matchMedia = m.photos.length > 0;
      if (mediaFilter === 'favorites') matchMedia = !!m.isFavorite;

      return matchSearch && matchMood && matchMedia;
    });
  }, [memories, searchQuery, selectedMoodFilter, mediaFilter]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050814] text-slate-100 p-4 sm:p-8 overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-[#eed09d]">
              celestial chronicles
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#fdfaf3] font-normal lowercase mt-0.5">
              journal archive & reflections
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-serif italic">
              every star in your sky captured as an enduring memory.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewMemoryModal}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif font-medium text-xs tracking-wide transition cursor-pointer self-start sm:self-auto shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#0f1424]" />
            <span>inscribe memory</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search thoughts, tags, locations, memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#080c18]/90 border border-slate-800/80 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#eed09d]/80 font-serif"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <select
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="bg-[#080c18]/90 border border-slate-800/80 text-slate-300 rounded-full px-3.5 py-2 text-xs focus:outline-none font-serif"
            >
              <option value="all">all emotional moods</option>
              {MOOD_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-[#080c18]/90 p-1 rounded-full border border-slate-800/80">
              {(['all', 'voice', 'photo', 'favorites'] as const).map((mf) => (
                <button
                  key={mf}
                  type="button"
                  onClick={() => setMediaFilter(mf)}
                  className={`px-3 py-1 rounded-full text-xs font-serif capitalize transition cursor-pointer ${
                    mediaFilter === mf ? 'bg-[#faedd9] text-[#0f1424] font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mf === 'all' ? 'All' : mf === 'voice' ? '🎙️ Voice' : mf === 'photo' ? '📷 Photos' : '❤️ Favorites'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-serif italic">
          <span>showing {filteredMemories.length} celestial entries</span>
        </div>

        {/* Journal Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full text-center py-20 rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/40 px-4">
              <Sparkles className="w-8 h-8 text-[#eed09d] mx-auto mb-3" />
              <h3 className="text-lg font-serif text-[#fdfaf3] font-normal lowercase mb-1">
                {memories.length === 0 ? 'no chronicles yet' : 'no memory stars match your criteria'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 font-serif italic">
                {memories.length === 0
                  ? 'Your celestial sky is waiting for your first memory. Every memory becomes an eternal star.'
                  : 'Try changing your search terms, mood filter, or media selection.'}
              </p>
              {memories.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenNewMemoryModal}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif font-medium text-xs tracking-wide transition cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>record your first memory</span>
                </button>
              )}
            </div>
          ) : (
            filteredMemories.map((mem) => {
              const moodObj = getMood(mem.mood);
              return (
                <div
                  key={mem.id}
                  onClick={() => onSelectStar(mem)}
                  className="group relative rounded-3xl border border-[#eed09d]/20 bg-[#080c18]/80 hover:bg-[#0c1224] hover:border-[#eed09d]/50 transition-all p-5 flex flex-col justify-between cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:-translate-y-0.5"
                >
                  <div>
                    {/* Top Row: Mood Badge + Date + Favorite */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: moodObj.color }}
                        />
                        <span className="text-[10px] uppercase font-serif tracking-widest text-[#eed09d]">
                          {moodObj.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-serif text-slate-400">
                          {new Date(mem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(mem.id);
                          }}
                          className={`p-1 rounded-full transition cursor-pointer ${
                            mem.isFavorite ? 'text-rose-400' : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={mem.isFavorite ? 'Favorited' : 'Add to favorites'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${mem.isFavorite ? 'fill-rose-400' : ''}`} />
                        </button>

                        {onDeleteStar && (
                          deletingStarId === mem.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 bg-rose-950 border border-rose-800 rounded-lg px-1.5 py-0.5"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteStar(mem.id);
                                  setDeletingStarId(null);
                                }}
                                className="text-[10px] text-rose-300 hover:text-white font-serif font-medium cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingStarId(null);
                                }}
                                className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-1"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingStarId(mem.id);
                              }}
                              className="p-1 text-slate-600 hover:text-rose-400 transition cursor-pointer"
                              title="Delete memory star"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Photo preview if present */}
                    {mem.photos.length > 0 && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden mb-3 border border-slate-800 bg-slate-950">
                        <img
                          src={mem.photos[0]}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-serif text-[#fdfaf3] group-hover:text-[#eed09d] transition line-clamp-2 lowercase font-normal leading-snug">
                      {mem.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 text-sm text-slate-300 line-clamp-3 leading-relaxed italic">
                      "{mem.content}"
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      {mem.voiceNote && (
                        <span className="flex items-center gap-1 text-cyan-400/90">
                          <Mic className="w-3 h-3" /> Voice
                        </span>
                      )}
                      {mem.photos.length > 1 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <ImageIcon className="w-3 h-3" /> +{mem.photos.length - 1}
                        </span>
                      )}
                      {mem.location && (
                        <span className="flex items-center gap-1 text-slate-400 truncate max-w-[100px]">
                          <MapPin className="w-3 h-3" /> {mem.location}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-[#eed09d] font-serif text-xs group-hover:translate-x-0.5 transition">
                      inspect star →
                    </span>
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

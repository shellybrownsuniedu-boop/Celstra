import { useState, useRef, useEffect } from 'react';
import { X, Heart, Play, Pause, Calendar, Sparkles, Trash2, Share2, Compass } from 'lucide-react';
import { MemoryStar, Constellation } from '../types/journal';
import { getMood } from '../utils/moods';
import { sound } from '../utils/audio';

interface MemoryInspectorModalProps {
  star: MemoryStar | null;
  constellations: Constellation[];
  onClose: () => void;
  onDeleteStar: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartConstellationWithStar: (starId: string) => void;
}

export function MemoryInspectorModal({
  star,
  constellations,
  onClose,
  onDeleteStar,
  onToggleFavorite,
  onStartConstellationWithStar,
}: MemoryInspectorModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlayingAudio(false);
    setActivePhotoIndex(0);
    setIsConfirmingDelete(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, [star?.id]);

  if (!star) return null;

  const moodConfig = getMood(star.mood);
  const connectedConsts = constellations.filter((c) => c.starIds.includes(star.id));

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    const audioUrl = star.voiceNote?.audioUrl;
    if (audioUrl && (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:'))) {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
        audioElementRef.current.onerror = () => {
          setIsPlayingAudio(false);
          sound.playStarChime(moodConfig.frequency * 0.9, star.voiceNote?.duration || 4);
        };
      } else {
        audioElementRef.current.src = audioUrl;
      }
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => {
          setIsPlayingAudio(true);
          sound.playStarChime(moodConfig.frequency * 0.9, star.voiceNote?.duration || 4);
          setTimeout(() => setIsPlayingAudio(false), (star.voiceNote?.duration || 4) * 1000);
        });
    } else {
      // Harmonic resonance playback
      setIsPlayingAudio(true);
      sound.playStarChime(moodConfig.frequency * 0.9, star.voiceNote?.duration || 4);
      setTimeout(() => setIsPlayingAudio(false), (star.voiceNote?.duration || 4) * 1000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: star.title,
        text: `"${star.title}" — A celestial memory in Celstra. Mood: ${moodConfig.name}`,
      }).catch(() => {});
    }
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#eed09d]/25 bg-[#090d1a]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-7 sm:p-9 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient background */}
        <div
          className="absolute -top-12 -left-12 w-72 h-72 blur-3xl opacity-25 pointer-events-none rounded-full"
          style={{ backgroundColor: moodConfig.color }}
        />

        {/* Top Header Bar */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${moodConfig.color}20`,
                border: `1px solid ${moodConfig.color}60`,
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: moodConfig.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-serif italic px-3 py-0.5 rounded-full border text-slate-200"
                  style={{
                    backgroundColor: `${moodConfig.color}20`,
                    borderColor: `${moodConfig.color}40`,
                  }}
                >
                  {moodConfig.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Luminosity {star.moodIntensity}/5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 font-serif italic">
                  <Calendar className="w-3 h-3 text-[#eed09d]" />
                  {new Date(star.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite(star.id)}
              className={`p-2 rounded-full border transition cursor-pointer ${
                star.isFavorite
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={star.isFavorite ? 'Favorited' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${star.isFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Share star"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mt-5">
          <div className="text-xs font-serif text-[#eed09d] italic mb-1">star name:</div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#fdfaf3] font-normal tracking-wide leading-tight">
            {star.title}
          </h1>
        </div>

        {/* Attached Photos Gallery */}
        {star.photos && star.photos.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <img
                src={star.photos[activePhotoIndex] || star.photos[0]}
                alt="Journal Photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>

            {star.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {star.photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden border transition shrink-0 cursor-pointer ${
                      activePhotoIndex === idx ? 'border-[#eed09d] ring-2 ring-[#eed09d]/40' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={p} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reflection Text (memory ...) */}
        <div className="mt-5 bg-slate-950/80 rounded-2xl p-6 border border-slate-800/80 shadow-inner">
          <span className="text-sm font-serif italic text-[#eed09d] block mb-2 font-medium">memory reflection:</span>
          <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-serif whitespace-pre-wrap">
            {star.content || '(No additional reflection text)'}
          </p>
        </div>

        {/* Voice Note Player if exists */}
        {star.voiceNote && (
          <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-[#eed09d]/30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAudio}
                className="w-9 h-9 rounded-xl bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] flex items-center justify-center transition cursor-pointer shadow-sm"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4 fill-[#0f1424]" /> : <Play className="w-4 h-4 fill-[#0f1424]" />}
              </button>
              <div>
                <span className="text-xs font-serif text-slate-200">Voice Reflection</span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {isPlayingAudio ? 'Playing starlight audio…' : `${formatSec(star.voiceNote.duration || 4)} recorded`}
                </span>
              </div>
            </div>

            {/* Waveform graphic */}
            <div className="hidden sm:flex items-center gap-1.5 h-7">
              {(star.voiceNote.waveform || [30, 50, 80, 60, 40, 70, 90, 40, 20]).map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    isPlayingAudio ? 'bg-[#eed09d] animate-pulse' : 'bg-slate-600'
                  }`}
                  style={{ height: `${(h / 100) * 26}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Connected Constellations */}
        {connectedConsts.length > 0 && (
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800 text-xs text-[#eed09d] font-serif italic">
            <Compass className="w-3.5 h-3.5" />
            <span>Connected in {connectedConsts.map((c) => c.name).join(', ')}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              onStartConstellationWithStar(star.id);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif text-xs font-medium tracking-wide transition cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#0f1424]" />
            <span>Connect into constellation</span>
          </button>

          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800/80 rounded-2xl px-3 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs text-rose-200 font-serif">Release star permanently?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteStar(star.id);
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-serif text-xs font-medium transition cursor-pointer shadow-sm"
              >
                Yes, release
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-1 text-slate-400 hover:text-white font-serif text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400/80 hover:text-rose-300 px-3 py-2 transition cursor-pointer hover:bg-rose-950/30 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Release star</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

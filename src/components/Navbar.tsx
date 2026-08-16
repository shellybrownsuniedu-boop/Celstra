import { Sparkles, Sun } from 'lucide-react';

interface NavbarProps {
  currentView: 'sky' | 'constellations' | 'journal';
  onChangeView: (view: 'sky' | 'constellations' | 'journal') => void;
  onOpenNewMemoryModal: () => void;
  onOpenBrighterDayModal: () => void;
  onOpenConstellationManager: () => void;
}

export function Navbar({
  currentView,
  onChangeView,
  onOpenNewMemoryModal,
  onOpenBrighterDayModal,
  onOpenConstellationManager,
}: NavbarProps) {
  return (
    <header className="h-16 w-full border-b border-[#eed09d]/15 bg-[#050814]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between z-30 shrink-0 select-none">
      
      {/* Zone 1: Brand Title (Single text element) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChangeView('sky')}
          className="text-lg sm:text-xl font-serif tracking-widest text-[#fdfaf3] hover:text-[#eed09d] transition cursor-pointer flex items-center gap-2"
        >
          <span className="font-normal">celstra</span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (single line, 1-2 words) */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onChangeView('sky')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-serif tracking-wider whitespace-nowrap shrink-0 transition cursor-pointer ${
            currentView === 'sky'
              ? 'bg-[#eed09d]/15 text-[#eed09d] border border-[#eed09d]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          celestial sky
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeView('sky');
            onOpenConstellationManager();
          }}
          className="px-3.5 py-1.5 rounded-full text-xs font-serif tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 whitespace-nowrap shrink-0 transition cursor-pointer"
        >
          constellations
        </button>

        <button
          type="button"
          onClick={() => onChangeView('journal')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-serif tracking-wider whitespace-nowrap shrink-0 transition cursor-pointer ${
            currentView === 'journal'
              ? 'bg-[#eed09d]/15 text-[#eed09d] border border-[#eed09d]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          chronicles
        </button>
      </nav>

      {/* Zone 3: Primary Actions (1-2 actions) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenBrighterDayModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#eed09d]/25 bg-[#eed09d]/5 hover:bg-[#eed09d]/15 text-[#eed09d] text-xs font-serif tracking-wide whitespace-nowrap shrink-0 transition cursor-pointer"
        >
          <Sun className="w-3.5 h-3.5 text-[#eed09d]" />
          <span className="hidden sm:inline">Brighter Day</span>
          <span className="sm:hidden">Brighten</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewMemoryModal}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] text-xs font-serif font-medium tracking-wide whitespace-nowrap shrink-0 transition cursor-pointer shadow-[0_0_20px_rgba(250,237,217,0.3)]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#0f1424] text-[#0f1424]" />
          <span>inscribe memory</span>
        </button>
      </div>
    </header>
  );
}

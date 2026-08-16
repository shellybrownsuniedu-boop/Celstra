/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MemoryStar, Constellation, MoodId } from './types/journal';
import { INITIAL_MEMORIES, INITIAL_CONSTELLATIONS } from './utils/sampleData';
import { getMood } from './utils/moods';
import { sound } from './utils/audio';
import { saveEntryToBackend, fetchEntriesFromBackend } from './utils/apiSync';

import { Navbar } from './components/Navbar';
import { SkyCanvas } from './components/SkyCanvas';
import { SkyOverlayControls } from './components/SkyOverlayControls';
import { NewMemoryModal } from './components/NewMemoryModal';
import { MemoryInspectorModal } from './components/MemoryInspectorModal';
import { MakeMyDayBrighterModal } from './components/MakeMyDayBrighterModal';
import { ConstellationManagerModal } from './components/ConstellationManagerModal';
import { SaveConstellationModal } from './components/SaveConstellationModal';
import { JournalListView } from './components/JournalListView';

const STORAGE_KEY_MEMORIES = 'celstra_celestial_memories_v2';
const STORAGE_KEY_CONSTELLATIONS = 'celstra_celestial_constellations_v2';

export default function App() {
  const [memories, setMemories] = useState<MemoryStar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES) || localStorage.getItem('astraea_celestial_memories_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_MEMORIES;
  });

  const [constellations, setConstellations] = useState<Constellation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSTELLATIONS) || localStorage.getItem('astraea_celestial_constellations_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CONSTELLATIONS;
  });

  const [currentView, setCurrentView] = useState<'sky' | 'constellations' | 'journal'>('sky');
  
  // Modals & UI States
  const [isNewMemoryModalOpen, setIsNewMemoryModalOpen] = useState(false);
  const [isBrighterDayModalOpen, setIsBrighterDayModalOpen] = useState(false);
  const [isConstellationManagerOpen, setIsConstellationManagerOpen] = useState(false);
  const [isSaveConstellationModalOpen, setIsSaveConstellationModalOpen] = useState(false);
  const [draftConstellationStarIds, setDraftConstellationStarIds] = useState<string[]>([]);
  
  const [selectedStar, setSelectedStar] = useState<MemoryStar | null>(null);
  const [newBornStarId, setNewBornStarId] = useState<string | null>(null);
  const [isDrawingConstellation, setIsDrawingConstellation] = useState(false);
  const [activeFilterMood, setActiveFilterMood] = useState<string | null>(null);
  const [focusedConstellationId, setFocusedConstellationId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
    } catch {
      // storage quota fallback
    }
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSTELLATIONS, JSON.stringify(constellations));
    } catch {
      // storage quota fallback
    }
  }, [constellations]);

  // Initial check for backend records
  useEffect(() => {
    fetchEntriesFromBackend().then((backendStars) => {
      if (backendStars && backendStars.length > 0) {
        setMemories((prev) => {
          // Merge unique entries
          const existingIds = new Set(prev.map((s) => s.id));
          const newEntries = backendStars.filter((s) => !existingIds.has(s.id));
          return newEntries.length > 0 ? [...newEntries, ...prev] : prev;
        });
      }
    });
  }, []);

  // Handle saving new star
  const handleSaveNewStar = (newStarData: Omit<MemoryStar, 'id'>) => {
    const id = `star-${Date.now()}`;
    const newStar: MemoryStar = {
      ...newStarData,
      id,
    };

    // Save to local React celestial state
    setMemories((prev) => [newStar, ...prev]);
    setNewBornStarId(id);
    setCurrentView('sky');

    // Async sync to SQLite database
    saveEntryToBackend(newStarData).catch(() => {});

    // Clear newBorn state after animation completes
    setTimeout(() => {
      setNewBornStarId(null);
    }, 4000);
  };

  // Delete star
  const handleDeleteStar = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    // Remove star from any constellations
    setConstellations((prev) =>
      prev.map((c) => ({
        ...c,
        starIds: c.starIds.filter((sId) => sId !== id),
        edges: c.edges.filter(([a, b]) => a !== id && b !== id),
      })).filter((c) => c.starIds.length >= 2)
    );
    if (selectedStar?.id === id) {
      setSelectedStar(null);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m))
    );
    if (selectedStar && selectedStar.id === id) {
      setSelectedStar({ ...selectedStar, isFavorite: !selectedStar.isFavorite });
    }
  };

  // Start manual constellation drawing mode
  const handleStartDrawingConstellation = (initialStarId?: string) => {
    setIsDrawingConstellation(true);
    setCurrentView('sky');
    if (initialStarId) {
      setDraftConstellationStarIds([initialStarId]);
    } else {
      setDraftConstellationStarIds([]);
    }
  };

  // Trigger Save Constellation Modal from canvas finish
  const handleSaveNewConstellationFromCanvas = (starIds: string[]) => {
    setDraftConstellationStarIds(starIds);
    setIsDrawingConstellation(false);
    setIsSaveConstellationModalOpen(true);
  };

  // Finalize new constellation
  const handleFinalizeConstellation = (
    constellationData: Omit<Constellation, 'id' | 'createdAt'>
  ) => {
    const newId = `const-${Date.now()}`;
    const newConst: Constellation = {
      ...constellationData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setConstellations((prev) => [...prev, newConst]);
    setFocusedConstellationId(newId);
    sound.playConstellationConnect();
  };

  // Delete constellation
  const handleDeleteConstellation = (id: string) => {
    setConstellations((prev) => prev.filter((c) => c.id !== id));
    if (focusedConstellationId === id) {
      setFocusedConstellationId(null);
    }
  };

  // Auto generate constellation by mood
  const handleAutoGenerateByMood = (mood: MoodId) => {
    const matchingStars = memories.filter((m) => m.mood === mood);
    if (matchingStars.length < 2) {
      alert(`Need at least 2 ${getMood(mood).name} stars in your sky to form a constellation.`);
      return;
    }

    // Sort by proximity or date to generate aesthetic edges
    const sorted = [...matchingStars].slice(0, 6);
    const starIds = sorted.map((s) => s.id);
    const edges: [string, string][] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push([sorted[i].id, sorted[i + 1].id]);
    }
    if (sorted.length >= 4) {
      edges.push([sorted[sorted.length - 1].id, sorted[0].id]);
    }

    const moodConf = getMood(mood);
    const newConst: Constellation = {
      id: `const-auto-${Date.now()}`,
      name: `${moodConf.name} Crown`,
      description: `A harmonious alignment of ${sorted.length} memories radiating ${moodConf.label}.`,
      mythology: `Formed automatically by the cosmic alignment of ${moodConf.element} resonance.`,
      moodTheme: mood,
      starIds,
      edges,
      color: moodConf.color,
      glowColor: moodConf.glowColor,
      isAutoGenerated: true,
      createdAt: new Date().toISOString(),
    };

    setConstellations((prev) => [...prev, newConst]);
    setFocusedConstellationId(newConst.id);
    setCurrentView('sky');
    sound.playConstellationConnect();
  };

  // Fly to star from Happy Memory Warp
  const handleWarpToStar = (star: MemoryStar) => {
    setSelectedStar(star);
    setCurrentView('sky');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050711] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Header */}
      <Navbar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          setIsDrawingConstellation(false);
        }}
        onOpenNewMemoryModal={() => setIsNewMemoryModalOpen(true)}
        onOpenBrighterDayModal={() => setIsBrighterDayModalOpen(true)}
        onOpenConstellationManager={() => setIsConstellationManagerOpen(true)}
      />

      {/* Main Workspace Surface */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {currentView === 'sky' && (
          <>
            {/* Celestial Sky Canvas */}
            <SkyCanvas
              memories={memories}
              constellations={constellations}
              selectedStarId={selectedStar?.id || null}
              onSelectStar={(star) => setSelectedStar(star)}
              isDrawingConstellation={isDrawingConstellation}
              onSaveNewConstellation={handleSaveNewConstellationFromCanvas}
              onCancelDrawingConstellation={() => setIsDrawingConstellation(false)}
              newBornStarId={newBornStarId}
              activeFilterMood={activeFilterMood}
              focusedConstellationId={focusedConstellationId}
              onOpenNewMemoryModal={() => setIsNewMemoryModalOpen(true)}
            />

            {/* Sky Overlay Filters & Action Triggers */}
            <SkyOverlayControls
              activeFilterMood={activeFilterMood}
              onSelectMoodFilter={(m) => setActiveFilterMood(m)}
              onStartDrawingConstellation={() => handleStartDrawingConstellation()}
              onOpenConstellationManager={() => setIsConstellationManagerOpen(true)}
              totalStars={memories.length}
              totalConstellations={constellations.length}
            />
          </>
        )}

        {currentView === 'journal' && (
          <JournalListView
            memories={memories}
            onSelectStar={(star) => setSelectedStar(star)}
            onOpenNewMemoryModal={() => setIsNewMemoryModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteStar={handleDeleteStar}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. New Memory Inscription Modal */}
      <NewMemoryModal
        isOpen={isNewMemoryModalOpen}
        onClose={() => setIsNewMemoryModalOpen(false)}
        onSaveStar={handleSaveNewStar}
      />

      {/* 2. Star Memory Details Inspector Modal */}
      <MemoryInspectorModal
        star={selectedStar}
        constellations={constellations}
        onClose={() => setSelectedStar(null)}
        onDeleteStar={handleDeleteStar}
        onToggleFavorite={handleToggleFavorite}
        onStartConstellationWithStar={(starId) => handleStartDrawingConstellation(starId)}
      />

      {/* 3. "Make My Day Brighter" Wellness Hub Modal */}
      <MakeMyDayBrighterModal
        isOpen={isBrighterDayModalOpen}
        onClose={() => setIsBrighterDayModalOpen(false)}
        memories={memories}
        onWarpToStar={handleWarpToStar}
        onOpenNewMemoryModal={() => setIsNewMemoryModalOpen(true)}
      />

      {/* 4. Constellations Atlas Modal */}
      <ConstellationManagerModal
        isOpen={isConstellationManagerOpen}
        onClose={() => setIsConstellationManagerOpen(false)}
        constellations={constellations}
        memories={memories}
        onFocusConstellation={(id) => {
          setFocusedConstellationId(id);
          setCurrentView('sky');
        }}
        onDeleteConstellation={handleDeleteConstellation}
        onStartDrawingConstellation={() => handleStartDrawingConstellation()}
        onAutoGenerateByMood={handleAutoGenerateByMood}
      />

      {/* 5. Save Constellation Inscription Modal */}
      <SaveConstellationModal
        isOpen={isSaveConstellationModalOpen}
        onClose={() => setIsSaveConstellationModalOpen(false)}
        selectedStarIds={draftConstellationStarIds}
        memories={memories}
        onSave={handleFinalizeConstellation}
      />
    </div>
  );
}

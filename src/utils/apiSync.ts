import { MemoryStar } from '../types/journal';

const API_BASE = '/api';

export interface BackendEntry {
  id: string;
  db_id?: number;
  title: string;
  content: string;
  date: string;
  mood: string;
  moodIntensity: number;
  x: number;
  y: number;
  z: number;
  photos: string[];
  voiceNote?: {
    audioUrl: string;
    duration: number;
  };
  isFavorite?: boolean;
}

/**
 * Fetch entries directly from the SQLite / Flask backend
 */
export async function fetchEntriesFromBackend(): Promise<MemoryStar[] | null> {
  try {
    const res = await fetch(`${API_BASE}/entries`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: BackendEntry) => ({
      id: item.id || `star-${item.db_id || Date.now()}`,
      title: item.title || 'Star Memory',
      content: item.content || '',
      date: item.date || new Date().toISOString(),
      mood: (item.mood as any) || 'joy',
      moodIntensity: item.moodIntensity || 4,
      tags: [item.mood || 'joy'],
      photos: item.photos || [],
      videos: [],
      voiceNote: item.voiceNote
        ? {
            audioUrl: item.voiceNote.audioUrl,
            duration: item.voiceNote.duration,
            recordedAt: item.date || new Date().toISOString(),
          }
        : undefined,
      x: item.x || Math.round((Math.random() - 0.5) * 400),
      y: item.y || Math.round((Math.random() - 0.5) * 400),
      z: item.z || 15,
      starType: 'radiant',
      isFavorite: Boolean(item.isFavorite),
    }));
  } catch {
    return null;
  }
}

/**
 * Send a new star memory to the SQLite database
 */
export async function saveEntryToBackend(star: Omit<MemoryStar, 'id'>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: star.title,
        content: star.content,
        mood: star.mood,
        moodIntensity: star.moodIntensity,
        x: star.x,
        y: star.y,
        z: star.z,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Bulk sync all memory stars from the sky to the SQLite database
 */
export async function bulkSyncStarsToBackend(stars: MemoryStar[]): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/entries/bulk_sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stars),
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.synced || stars.length;
  } catch {
    return null;
  }
}

/**
 * Download a local JSON database backup of all celestial stars and constellations
 */
export function exportStarlogDatabase(stars: MemoryStar[], constellations: any[]) {
  const payload = {
    app: 'Starlog Celstra Celestial DB',
    exportedAt: new Date().toISOString(),
    totalStars: stars.length,
    stars,
    constellations,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `starlog_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

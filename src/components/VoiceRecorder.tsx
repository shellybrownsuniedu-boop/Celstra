import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, RotateCcw } from 'lucide-react';
import { VoiceNoteData } from '../types/journal';
import { sound } from '../utils/audio';

interface VoiceRecorderProps {
  onRecorded: (data: VoiceNoteData | undefined) => void;
  initialData?: VoiceNoteData;
}

export function VoiceRecorder({ onRecorded, initialData }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialData?.audioUrl);
  const [waveform, setWaveform] = useState<number[]>(initialData?.waveform || []);
  const [duration, setDuration] = useState<number>(initialData?.duration || 0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Sync with initialData changes (or form resets)
  useEffect(() => {
    setAudioUrl(initialData?.audioUrl);
    setWaveform(initialData?.waveform || []);
    setDuration(initialData?.duration || 0);
    setIsPlaying(false);
    setIsRecording(false);
    setRecordingDuration(0);
    setStatusMessage(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  }, [initialData]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setStatusMessage(null);
    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Audio analysis for live visual waveform
      let analyser: AnalyserNode | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } catch {
        // AudioContext fallback
      }

      // Check supported MIME type
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const liveWave: number[] = [];
      const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

      const captureWaveform = () => {
        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = Math.round((sum / dataArray.length) * 0.7);
          liveWave.push(Math.max(15, Math.min(95, avg)));
          if (liveWave.length > 24) liveWave.shift();
          setWaveform([...liveWave]);
          animFrameRef.current = requestAnimationFrame(captureWaveform);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert to data URL for persistent storage in star memories
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string) || URL.createObjectURL(audioBlob);
          setAudioUrl(base64Audio);
          
          const finalDuration = Math.max(1, recordingDuration);
          setDuration(finalDuration);

          const sampleWave = liveWave.length >= 6
            ? liveWave
            : [30, 55, 75, 90, 65, 80, 50, 70, 85, 60, 45, 30];
          setWaveform(sampleWave);

          onRecorded({
            audioUrl: base64Audio,
            duration: finalDuration,
            waveform: sampleWave,
            recordedAt: new Date().toISOString(),
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop media stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);
      if (analyser) {
        animFrameRef.current = requestAnimationFrame(captureWaveform);
      }

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      console.warn('Microphone error or permission denied, using interactive audio generator:', err);
      setStatusMessage('Microphone simulated note recorded ✨');
      
      // Simulated interactive voice recording for environments without mic access
      setIsRecording(true);
      setRecordingDuration(0);
      const simWave = [35, 50, 70, 85, 95, 80, 65, 85, 75, 55, 40, 30];
      setWaveform(simWave);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 4) {
            stopSimulatedRecording(simWave);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopSimulatedRecording = (simWave: number[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    const recordedSecs = 4;
    setDuration(recordedSecs);
    setAudioUrl('synth-voice-memory');
    onRecorded({
      audioUrl: 'synth-voice-memory',
      duration: recordedSecs,
      waveform: simWave,
      recordedAt: new Date().toISOString(),
    });
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (audioUrl === 'synth-voice-memory' || !audioUrl.startsWith('data:') && !audioUrl.startsWith('blob:')) {
      // Play celestial synth harmonic note
      setIsPlaying(true);
      sound.playStarChime(440, duration || 4);
      setTimeout(() => {
        setIsPlaying(false);
      }, (duration || 4) * 1000);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn('HTMLAudio play failed, falling back to harmonic audio:', e);
          setIsPlaying(true);
          sound.playStarChime(528, duration || 4);
          setTimeout(() => setIsPlaying(false), (duration || 4) * 1000);
        });
    }
  };

  const deleteRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setAudioUrl(undefined);
    setWaveform([]);
    setDuration(0);
    setIsPlaying(false);
    setIsRecording(false);
    setRecordingDuration(0);
    setStatusMessage(null);
    onRecorded(undefined);
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isRecording
                ? 'bg-rose-500 animate-ping'
                : audioUrl
                ? 'bg-[#eed09d]'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-serif italic text-slate-300">
            {isRecording
              ? 'recording voice memory...'
              : audioUrl
              ? 'voice note attached ✦'
              : 'voice note (optional):'}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {isRecording ? formatSec(recordingDuration) : audioUrl ? formatSec(duration) : '0:00'}
        </span>
      </div>

      {/* Waveform visualizer */}
      {(isRecording || waveform.length > 0) && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5 h-8 bg-slate-950/70 rounded-xl px-3 border border-slate-800/80 overflow-hidden">
          {waveform.map((val, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isRecording
                  ? 'bg-rose-400'
                  : isPlaying
                  ? 'bg-[#eed09d] animate-pulse'
                  : 'bg-slate-500'
              }`}
              style={{
                height: `${Math.max(12, (val / 100) * 26)}px`,
              }}
            />
          ))}
        </div>
      )}

      {statusMessage && (
        <p className="mt-1.5 text-[11px] text-[#eed09d]/90 font-serif italic">{statusMessage}</p>
      )}

      {/* Controls */}
      <div className="mt-2.5 flex items-center justify-between">
        {!audioUrl ? (
          !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#faedd9]/15 hover:bg-[#faedd9]/25 text-[#eed09d] border border-[#eed09d]/30 text-xs font-serif italic transition cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Voice</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-serif transition animate-pulse cursor-pointer"
            >
              <Square className="w-3 h-3 fill-rose-400" />
              <span>Stop & Attach</span>
            </button>
          )
        ) : (
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] text-xs font-serif font-medium transition cursor-pointer shadow-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-[#0f1424]" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-[#0f1424]" />
                    <span>Listen ({formatSec(duration)})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
                title="Re-record"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={deleteRecording}
              className="p-1.5 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 text-xs transition cursor-pointer"
              title="Remove voice note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Hidden audio element for real recording playback */}
            {audioUrl && (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:')) && (
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onError={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

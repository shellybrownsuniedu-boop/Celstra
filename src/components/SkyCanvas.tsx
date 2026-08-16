import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemoryStar, Constellation } from '../types/journal';
import { getMood } from '../utils/moods';
import { sound } from '../utils/audio';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, Plus, Check, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SkyCanvasProps {
  memories: MemoryStar[];
  constellations: Constellation[];
  selectedStarId: string | null;
  onSelectStar: (star: MemoryStar | null) => void;
  isDrawingConstellation: boolean;
  onSaveNewConstellation: (starIds: string[]) => void;
  onCancelDrawingConstellation: () => void;
  newBornStarId: string | null;
  activeFilterMood: string | null;
  focusedConstellationId: string | null;
  onOpenNewMemoryModal?: () => void;
}

interface BackgroundStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  alpha: number;
  speed: number;
  active: boolean;
}

interface StarBirthParticle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  color: string;
  isBeam: boolean;
}

export function SkyCanvas({
  memories,
  constellations,
  selectedStarId,
  onSelectStar,
  isDrawingConstellation,
  onSaveNewConstellation,
  onCancelDrawingConstellation,
  newBornStarId,
  activeFilterMood,
  focusedConstellationId,
  onOpenNewMemoryModal,
}: SkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera coordinates (world space)
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
    targetX: 0,
    targetY: 0,
    targetZoom: 1,
  });

  const [hoveredStar, setHoveredStar] = useState<MemoryStar | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [constellationStarSequence, setConstellationStarSequence] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Background stars cache
  const bgStarsRef = useRef<BackgroundStar[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const birthAnimRef = useRef<StarBirthParticle | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mouseWorldPosRef = useRef({ x: 0, y: 0 });

  // Initialize background star field
  useEffect(() => {
    const stars: BackgroundStar[] = [];
    const count = 750;
    const colors = ['#ffffff', '#fff8e7', '#e0f2fe', '#fdf4ff', '#fef3c7', '#dbeafe'];

    for (let i = 0; i < count; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        radius: Math.random() * 1.5 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        depth: Math.random() * 0.6 + 0.4,
      });
    }
    bgStarsRef.current = stars;
  }, []);

  // Handle focusing on constellation
  useEffect(() => {
    if (!focusedConstellationId) return;
    const constObj = constellations.find((c) => c.id === focusedConstellationId);
    if (!constObj || constObj.starIds.length === 0) return;

    const matchedStars = memories.filter((m) => constObj.starIds.includes(m.id));
    if (matchedStars.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    matchedStars.forEach((s) => {
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const spanX = Math.max(300, maxX - minX + 200);
    const spanY = Math.max(300, maxY - minY + 200);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleX = canvas.width / spanX;
    const scaleY = canvas.height / spanY;
    const desiredZoom = Math.min(1.4, Math.max(0.6, Math.min(scaleX, scaleY) * 0.75));

    cameraRef.current.targetX = centerX;
    cameraRef.current.targetY = centerY;
    cameraRef.current.targetZoom = desiredZoom;
    sound.playConstellationConnect();
  }, [focusedConstellationId, constellations, memories]);

  // Handle new star birth animation
  useEffect(() => {
    if (!newBornStarId) return;
    const star = memories.find((m) => m.id === newBornStarId);
    if (!star) return;

    // Zoom camera towards the new star
    cameraRef.current.targetX = star.x;
    cameraRef.current.targetY = star.y;
    cameraRef.current.targetZoom = 1.1;

    birthAnimRef.current = {
      x: star.x,
      y: star.y + 450,
      startX: star.x,
      startY: star.y + 450,
      targetX: star.x,
      targetY: star.y,
      progress: 0,
      color: getMood(star.mood).color,
      isBeam: true,
    };

    sound.playStarChime(getMood(star.mood).frequency, star.moodIntensity);

    // Trigger confetti starburst
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.5 },
        colors: [getMood(star.mood).color, '#ffffff', '#FFD700'],
        ticks: 80,
      });
    }, 600);
  }, [newBornStarId, memories]);

  // Reset drawing sequence when exiting constellation drawing mode
  useEffect(() => {
    if (!isDrawingConstellation) {
      setConstellationStarSequence([]);
    }
  }, [isDrawingConstellation]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      time += 0.016;

      // Smooth camera interpolation
      const cam = cameraRef.current;
      cam.x += (cam.targetX - cam.x) * 0.08;
      cam.y += (cam.targetY - cam.y) * 0.08;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.08;

      const width = canvas.width;
      const height = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, width, height);

      // Deep space cosmic gradient background
      const spaceGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.85
      );
      spaceGrad.addColorStop(0, '#0d1326');
      spaceGrad.addColorStop(0.45, '#070a16');
      spaceGrad.addColorStop(1, '#030409');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Nebula clouds
      ctx.save();
      const nebulaX = width / 2 - cam.x * 0.1 * cam.zoom;
      const nebulaY = height / 2 - cam.y * 0.1 * cam.zoom;
      const nebGrad1 = ctx.createRadialGradient(nebulaX - 180, nebulaY - 100, 30, nebulaX - 180, nebulaY - 100, 380);
      nebGrad1.addColorStop(0, 'rgba(88, 28, 135, 0.16)');
      nebGrad1.addColorStop(0.6, 'rgba(56, 189, 248, 0.06)');
      nebGrad1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, width, height);

      const nebGrad2 = ctx.createRadialGradient(nebulaX + 220, nebulaY + 120, 20, nebulaX + 220, nebulaY + 120, 320);
      nebGrad2.addColorStop(0, 'rgba(217, 119, 6, 0.12)');
      nebGrad2.addColorStop(0.7, 'rgba(244, 63, 94, 0.04)');
      nebGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // World transform setup
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(cam.zoom * dpr, cam.zoom * dpr);
      ctx.translate(-cam.x, -cam.y);

      // Draw background ambient stars
      bgStarsRef.current.forEach((s) => {
        const twinkle = Math.sin(time * s.twinkleSpeed * 10 + s.phase);
        const alpha = Math.max(0.1, Math.min(1, s.baseAlpha + twinkle * 0.35));
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x * s.depth, s.y * s.depth, s.radius / (cam.zoom * 0.6 + 0.4), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Shooting stars logic
      if (Math.random() < 0.008 && shootingStarsRef.current.length < 3) {
        shootingStarsRef.current.push({
          x: (Math.random() - 0.5) * 1500 + cam.x,
          y: (Math.random() - 0.5) * 1500 + cam.y - 400,
          dx: Math.cos(Math.PI * 0.25) * 8,
          dy: Math.sin(Math.PI * 0.25) * 8,
          length: Math.random() * 80 + 50,
          alpha: 1,
          speed: Math.random() * 6 + 10,
          active: true,
        });
      }

      shootingStarsRef.current.forEach((st) => {
        if (!st.active) return;
        st.x += st.dx;
        st.y += st.dy;
        st.alpha -= 0.015;

        if (st.alpha <= 0) {
          st.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${st.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x - st.dx * (st.length / 8), st.y - st.dy * (st.length / 8));
          ctx.stroke();
          ctx.restore();
        }
      });
      shootingStarsRef.current = shootingStarsRef.current.filter((st) => st.active);

      // Star birth ray animation (Video-accurate particle stardust column!)
      if (birthAnimRef.current) {
        const anim = birthAnimRef.current;
        anim.progress += 0.022;

        if (anim.progress < 1) {
          const curY = anim.startY + (anim.targetY - anim.startY) * anim.progress;
          
          ctx.save();
          // 1. Glowing ascending trail
          const beamGrad = ctx.createLinearGradient(anim.startX, curY + 120, anim.startX, curY);
          beamGrad.addColorStop(0, 'transparent');
          beamGrad.addColorStop(0.5, 'rgba(250, 237, 217, 0.3)');
          beamGrad.addColorStop(0.85, anim.color);
          beamGrad.addColorStop(1, '#ffffff');
          
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(anim.startX, curY + 140);
          ctx.lineTo(anim.startX, curY);
          ctx.stroke();

          // 2. Sparkling particle cluster around the rising star head
          for (let p = 0; p < 8; p++) {
            const pAngle = (time * 8 + p) % (Math.PI * 2);
            const pDist = ((time * 12 + p * 3) % 15) + 3;
            const px = anim.startX + Math.cos(pAngle) * pDist;
            const py = curY + Math.sin(pAngle) * (pDist * 0.6);
            ctx.fillStyle = p % 2 === 0 ? '#faedd9' : '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(px, py, Math.random() * 1.5 + 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. Central Rising Starburst Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(anim.startX, curY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          birthAnimRef.current = null;
        }
      }

      // Memory lookup map
      const memoryMap = new Map<string, MemoryStar>();
      memories.forEach((m) => memoryMap.set(m.id, m));

      // Draw Constellations (Subtle elegant lines like in video!)
      constellations.forEach((c) => {
        const isHighlight = focusedConstellationId === c.id;
        const color = c.color || '#ebd4a8';
        ctx.save();
        ctx.strokeStyle = isHighlight ? '#ffffff' : 'rgba(250, 237, 217, 0.4)';
        ctx.lineWidth = isHighlight ? 1.6 : 0.9;
        ctx.setLineDash([3, 3]);

        c.edges.forEach(([idA, idB]) => {
          const starA = memoryMap.get(idA);
          const starB = memoryMap.get(idB);
          if (!starA || !starB) return;

          // Connecting line
          ctx.beginPath();
          ctx.moveTo(starA.x, starA.y);
          ctx.lineTo(starB.x, starB.y);
          ctx.stroke();

          // Small subtle stardust travelling along edge
          const cycle = (time * 0.3 + (starA.x % 10)) % 1;
          const dustX = starA.x + (starB.x - starA.x) * cycle;
          const dustY = starA.y + (starB.y - starA.y) * cycle;

          ctx.fillStyle = '#faedd9';
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.arc(dustX, dustY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Constellation Name label floating in sky
        if (c.starIds.length >= 2) {
          let sumX = 0, sumY = 0, count = 0;
          c.starIds.forEach((id) => {
            const st = memoryMap.get(id);
            if (st) {
              sumX += st.x;
              sumY += st.y;
              count++;
            }
          });
          if (count > 0) {
            const avgX = sumX / count;
            const avgY = sumY / count - 36;
            ctx.font = `italic 600 18px "Cormorant Garamond", Georgia, serif`;
            ctx.fillStyle = isHighlight ? '#ffffff' : '#ebd4a8';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 8;
            ctx.globalAlpha = isHighlight ? 1.0 : 0.85;
            ctx.textAlign = 'center';
            ctx.fillText(c.name.toLowerCase(), avgX, avgY);
          }
        }
        ctx.restore();
      });

      // Draw interactive lines during Constellation Creation mode
      if (isDrawingConstellation && constellationStarSequence.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#faedd9';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();

        for (let i = 0; i < constellationStarSequence.length; i++) {
          const star = memoryMap.get(constellationStarSequence[i]);
          if (!star) continue;
          if (i === 0) ctx.moveTo(star.x, star.y);
          else ctx.lineTo(star.x, star.y);
        }

        // Line to mouse pointer
        const lastStarId = constellationStarSequence[constellationStarSequence.length - 1];
        const lastStar = memoryMap.get(lastStarId);
        if (lastStar) {
          ctx.lineTo(mouseWorldPosRef.current.x, mouseWorldPosRef.current.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Memory Stars (4-point radiant diamond cross starbursts + video-style floating annotations!)
      memories.forEach((star) => {
        const moodConf = getMood(star.mood);
        const isFiltered = activeFilterMood && activeFilterMood !== 'all' && star.mood !== activeFilterMood;
        const isSelected = selectedStarId === star.id;
        const isHovered = hoveredStar?.id === star.id;
        const isInDraft = constellationStarSequence.includes(star.id);

        const baseRadius = (star.moodIntensity || 3) * 1.8 + 3.5;
        const pulse = Math.sin(time * 2.5 + (star.x * 0.1)) * 1.2;
        const starRadius = Math.max(3, baseRadius + pulse);

        ctx.save();
        if (isFiltered) {
          ctx.globalAlpha = 0.15;
        }

        // 1. Radiant Outer Glow Halo
        const glowRadius = starRadius * (isSelected || isHovered ? 7.5 : 5.5);
        const radialGlow = ctx.createRadialGradient(
          star.x, star.y, starRadius * 0.3,
          star.x, star.y, glowRadius
        );
        radialGlow.addColorStop(0, moodConf.glowColor);
        radialGlow.addColorStop(0.35, moodConf.glowColor.replace('0.65', '0.22'));
        radialGlow.addColorStop(1, 'transparent');

        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Radiant 4-Point Sharp Needle Starburst (Matching Video 00:27, 00:33!)
        const mainSpike = starRadius * (isSelected || isHovered ? 5.5 : 3.8);
        const subSpike = mainSpike * 0.45;

        // Primary Horizontal & Vertical Needle Spikes
        const spikeH = ctx.createLinearGradient(star.x - mainSpike, star.y, star.x + mainSpike, star.y);
        spikeH.addColorStop(0, 'transparent');
        spikeH.addColorStop(0.5, '#ffffff');
        spikeH.addColorStop(1, 'transparent');

        ctx.fillStyle = spikeH;
        ctx.beginPath();
        ctx.moveTo(star.x - mainSpike, star.y);
        ctx.quadraticCurveTo(star.x, star.y - 1.2, star.x + mainSpike, star.y);
        ctx.quadraticCurveTo(star.x, star.y + 1.2, star.x - mainSpike, star.y);
        ctx.fill();

        const spikeV = ctx.createLinearGradient(star.x, star.y - mainSpike, star.x, star.y + mainSpike);
        spikeV.addColorStop(0, 'transparent');
        spikeV.addColorStop(0.5, '#ffffff');
        spikeV.addColorStop(1, 'transparent');

        ctx.fillStyle = spikeV;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y - mainSpike);
        ctx.quadraticCurveTo(star.x - 1.2, star.y, star.x, star.y + mainSpike);
        ctx.quadraticCurveTo(star.x + 1.2, star.y, star.x, star.y - mainSpike);
        ctx.fill();

        // Diagonal 45-degree subtle cross spikes
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(Math.PI / 4);
        const diagSpike = ctx.createLinearGradient(-subSpike, 0, subSpike, 0);
        diagSpike.addColorStop(0, 'transparent');
        diagSpike.addColorStop(0.5, 'rgba(255,255,255,0.7)');
        diagSpike.addColorStop(1, 'transparent');
        ctx.fillStyle = diagSpike;
        ctx.fillRect(-subSpike, -0.6, subSpike * 2, 1.2);
        ctx.restore();

        // 3. Central Nucleus Core
        ctx.fillStyle = moodConf.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, starRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Pure white sparkling hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, starRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 4. In-Canvas Memory Text Annotations (Large & High-Contrast for effortless reading)
        if (cam.zoom > 0.38 || isHovered || isSelected) {
          ctx.save();
          
          const titleText = star.title;
          const contentText = star.content ? (star.content.length > 50 ? star.content.slice(0, 48) + '…' : star.content) : '';

          // Name / Title tag - Large prominent serif
          const fontSize = isHovered || isSelected ? 20 : 18;
          ctx.font = `600 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1.5;
          ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#faedd9';
          ctx.textAlign = 'left';
          ctx.fillText(titleText, star.x + 16, star.y - 5);

          // Content preview under the star name - Crisp legible secondary text
          if (contentText) {
            ctx.font = `italic 500 13.5px "Plus Jakarta Sans", sans-serif`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.fillStyle = isHovered || isSelected ? 'rgba(255, 255, 255, 0.98)' : 'rgba(226, 232, 240, 0.88)';
            ctx.fillText(contentText, star.x + 16, star.y + 14);
          }
          ctx.restore();
        }

        // Selection / Draft ring indicator
        if (isInDraft) {
          ctx.strokeStyle = '#faedd9';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(star.x, star.y, starRadius + 6, 0, Math.PI * 2);
          ctx.stroke();

          const draftIndex = constellationStarSequence.indexOf(star.id) + 1;
          ctx.fillStyle = '#faedd9';
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${draftIndex}`, star.x, star.y - starRadius - 8);
        } else if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.arc(star.x, star.y, starRadius + 7, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      ctx.restore(); // Restore world transform

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    memories,
    constellations,
    selectedStarId,
    hoveredStar,
    isDrawingConstellation,
    constellationStarSequence,
    activeFilterMood,
    focusedConstellationId,
  ]);

  // Coordinate transforms
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const cam = cameraRef.current;

    const relX = (screenX - rect.left) - cw / 2;
    const relY = (screenY - rect.top) - ch / 2;

    return {
      x: cam.x + relX / cam.zoom,
      y: cam.y + relY / cam.zoom,
    };
  }, []);

  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const cam = cameraRef.current;

    return {
      x: rect.left + cw / 2 + (worldX - cam.x) * cam.zoom,
      y: rect.top + ch / 2 + (worldY - cam.y) * cam.zoom,
    };
  }, []);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    mouseWorldPosRef.current = worldPos;

    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / cameraRef.current.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / cameraRef.current.zoom;

      cameraRef.current.targetX -= dx;
      cameraRef.current.targetY -= dy;
      cameraRef.current.x -= dx;
      cameraRef.current.y -= dy;

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Find hovered star
      let found: MemoryStar | null = null;
      for (const star of memories) {
        const dist = Math.hypot(star.x - worldPos.x, star.y - worldPos.y);
        const hitRadius = Math.max(16, (star.moodIntensity || 3) * 3);
        if (dist <= hitRadius) {
          found = star;
          break;
        }
      }

      if (found !== hoveredStar) {
        setHoveredStar(found);
        if (found) {
          const scr = worldToScreen(found.x, found.y);
          setHoverPos(scr);
          sound.playStarSelect(getMood(found.mood).frequency * 0.8);
        } else {
          setHoverPos(null);
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const distDragged = Math.hypot(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y
    );
    isDraggingRef.current = false;

    // Treat as click if moved less than 6px
    if (distDragged < 6) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      let clickedStar: MemoryStar | null = null;

      for (const star of memories) {
        const dist = Math.hypot(star.x - worldPos.x, star.y - worldPos.y);
        const hitRadius = Math.max(18, (star.moodIntensity || 3) * 4);
        if (dist <= hitRadius) {
          clickedStar = star;
          break;
        }
      }

      if (clickedStar) {
        if (isDrawingConstellation) {
          // Constellation builder mode
          if (!constellationStarSequence.includes(clickedStar.id)) {
            const next = [...constellationStarSequence, clickedStar.id];
            setConstellationStarSequence(next);
            sound.playConstellationConnect();
          } else {
            // Remove if clicked again
            const filtered = constellationStarSequence.filter((id) => id !== clickedStar.id);
            setConstellationStarSequence(filtered);
          }
        } else {
          // Normal mode: zoom to star & select
          cameraRef.current.targetX = clickedStar.x;
          cameraRef.current.targetY = clickedStar.y;
          onSelectStar(clickedStar);
          sound.playStarSelect(getMood(clickedStar.mood).frequency);
        }
      } else {
        if (!isDrawingConstellation) {
          onSelectStar(null);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(2.5, Math.max(0.4, cameraRef.current.targetZoom * zoomFactor));
    cameraRef.current.targetZoom = newZoom;
    setZoomLevel(newZoom);
  };

  const resetCamera = () => {
    cameraRef.current.targetX = 0;
    cameraRef.current.targetY = 0;
    cameraRef.current.targetZoom = 1;
    setZoomLevel(1);
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.min(2.5, Math.max(0.4, cameraRef.current.targetZoom + delta));
    cameraRef.current.targetZoom = newZoom;
    setZoomLevel(newZoom);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Star Hover Tooltip */}
      {hoveredStar && hoverPos && !isDraggingRef.current && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full pb-4 transition-transform duration-75 ease-out"
          style={{ left: `${hoverPos.x}px`, top: `${hoverPos.y - 16}px` }}
        >
          <div className="rounded-2xl border border-[#eed09d]/35 bg-[#080c18]/98 p-4 shadow-[0_0_35px_rgba(0,0,0,0.85)] backdrop-blur-xl w-72 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-3 h-3 rounded-full ring-2 ring-white/20 shrink-0"
                style={{ backgroundColor: getMood(hoveredStar.mood).color }}
              />
              <span className="text-xs font-serif uppercase tracking-widest text-[#eed09d] truncate font-medium">
                {getMood(hoveredStar.mood).name}
              </span>
            </div>
            <h4 className="text-base font-serif font-medium text-[#fdfaf3] line-clamp-1">
              {hoveredStar.title}
            </h4>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed italic">
              {hoveredStar.content}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>{new Date(hoveredStar.date).toLocaleDateString()}</span>
              {hoveredStar.voiceNote && <span className="text-cyan-300">🎙️ Voice</span>}
              {hoveredStar.photos.length > 0 && <span>📷 {hoveredStar.photos.length} photo{hoveredStar.photos.length > 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Sky Navigation Controls (Vertical Minimal Dock) */}
      <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-1.5 bg-[#090d1a]/80 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <button
          type="button"
          onClick={() => adjustZoom(0.25)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => adjustZoom(-0.25)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetCamera}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Reset Sky View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Video-Accurate Bottom Floating Action Bar for Constellations */}
      {isDrawingConstellation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#080c18]/95 px-6 py-2.5 rounded-full border border-[#eed09d]/40 shadow-[0_0_40px_rgba(238,208,157,0.2)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-[#eed09d] text-xs font-serif italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              {constellationStarSequence.length === 0
                ? 'Click stars in the sky to weave a constellation'
                : `${constellationStarSequence.length} stars selected`}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Exact pill button "Save your constellation" like in the video (00:35, 00:38) */}
          <button
            type="button"
            disabled={constellationStarSequence.length < 2}
            onClick={() => onSaveNewConstellation(constellationStarSequence)}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-full bg-[#faedd9] hover:bg-[#ffffff] disabled:opacity-30 disabled:hover:bg-[#faedd9] text-[#0f1424] font-serif text-xs font-medium tracking-wide transition cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5 text-[#0f1424]" />
            <span>Save your constellation</span>
          </button>

          <button
            type="button"
            onClick={onCancelDrawingConstellation}
            className="px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty Sky Invitation Card (Matching Video Aesthetic) */}
      {memories.length === 0 && !isDrawingConstellation && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-10">
          <div className="pointer-events-auto max-w-sm w-full rounded-3xl border border-[#eed09d]/25 bg-[#080c18]/90 backdrop-blur-xl p-7 text-center shadow-[0_0_60px_rgba(238,208,157,0.1)] animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#eed09d]/10 border border-[#eed09d]/20 flex items-center justify-center mx-auto mb-3.5 text-[#eed09d] shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif text-[#fdfaf3] mb-1 font-normal lowercase">
              inscribe a memory
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Turn your thoughts, reflections, and memories into glowing stars in a vast night sky.
            </p>
            {onOpenNewMemoryModal && (
              <button
                type="button"
                onClick={onOpenNewMemoryModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-[#faedd9] hover:bg-[#ffffff] text-[#0f1424] font-serif text-xs font-medium tracking-wide transition cursor-pointer shadow-[0_0_20px_rgba(250,237,217,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inscribe your first memory</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sky status hint */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 text-[11px] text-slate-400/80 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800/60 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag to pan • Scroll to zoom • Click star to inspect</span>
      </div>
    </div>
  );
}

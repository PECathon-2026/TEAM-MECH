import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Compass } from 'lucide-react';

interface Landmark {
  id: string;
  name: string;
  japaneseName: string;
  baseX: number; // 0 to 200
  baseY: number; // 0 to 200
  type: string;
  description: string;
}

interface RevolvingMoonProps {
  size?: number; // default 220
  className?: string;
  showControls?: boolean;
}

export const RevolvingMoon: React.FC<RevolvingMoonProps> = ({
  size = 220,
  className = '',
  showControls = true,
}) => {
  const [rotationX, setRotationX] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(2); // Default fixed to 2x speed as requested
  const [phaseAngle, setPhaseAngle] = useState<number>(20);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [orbitAngle, setOrbitAngle] = useState<number>(0);

  const animationRef = useRef<number | null>(null);

  const landmarks: Landmark[] = [
    {
      id: 'tranquillitatis',
      name: 'Tranquility Region (Mare Tranquillitatis)',
      japaneseName: '静かの海',
      baseX: 130,
      baseY: 75,
      type: 'Pristine Lunar Sector',
      description: 'Apollo 11 historic landing sector on the pristine lunar surface.',
    },
    {
      id: 'tycho',
      name: 'Tycho Central Crest',
      japaneseName: 'ティコ',
      baseX: 140,
      baseY: 150,
      type: 'Bright Crest',
      description: 'Prominent high-albedo crest with radiant white starburst lines.',
    },
    {
      id: 'copernicus',
      name: 'Copernicus Crest',
      japaneseName: 'コペルニクス',
      baseX: 65,
      baseY: 75,
      type: 'White Ridge',
      description: 'Bright terraced ridge situated in the northern lunar quadrant.',
    },
  ];

  // Continuous rotation loop at 2x speed
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused) {
        setRotationX((prev) => (prev + delta * 12 * speed) % 200);
        setOrbitAngle((prev) => (prev + delta * 30 * speed) % 360);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, speed]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      
      {/* Moon Stage with Orbital Rings & Soft White Moonlight Halo */}
      <div className="relative inline-flex items-center justify-center p-6">
        
        {/* Soft Pristine White Moonlight Ambient Halo */}
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-700"
          style={{
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
            background: `radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(243, 240, 232, 0.12) 40%, rgba(214, 173, 96, 0.05) 65%, transparent 80%)`,
          }}
        />

        {/* Dynamic Orbital Ellipse Ring */}
        <svg
          width={size * 1.6}
          height={size * 1.6}
          viewBox="0 0 300 300"
          className="absolute pointer-events-none overflow-visible"
          style={{ transform: 'rotate(-20deg)' }}
        >
          <ellipse
            cx="150"
            cy="150"
            rx="138"
            ry="48"
            fill="none"
            stroke="url(#whiteOrbitGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="opacity-80"
          />

          {/* Orbiting Satellite Node 1 */}
          <g style={{ transform: `rotate(${orbitAngle}deg)`, transformOrigin: '150px 150px' }}>
            <circle cx="288" cy="150" r="4.5" fill="#FFFFFF" className="drop-shadow-[0_0_10px_#FFFFFF]" />
            <circle cx="288" cy="150" r="1.5" fill="#D6AD60" />
          </g>

          {/* Orbiting Satellite Node 2 */}
          <g style={{ transform: `rotate(${(orbitAngle + 180) % 360}deg)`, transformOrigin: '150px 150px' }}>
            <circle cx="288" cy="150" r="3" fill="#F3F0E8" className="drop-shadow-[0_0_8px_#F3F0E8]" />
          </g>

          <defs>
            <linearGradient id="whiteOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#D6AD60" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>

        {/* Main Pristine White 3D Revolving Moon Sphere */}
        <div
          className="relative rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.4)] border-2 border-[#FFFFFF]/60 cursor-grab active:cursor-grabbing"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {/* Pure White Surface Texture with Subtle Albedo Waves */}
          <svg
            width={size * 2}
            height={size}
            viewBox="0 0 400 200"
            className="absolute top-0 left-0 h-full pointer-events-none"
            style={{
              width: `${size * 2}px`,
              transform: `translateX(-${rotationX % 200}px)`,
            }}
          >
            <defs>
              <linearGradient id="pristineWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#F8F6F0" />
                <stop offset="80%" stopColor="#ECE8DC" />
                <stop offset="100%" stopColor="#DDD8C8" />
              </linearGradient>

              {/* Ultra-Subtle Soft White Contour Lines */}
              <pattern id="softSubtleWhitePattern" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M20,30 Q60,10 100,30 Q140,50 180,30" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
                <path d="M10,80 Q50,60 110,80 Q150,100 190,80" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
                <path d="M30,140 Q80,120 130,140 Q170,160 195,140" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.5" />
                
                {/* Subtle White Ray Rings */}
                <circle cx="140" cy="150" r="10" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
                <circle cx="65" cy="75" r="8" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.5" />
              </pattern>
            </defs>

            {/* Tile 1 */}
            <rect x="0" y="0" width="200" height="200" fill="url(#pristineWhiteGrad)" />
            <rect x="0" y="0" width="200" height="200" fill="url(#softSubtleWhitePattern)" />

            {/* Tile 2 (Continuous Wrap) */}
            <rect x="200" y="0" width="200" height="200" fill="url(#pristineWhiteGrad)" />
            <rect x="200" y="0" width="200" height="200" fill="url(#softSubtleWhitePattern)" />
          </svg>

          {/* Optional Coordinate Grid Overlay */}
          {showGrid && (
            <svg
              width={size}
              height={size}
              viewBox="0 0 200 200"
              className="absolute inset-0 pointer-events-none opacity-50 text-[#D6AD60]"
            >
              <ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
              <ellipse cx="100" cy="100" rx="90" ry="60" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
            </svg>
          )}

          {/* Interactive Landmark Pins Rotating with Surface */}
          <div className="absolute inset-0 pointer-events-auto">
            {landmarks.map((lm) => {
              const currentX = (lm.baseX - (rotationX % 200) + 200) % 200;
              const isVisibleOnDisc = currentX > 15 && currentX < 185;

              if (!isVisibleOnDisc) return null;

              const scaleX = (size / 200);
              const scaleY = (size / 200);

              return (
                <button
                  key={lm.id}
                  onClick={() => setSelectedLandmark(lm)}
                  style={{
                    left: `${currentX * scaleX}px`,
                    top: `${lm.baseY * scaleY}px`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                  title={lm.name}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#D6AD60]/50 animate-ping absolute" />
                    <div className="w-2 h-2 rounded-full bg-[#D6AD60] border border-[#FFFFFF] shadow-[0_0_8px_#D6AD60]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Smooth 3D Sphere Shading Mask */}
          <div
            className="absolute inset-0 pointer-events-none rounded-full transition-all duration-300"
            style={{
              background: `radial-gradient(circle at ${100 - phaseAngle}% 45%, transparent ${
                25 + phaseAngle / 3
              }%, rgba(16, 24, 42, 0.45) 75%, rgba(8, 13, 26, 0.92) 100%)`,
            }}
          />

          {/* Outer Rim Soft White Highlight */}
          <div
            className="absolute inset-0 pointer-events-none rounded-full border border-[#FFFFFF]/40"
            style={{
              boxShadow: 'inset 3px 3px 12px rgba(255, 255, 255, 0.7), inset -6px -6px 18px rgba(8, 13, 26, 0.8)',
            }}
          />
        </div>

      </div>

      {/* Selected Landmark Callout */}
      {selectedLandmark && (
        <div className="mt-3 p-3 rounded-2xl bg-[#172238] border border-[#D6AD60] max-w-xs text-center space-y-1 shadow-xl animate-fade-in z-30">
          <div className="flex items-center justify-between border-b border-[#D6AD60]/20 pb-1">
            <span className="text-[10px] font-mono text-[#D6AD60] uppercase">LUNAR LANDMARK</span>
            <button
              onClick={() => setSelectedLandmark(null)}
              className="text-[#A7B2C5] hover:text-[#F3F0E8] text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="font-serif-display text-sm font-bold text-[#F3F0E8]">
            {selectedLandmark.name} ({selectedLandmark.japaneseName})
          </div>
          <p className="text-[11px] text-[#A7B2C5] leading-snug">
            {selectedLandmark.description}
          </p>
        </div>
      )}

      {/* Interactive Controls Bar */}
      {showControls && (
        <div className="mt-4 p-2.5 rounded-2xl bg-[#172238]/90 border border-[#D6AD60]/30 backdrop-blur-md flex flex-wrap items-center gap-3 text-xs font-mono shadow-lg">
          
          {/* Pause / Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-[#10182A] text-[#D6AD60] border border-[#D6AD60]/30 hover:bg-[#D6AD60] hover:text-[#080D1A] transition-all cursor-pointer"
            title={isPaused ? 'Resume Rotation' : 'Pause Rotation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Speed Toggle (2x default) */}
          <button
            onClick={() => setSpeed(speed === 2 ? 3 : speed === 3 ? 1 : 2)}
            className="px-2.5 py-1 rounded-lg bg-[#10182A] text-[#D6AD60] border border-[#D6AD60]/40 hover:border-[#D6AD60] transition-colors cursor-pointer font-bold"
            title="Cycle Rotation Speed"
          >
            {speed}x SPEED ⚡
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              showGrid
                ? 'bg-[#D6AD60] text-[#080D1A] font-bold border-[#D6AD60]'
                : 'bg-[#10182A] text-[#A7B2C5] border-[#D6AD60]/30 hover:text-[#F3F0E8]'
            }`}
            title="Toggle Lunar Coordinate Grid"
          >
            GRID
          </button>

          {/* Phase Shadow Slider */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#D6AD60]/20">
            <span className="text-[10px] text-[#A7B2C5]">PHASE:</span>
            <input
              type="range"
              min="0"
              max="90"
              value={phaseAngle}
              onChange={(e) => setPhaseAngle(Number(e.target.value))}
              className="w-20 accent-[#D6AD60] bg-[#10182A] h-1.5 rounded"
            />
          </div>

        </div>
      )}

    </div>
  );
};

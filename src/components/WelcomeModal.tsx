import React, { useState } from 'react';
import { Shield, Sparkles, Compass, Moon, Eye, X, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterObservatory: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onEnterObservatory,
}) => {
  const [hoveredConstellation, setHoveredConstellation] = useState<string | null>(null);

  if (!isOpen) return null;

  const imageSrc = '/src/assets/images/samurai_stargazing_sky_1793304103078.jpg';

  const constellations = [
    { id: 'orion', name: 'Orion (The Hunter / 狩人座)', x: '35%', y: '22%', desc: 'Home to the Betelgeuse red supergiant and Great Orion Nebula' },
    { id: 'ursa', name: 'Ursa Major (The Great Bear / 大熊座)', x: '20%', y: '15%', desc: 'Contains the Big Dipper pointing towards Polaris' },
    { id: 'cygnus', name: 'Cygnus (The Celestial Swan / 白鳥座)', x: '70%', y: '18%', desc: 'Flying along the glowing galactic plane of the Milky Way' },
    { id: 'pleiades', name: 'Pleiades Cluster (Subaru / 昴)', x: '12%', y: '30%', desc: 'Ancient Japanese seven-star cluster cherished by samurai' },
  ];

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-[#080D1A] overflow-y-auto flex flex-col justify-between animate-fade-in">
      
      {/* Top Floating Control Bar */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full bg-[#080D1A]/80 backdrop-blur-md text-[#F3F0E8] border border-[#D6AD60] hover:bg-[#D6AD60] hover:text-[#080D1A] font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xl"
          title="Close Welcome Screen & Enter App"
        >
          <span>CLOSE WELCOME</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Full Resolution Samurai Stargazing Sky Stage */}
      <div className="relative w-full h-[65vh] md:h-[72vh] lg:h-[78vh] bg-[#080D1A] overflow-hidden select-none shrink-0">
        <img
          src={imageSrc}
          alt="Samurai looking towards sky full of stars and constellations"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Ambient Top and Bottom Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080D1A] via-transparent to-[#080D1A]/70" />

        {/* Interactive Constellation Points */}
        <div className="absolute inset-0 pointer-events-auto">
          {constellations.map((c) => (
            <div
              key={c.id}
              style={{ left: c.x, top: c.y }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              onMouseEnter={() => setHoveredConstellation(c.id)}
              onMouseLeave={() => setHoveredConstellation(null)}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-[#D6AD60]/40 animate-ping absolute" />
                <div className="w-3 h-3 rounded-full bg-[#D6AD60] border-2 border-[#F3F0E8] shadow-[0_0_12px_#D6AD60]" />
              </div>

              {/* Constellation Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-[#080D1A]/95 border border-[#D6AD60] px-4 py-2 rounded-xl text-xs font-mono shadow-2xl z-30">
                <div className="text-[#D6AD60] font-bold text-sm">{c.name}</div>
                <div className="text-[11px] text-[#A7B2C5]">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Hero Welcome Title Lockup */}
        <div className="absolute bottom-8 left-6 sm:left-12 right-6 sm:right-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 z-20">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080D1A]/90 border border-[#D6AD60]/50 text-xs font-mono text-[#D6AD60]">
              <Shield className="w-4 h-4 text-[#D6AD60]" />
              <span>TSUKUYOMI SAMURAI CELESTIAL GUIDE</span>
              <span className="text-[#A7B2C5]">·</span>
              <span className="text-[#F3F0E8]">月読の星空</span>
            </div>
            <h1 className="font-serif-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F3F0E8] tracking-tight drop-shadow-lg leading-tight">
              Gaze Upon the Starlit Honor
            </h1>
            <p className="text-sm sm:text-base text-[#A7B2C5] font-sans-body max-w-2xl leading-relaxed">
              Step into the ancient observatory where the night sky reveals dark-sky conditions,
              meteor scroll calendars, and AI-driven deep-space photograph analysis.
            </p>
          </div>

          <button
            onClick={() => {
              onEnterObservatory();
              onClose();
            }}
            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D6AD60] via-[#F3F0E8] to-[#D6AD60] text-[#080D1A] font-extrabold text-base tracking-wide hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(214,173,96,0.4)] cursor-pointer shrink-0"
          >
            <span>ENTER OBSERVATORY</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Full-Width Feature Highlights Strip */}
      <div className="p-6 sm:p-12 bg-[#080D1A] border-t border-[#D6AD60]/20 flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 space-y-2">
            <div className="font-mono text-[#D6AD60] font-bold flex items-center gap-2 text-sm">
              <Compass className="w-4 h-4 text-[#D6AD60]" />
              <span>1. WATCHTOWER OBSERVATORY</span>
            </div>
            <p className="text-xs text-[#A7B2C5] leading-relaxed">
              Calculates real-time atmospheric seeing, cloud cover, Bortle light pollution, and the Samurai Night Honor Score.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 space-y-2">
            <div className="font-mono text-[#D6AD60] font-bold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-[#D6AD60]" />
              <span>2. CELESTIAL SCROLL</span>
            </div>
            <p className="text-xs text-[#A7B2C5] leading-relaxed">
              Curated calendar of upcoming meteor showers, total blood eclipses, ISS satellite passes, and rocket launches.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 space-y-2">
            <div className="font-mono text-[#D6AD60] font-bold flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-[#D6AD60]" />
              <span>3. SPIRIT LENS AI</span>
            </div>
            <p className="text-xs text-[#A7B2C5] leading-relaxed">
              Processes astronomical captures with Gemini AI spectral analysis, noise reduction, and celestial object detection.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

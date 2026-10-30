import React from 'react';
import { RevolvingMoon } from './RevolvingMoon';
import { Sparkles, ArrowRight, Eye, Moon, Shield } from 'lucide-react';

interface HeroProps {
  onExploreWatchtower: () => void;
  onExploreSpiritLens: () => void;
  nightHonorScore: number;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreWatchtower,
  onExploreSpiritLens,
  nightHonorScore,
}) => {
  return (
    <section id="hero" className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Title & Celestial Manifesto */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Samurai Observatory Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#172238] border border-[#D6AD60]/30 text-xs font-mono text-[#D6AD60]">
              <Shield className="w-3.5 h-3.5 text-[#D6AD60]" />
              <span>SAMURAI CELESTIAL OBSERVATORY</span>
              <span className="text-[#A7B2C5]">·</span>
              <span className="text-[#F3F0E8]">月読の道</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F3F0E8] leading-[1.15]">
              Master the Night Sky with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6AD60] via-[#F3F0E8] to-[#D6AD60]">
                Celestial Precision
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-base sm:text-lg text-[#A7B2C5] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans-body">
              Tsukuyomi Watch illuminates dark-sky conditions, predicts celestial scroll events,
              and enhances deep-space astronomical photography under the guidance of ancient Japanese skycraft.
            </p>

            {/* Observatory Quick Telemetry Badges (Unboxed metadata style) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs font-mono text-[#A7B2C5] pt-2 border-t border-[#D6AD60]/15">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-[#D6AD60]" />
                <span>MOON: <strong className="text-[#F3F0E8]">18% Crescent</strong></span>
              </div>
              <span className="text-[#D6AD60]/40">·</span>
              <div>
                <span>NEXT: <strong className="text-[#F3F0E8]">Geminids Peak (3d 14h)</strong></span>
              </div>
              <span className="text-[#D6AD60]/40">·</span>
              <div>
                <span>STATION: <strong className="text-[#F3F0E8]">Mt. Fuji 5th (2,305m)</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onExploreWatchtower}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D6AD60] to-[#B88E43] text-[#080D1A] font-bold text-sm tracking-wide hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(214,173,96,0.25)] cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>VIEW WATCHTOWER CONDITIONS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreSpiritLens}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#172238] border border-[#D6AD60]/40 text-[#F3F0E8] hover:bg-[#10182A] hover:border-[#D6AD60] transition-all font-semibold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D6AD60]" />
                <span>OPEN SPIRIT LENS AI</span>
              </button>
            </div>
          </div>

          {/* Right Column: Revolving Moon Feature Stage */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#172238]/60 border border-[#D6AD60]/20 backdrop-blur-sm shadow-[0_10px_40px_rgba(8,13,26,0.6)] flex flex-col items-center">
              
              {/* Revolving Vector Moon Component */}
              <RevolvingMoon size={220} className="my-4" />

              {/* Caption & Status Pill */}
              <div className="mt-4 text-center space-y-1">
                <div className="text-xs font-mono tracking-widest text-[#D6AD60] uppercase">
                  TSUKUYOMI CELESTIAL ORB ☽
                </div>
                <p className="text-xs text-[#A7B2C5]">
                  Continuous lunar surface rotation & orbital ring
                </p>
              </div>

              {/* Honor Score Floating Badge */}
              <div className="mt-4 px-4 py-2 rounded-xl bg-[#080D1A]/90 border border-[#D6AD60]/40 flex items-center gap-3 text-xs font-mono">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[#A7B2C5]">STARGAZING HONOR:</span>
                <span className="text-[#D6AD60] font-bold text-sm">{nightHonorScore} / 100</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

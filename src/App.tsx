/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StarfieldCanvas } from './components/StarfieldCanvas';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WatchtowerSection } from './components/WatchtowerSection';
import { CelestialScrollSection } from './components/CelestialScrollSection';
import { SpiritLensSection } from './components/SpiritLensSection';
import { DojoDashboardSection } from './components/DojoDashboardSection';
import { WelcomeModal } from './components/WelcomeModal';
import { Moon } from 'lucide-react';

export default function App() {
  const [nightHonorScore, setNightHonorScore] = useState<number>(88);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#080D1A] text-[#A7B2C5] font-sans-body selection:bg-[#D6AD60]/30 selection:text-[#F3F0E8] overflow-x-hidden">
      
      {/* Dynamic Background Starfield Canvas */}
      <StarfieldCanvas />

      {/* Sticky Navigation Header */}
      <Header
        nightHonorScore={nightHonorScore}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
      />

      {/* Samurai Stargazing Welcome Modal Overlay */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onEnterObservatory={() => scrollToSection('watchtower')}
      />

      {/* Main Page Layout */}
      <main className="relative z-10">
        
        {/* Hero Section */}
        <Hero
          onExploreWatchtower={() => scrollToSection('watchtower')}
          onExploreSpiritLens={() => scrollToSection('spirit-lens')}
          nightHonorScore={nightHonorScore}
        />

        {/* Major Section 1: WATCHTOWER */}
        <WatchtowerSection onScoreChange={setNightHonorScore} />

        {/* Major Section 2: CELESTIAL SCROLL */}
        <CelestialScrollSection />

        {/* Major Section 3: SPIRIT LENS */}
        <SpiritLensSection />

        {/* Major Section 4: DOJO DASHBOARD */}
        <DojoDashboardSection />

      </main>

      {/* Japanese Observatory Footer */}
      <footer className="relative z-10 py-12 border-t border-[#D6AD60]/20 bg-[#080D1A]/90 backdrop-blur-md text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#172238] border border-[#D6AD60]/40 flex items-center justify-center text-[#D6AD60]">
              <Moon className="w-4 h-4 fill-[#D6AD60]/20" />
            </div>
            <div>
              <div className="font-serif-display text-sm font-bold text-[#F3F0E8]">
                TSUKUYOMI WATCH — 月読
              </div>
              <div className="text-[11px] text-[#A7B2C5]">
                The Samurai’s Celestial Observatory & Stargazing Guide
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-[#A7B2C5]">
            <button onClick={() => setIsWelcomeOpen(true)} className="hover:text-[#D6AD60] transition-colors cursor-pointer text-[#D6AD60]">
              WELCOME SKY
            </button>
            <button onClick={() => scrollToSection('watchtower')} className="hover:text-[#F3F0E8] transition-colors cursor-pointer">
              WATCHTOWER
            </button>
            <button onClick={() => scrollToSection('celestial-scroll')} className="hover:text-[#F3F0E8] transition-colors cursor-pointer">
              CELESTIAL SCROLL
            </button>
            <button onClick={() => scrollToSection('spirit-lens')} className="hover:text-[#F3F0E8] transition-colors cursor-pointer">
              SPIRIT LENS
            </button>
            <button onClick={() => scrollToSection('dojo-dashboard')} className="hover:text-[#F3F0E8] transition-colors cursor-pointer">
              DOJO DASHBOARD
            </button>
          </div>

          <div className="text-[#D6AD60]">
            ✦ PRECISION SKY CENSUS 2026
          </div>

        </div>
      </footer>

    </div>
  );
}

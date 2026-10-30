import React, { useState, useEffect } from 'react';
import { Menu, X, Compass, Moon, Sparkles, Image as ImageIcon } from 'lucide-react';

interface HeaderProps {
  activeSection?: string;
  onNavigate?: (sectionId: string) => void;
  nightHonorScore?: number;
  onOpenWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  nightHonorScore = 88,
  onOpenWelcome,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'watchtower', label: 'WATCHTOWER' },
    { id: 'celestial-scroll', label: 'CELESTIAL SCROLL' },
    { id: 'spirit-lens', label: 'SPIRIT LENS' },
    { id: 'dojo-dashboard', label: 'DOJO DASHBOARD' },
  ];

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#080D1A]/90 backdrop-blur-md border-b border-[#D6AD60]/20 py-3 shadow-[0_4px_20px_rgba(8,13,26,0.8)]'
          : 'bg-gradient-to-b from-[#080D1A]/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar 3-Zone Contract Row */}
        <div className="flex items-center justify-between gap-8">
          {/* Zone 1: Single element brand wordmark */}
          <a
            href="#hero"
            className="flex items-center gap-2.5 font-serif-display text-lg sm:text-xl font-bold tracking-wider text-[#F3F0E8] hover:text-[#D6AD60] transition-colors whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-full bg-[#172238] border border-[#D6AD60]/40 flex items-center justify-center text-[#D6AD60] group-hover:border-[#D6AD60] transition-colors">
              <Moon className="w-4 h-4 fill-[#D6AD60]/20 text-[#D6AD60]" />
            </div>
            <span>TSUKUYOMI WATCH</span>
            <span className="text-xs font-mono text-[#D6AD60] hidden sm:inline-block">月読</span>
          </a>

          {/* Zone 2: 4 concise single-line nav jump links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 font-sans-body text-xs font-semibold tracking-wider text-[#A7B2C5]">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="hover:text-[#F3F0E8] transition-colors whitespace-nowrap shrink-0 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#D6AD60] hover:after:w-full after:transition-all after:duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action + Welcome Screen Trigger */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                className="px-3 py-1.5 rounded-lg bg-[#10182A] border border-[#D6AD60]/30 text-[#D6AD60] hover:bg-[#D6AD60] hover:text-[#080D1A] transition-all text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                title="Open Samurai Welcome Page"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>WELCOME SKY</span>
              </button>
            )}

            <button
              onClick={() => handleLinkClick('watchtower')}
              className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-[#172238] border border-[#D6AD60]/40 text-[#F3F0E8] hover:bg-[#10182A] hover:border-[#D6AD60] transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(214,173,96,0.1)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HONOR SCORE:</span>
              <span className="text-[#D6AD60] font-bold">{nightHonorScore}/100</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#172238] border border-[#D6AD60]/30 text-[#F3F0E8] hover:text-[#D6AD60] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-[#D6AD60]/20 bg-[#10182A] rounded-xl p-4 space-y-3 shadow-2xl">
            {onOpenWelcome && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWelcome();
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-[#D6AD60] bg-[#172238] rounded-lg border border-[#D6AD60]/30 flex items-center justify-between"
              >
                <span>OPEN SAMURAI WELCOME SKY</span>
                <ImageIcon className="w-4 h-4" />
              </button>
            )}

            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-[#A7B2C5] hover:text-[#F3F0E8] hover:bg-[#172238] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{link.label}</span>
                <Compass className="w-4 h-4 text-[#D6AD60]" />
              </button>
            ))}

            <div className="pt-2 border-t border-[#D6AD60]/10">
              <button
                onClick={() => handleLinkClick('watchtower')}
                className="w-full py-2 px-3 text-xs font-mono rounded-lg bg-[#172238] border border-[#D6AD60]/40 text-[#F3F0E8] flex items-center justify-between cursor-pointer"
              >
                <span>NIGHT HONOR SCORE</span>
                <span className="text-[#D6AD60] font-bold">{nightHonorScore}/100</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { CELESTIAL_EVENTS } from '../data/astronomyData';
import { CelestialEvent, EventType } from '../types';
import { Calendar, Filter, Sparkles, Star, Bell, Clock, Search, ExternalLink, ChevronRight } from 'lucide-react';

export const CelestialScrollSection: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [selectedEventModal, setSelectedEventModal] = useState<CelestialEvent | null>(null);

  const eventTypes: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Events', icon: '✦' },
    { id: 'meteor_shower', label: 'Meteor Showers', icon: '☄' },
    { id: 'eclipse', label: 'Eclipses', icon: '🌘' },
    { id: 'moon_phase', label: 'Moon Phases', icon: '☽' },
    { id: 'iss_pass', label: 'ISS Passes', icon: '🛰' },
    { id: 'rocket_launch', label: 'Rocket Launches', icon: '🚀' },
  ];

  const filteredEvents = CELESTIAL_EVENTS.filter((evt) => {
    const matchesType = selectedType === 'all' || evt.type === selectedType;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.japaneseTitle.includes(searchQuery) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleReminder = (id: string) => {
    setReminders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="celestial-scroll" className="py-16 md:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Small Slowly Rotating Moon Illustration beside heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="flex items-start gap-4">
            
            {/* Small Slowly Rotating Moon Illustration */}
            <div className="relative w-12 h-12 mt-1 rounded-full overflow-hidden border border-[#D6AD60]/40 shadow-[0_0_15px_rgba(214,173,96,0.2)] shrink-0 hidden sm:block">
              <svg
                width="96"
                height="48"
                viewBox="0 0 96 48"
                className="absolute top-0 left-0 h-full animate-[spin_20s_linear_infinite]"
              >
                <circle cx="24" cy="24" r="22" fill="#F3F0E8" />
                <circle cx="18" cy="18" r="4" fill="#C7C1B2" />
                <circle cx="30" cy="28" r="6" fill="#ABA498" />
                <circle cx="72" cy="24" r="22" fill="#F3F0E8" />
                <circle cx="66" cy="18" r="4" fill="#C7C1B2" />
                <circle cx="78" cy="28" r="6" fill="#ABA498" />
              </svg>
            </div>

            <SectionHeading
              title="CELESTIAL SCROLL"
              kanjiTitle="天体巻物"
              subtitle="The samurai calendar of upcoming meteor showers, lunar eclipses, satellite passes, and deep-space conjunctions."
              symbol="☽"
              className="mb-0"
            />
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A7B2C5]" />
            <input
              type="text"
              placeholder="Search scroll events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#172238] border border-[#D6AD60]/30 text-xs text-[#F3F0E8] placeholder-[#A7B2C5]/60 focus:outline-none focus:border-[#D6AD60] transition-colors"
            />
          </div>
        </div>

        {/* Clearly Labeled Filter Tabs */}
        <div className="mb-8 p-1.5 rounded-2xl bg-[#10182A] border border-[#D6AD60]/20 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#D6AD60] px-3 py-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">EVENT TYPE FILTER:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 flex-1">
            {eventTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#172238] text-[#F3F0E8] border border-[#D6AD60] shadow-[0_0_12px_rgba(214,173,96,0.2)]'
                      : 'text-[#A7B2C5] hover:text-[#F3F0E8] hover:bg-[#172238]/50 border border-transparent'
                  }`}
                >
                  <span className="text-sm">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isSetReminder = !!reminders[evt.id];
            return (
              <div
                key={evt.id}
                className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/60 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${evt.badgeColor || 'text-[#D6AD60] border-[#D6AD60]/30 bg-[#D6AD60]/10'}`}>
                      {evt.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-serif-display text-sm text-[#D6AD60]">
                      {evt.japaneseTitle}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif-display text-xl font-bold text-[#F3F0E8] group-hover:text-[#D6AD60] transition-colors leading-snug">
                    {evt.title}
                  </h3>

                  {/* Date & Peak Time (Unboxed Metadata) */}
                  <div className="mt-3 py-2 border-y border-[#D6AD60]/15 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#A7B2C5]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#D6AD60]" />
                      <span className="text-[#F3F0E8] font-semibold">{evt.dateStr}</span>
                    </div>
                    <span className="text-[#D6AD60]/40">·</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D6AD60]" />
                      <span>{evt.peakTime}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-[#A7B2C5] line-clamp-3 leading-relaxed font-sans-body">
                    {evt.description}
                  </p>

                  {/* Rating & Rate */}
                  <div className="mt-4 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-[#A7B2C5]">RATING:</span>
                      <div className="flex text-[#D6AD60]">
                        {Array.from({ length: evt.visibilityRating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#D6AD60]" />
                        ))}
                      </div>
                    </div>
                    {evt.zhrOrMagnitude && (
                      <span className="text-[#F3F0E8] font-bold bg-[#10182A] px-2 py-0.5 rounded border border-[#D6AD60]/20">
                        {evt.zhrOrMagnitude}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-[#D6AD60]/15 flex items-center gap-3">
                  <button
                    onClick={() => toggleReminder(evt.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSetReminder
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#10182A] text-[#A7B2C5] border border-[#D6AD60]/30 hover:text-[#F3F0E8] hover:border-[#D6AD60]'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isSetReminder ? 'REMINDER SET ✓' : 'SET REMINDER'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedEventModal(evt)}
                    className="p-2 rounded-xl bg-[#10182A] text-[#D6AD60] border border-[#D6AD60]/30 hover:bg-[#D6AD60] hover:text-[#080D1A] transition-colors cursor-pointer"
                    title="View Observation Guide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Event Detail Modal */}
        {selectedEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D1A]/80 backdrop-blur-md">
            <div className="max-w-lg w-full p-6 rounded-3xl bg-[#172238] border border-[#D6AD60] shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-[#D6AD60]/20 pb-3">
                <span className="text-xs font-mono text-[#D6AD60] uppercase">SAMURAI OBSERVATION GUIDE</span>
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="text-[#A7B2C5] hover:text-[#F3F0E8] font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif-display text-2xl font-bold text-[#F3F0E8]">
                  {selectedEventModal.title}
                </h3>
                <p className="text-xs font-mono text-[#D6AD60]">
                  Target Constellation: {selectedEventModal.constellationOrTarget}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#10182A] border border-[#D6AD60]/20 space-y-2">
                <div className="text-xs font-mono text-[#D6AD60] uppercase">SAMURAI FIELD ADVICE:</div>
                <p className="text-xs text-[#A7B2C5] leading-relaxed">
                  {selectedEventModal.observationTips}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-5 py-2 rounded-xl bg-[#D6AD60] text-[#080D1A] font-bold text-xs hover:brightness-110 transition-all"
                >
                  CLOSE GUIDE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

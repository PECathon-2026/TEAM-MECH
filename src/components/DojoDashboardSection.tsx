import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { INITIAL_LOGBOOK, CELESTIAL_EVENTS, LOCATIONS } from '../data/astronomyData';
import { LogbookEntry } from '../types';
import { BookOpen, Calendar, Compass, Eye, Moon, Plus, Star, Award, Shield, CheckCircle2 } from 'lucide-react';

export const DojoDashboardSection: React.FC = () => {
  const [logbook, setLogbook] = useState<LogbookEntry[]>(INITIAL_LOGBOOK);
  const [newTarget, setNewTarget] = useState('');
  const [newLocation, setNewLocation] = useState('Mt. Fuji 5th Station');
  const [newNotes, setNewNotes] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showLogForm, setShowLogForm] = useState(false);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim()) return;

    const newEntry: LogbookEntry = {
      id: 'log-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: newLocation,
      targetObject: newTarget,
      honorScore: 90,
      notes: newNotes || 'Celestial observation recorded in samurai logbook.',
      equipment: 'Standard Field Optics',
      rating: newRating,
    };

    setLogbook([newEntry, ...logbook]);
    setNewTarget('');
    setNewNotes('');
    setShowLogForm(false);
  };

  return (
    <section id="dojo-dashboard" className="py-16 md:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BIG Section Title */}
        <SectionHeading
          title="DOJO DASHBOARD"
          kanjiTitle="道場"
          subtitle="Executive stargazing overview, lunar phase schedule, activity summaries, and your personal samurai observatory logbook."
          symbol="⛩"
        />

        {/* Dashboard Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Card 1: Stargazing Honor Index Overview */}
          <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#D6AD60]">
                <span>HONOR SUMMARY</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-3xl font-serif-display font-bold text-[#F3F0E8]">
                88 <span className="text-xs font-mono text-[#D6AD60] font-normal">/ 100</span>
              </div>
              <div className="mt-2 text-xs text-[#A7B2C5]">
                Atmospheric conditions at Mt. Fuji 5th Station are optimal for deep-sky observation tonight.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D6AD60]/15 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal Seeing Window Active</span>
            </div>
          </div>

          {/* Card 2: Lunar Phase Calendar Summary */}
          <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#D6AD60]">
                <span>LUNAR PHASE</span>
                <Moon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-serif-display font-bold text-[#F3F0E8]">
                Waning Crescent
              </div>
              <div className="mt-2 text-xs text-[#A7B2C5]">
                18% Illumination. Moonrise at 03:12 JST. Minimal lunar glow interference.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D6AD60]/15 text-xs font-mono text-[#D6AD60]">
              Next Full Moon: 12 Days
            </div>
          </div>

          {/* Card 3: Upcoming Priority Event */}
          <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#D6AD60]">
                <span>HIGHLIGHT EVENT</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-lg font-serif-display font-bold text-[#F3F0E8] line-clamp-1">
                {CELESTIAL_EVENTS[0].title}
              </div>
              <div className="mt-2 text-xs text-[#A7B2C5]">
                Peak: {CELESTIAL_EVENTS[0].dateStr} · {CELESTIAL_EVENTS[0].zhrOrMagnitude}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#D6AD60]/15 text-xs font-mono text-[#D6AD60]">
              Constellation: {CELESTIAL_EVENTS[0].constellationOrTarget}
            </div>
          </div>

          {/* Card 4: Observatory Log Count */}
          <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#D6AD60]">
                <span>SAMURAI LOGBOOK</span>
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-3xl font-serif-display font-bold text-[#F3F0E8]">
                {logbook.length} <span className="text-xs font-mono text-[#A7B2C5] font-normal">ENTRIES</span>
              </div>
              <div className="mt-2 text-xs text-[#A7B2C5]">
                Recorded astronomical observations and telescope star logs.
              </div>
            </div>
            <button
              onClick={() => setShowLogForm(true)}
              className="mt-4 pt-3 border-t border-[#D6AD60]/15 text-xs font-mono text-[#D6AD60] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>RECORD NEW OBSERVATION</span>
            </button>
          </div>

        </div>

        {/* Samurai Observatory Logbook List Stage */}
        <div className="p-8 rounded-3xl bg-[#172238] border border-[#D6AD60]/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D6AD60]/15 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#D6AD60] uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>SAMURAI STARGAZING LOGBOOK</span>
              </div>
              <h3 className="font-serif-display text-2xl font-bold text-[#F3F0E8]">
                Personal Observation Chronicle
              </h3>
            </div>

            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-4 py-2 rounded-xl bg-[#D6AD60] text-[#080D1A] font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showLogForm ? 'CANCEL ENTRY' : 'ADD NEW LOG'}</span>
            </button>
          </div>

          {/* Log Entry Form Modal / Panel */}
          {showLogForm && (
            <form onSubmit={handleAddLog} className="p-6 rounded-2xl bg-[#10182A] border border-[#D6AD60]/40 space-y-4">
              <div className="text-xs font-mono text-[#D6AD60] uppercase font-bold">
                NEW OBSERVATION LOG RECORD
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-[#A7B2C5] block mb-1">TARGET CELESTIAL OBJECT:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturn Rings, Messier 42"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#172238] border border-[#D6AD60]/30 text-[#F3F0E8] focus:outline-none focus:border-[#D6AD60]"
                  />
                </div>

                <div>
                  <label className="text-[#A7B2C5] block mb-1">OBSERVATORY LOCATION:</label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#172238] border border-[#D6AD60]/30 text-[#F3F0E8] focus:outline-none focus:border-[#D6AD60]"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs font-mono">
                <label className="text-[#A7B2C5] block mb-1">FIELD NOTES & VISUAL CLARITY:</label>
                <textarea
                  rows={3}
                  placeholder="Record seeing quality, magnification used, and visual details..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#172238] border border-[#D6AD60]/30 text-[#F3F0E8] focus:outline-none focus:border-[#D6AD60]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#D6AD60] text-[#080D1A] font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                >
                  SAVE LOG ENTRY
                </button>
              </div>
            </form>
          )}

          {/* Logbook Entries Grid */}
          <div className="space-y-4">
            {logbook.map((log) => (
              <div
                key={log.id}
                className="p-5 rounded-2xl bg-[#10182A] border border-[#D6AD60]/20 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F3F0E8] font-serif-display">
                      {log.targetObject}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#D6AD60]/10 text-[#D6AD60] text-[10px] border border-[#D6AD60]/30">
                      HONOR SCORE: {log.honorScore}
                    </span>
                  </div>
                  <div className="text-[#A7B2C5]">
                    {log.date} at {log.time} · Location: {log.location}
                  </div>
                  <p className="text-[#A7B2C5] font-sans-body text-xs pt-1">
                    "{log.notes}"
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[#D6AD60] shrink-0">
                  {Array.from({ length: log.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D6AD60]" />
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

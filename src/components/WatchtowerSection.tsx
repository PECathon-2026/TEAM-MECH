import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { StargazingCondition, StargazingLocation } from '../types';
import { LOCATIONS, INITIAL_CONDITIONS } from '../data/astronomyData';
import { Cloud, Eye, Wind, Thermometer, MapPin, Sparkles, Navigation, Droplets, SunMedium, ShieldAlert } from 'lucide-react';

interface WatchtowerSectionProps {
  onScoreChange?: (score: number) => void;
}

export const WatchtowerSection: React.FC<WatchtowerSectionProps> = ({ onScoreChange }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('fuji');
  const [conditions, setConditions] = useState<Record<string, StargazingCondition>>(INITIAL_CONDITIONS);

  const currentCondition = conditions[selectedLocationId] || conditions['fuji'];

  const handleLocationSelect = (loc: StargazingLocation) => {
    setSelectedLocationId(loc.id);
    if (onScoreChange && conditions[loc.id]) {
      onScoreChange(conditions[loc.id].nightHonorScore);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <section id="watchtower" className="py-16 md:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BIG Main Section Title */}
        <SectionHeading
          title="WATCHTOWER"
          kanjiTitle="物見櫓"
          subtitle="Real-time dark-sky atmospheric conditions, astronomical seeing, and the Samurai Night Honor Score."
          symbol="⛩"
        />

        {/* Location Selector Tabs */}
        <div className="mb-8 p-1.5 rounded-2xl bg-[#10182A] border border-[#D6AD60]/20 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#D6AD60] px-3 py-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">SELECT OBSERVATORY:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 flex-1 justify-start md:justify-end">
            {LOCATIONS.map((loc) => {
              const isSelected = loc.id === selectedLocationId;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleLocationSelect(loc)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#172238] text-[#F3F0E8] border border-[#D6AD60] shadow-[0_0_12px_rgba(214,173,96,0.2)]'
                      : 'text-[#A7B2C5] hover:text-[#F3F0E8] hover:bg-[#172238]/50 border border-transparent'
                  }`}
                >
                  <span className="font-serif-display text-[#D6AD60]">{loc.kanji}</span>
                  <span>{loc.name}</span>
                  <span className="text-[10px] font-mono text-[#A7B2C5]">
                    (Bortle {loc.bortleClass})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WATCHTOWER Main Stage: Honor Score + Weather Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Visual Focus: Night Honor Score Gauge Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-[#172238] border border-[#D6AD60]/30 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D6AD60]/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xs font-mono text-[#D6AD60] tracking-wider uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>STARGAZING HONOR INDEX</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getScoreColor(currentCondition.nightHonorScore)}`}>
                  ● {currentCondition.statusLabel}
                </span>
              </div>

              {/* Central Radial Honor Score */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  
                  {/* Outer SVG Gauge Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-[#10182A]"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-[#D6AD60]"
                      strokeWidth="8"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * currentCondition.nightHonorScore) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                  </svg>

                  {/* Inner Score Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-serif-display text-5xl font-extrabold text-[#F3F0E8] tracking-tight">
                      {currentCondition.nightHonorScore}
                    </span>
                    <span className="text-xs font-mono text-[#D6AD60] uppercase mt-1">/ 100 HONOR</span>
                  </div>
                </div>

                <h3 className="mt-4 font-serif-display text-xl font-bold text-[#F3F0E8]">
                  {currentCondition.location.name}
                </h3>
                <p className="mt-1 text-xs text-[#A7B2C5] max-w-sm font-sans-body">
                  {currentCondition.lightPollutionDescription}
                </p>
              </div>
            </div>

            {/* Quick Metrics Footer Strip */}
            <div className="pt-4 border-t border-[#D6AD60]/15 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[#A7B2C5] block">COORDINATES:</span>
                <span className="text-[#F3F0E8] font-semibold">{currentCondition.location.lat.toFixed(2)}° N, {currentCondition.location.lng.toFixed(2)}° E</span>
              </div>
              <div>
                <span className="text-[#A7B2C5] block">ALTITUDE:</span>
                <span className="text-[#D6AD60] font-semibold">{currentCondition.location.elevation}m ASL</span>
              </div>
            </div>

          </div>

          {/* Right 7 Columns: Weather Condition Grid Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Cloud Cover */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">CLOUD COVER</span>
                <Cloud className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#F3F0E8]">
                  {currentCondition.cloudCoverPercentage}%
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  {currentCondition.cloudCoverPercentage < 15 ? 'Clear Unobstructed Sky' : 'Partially Scattered Cloud Coverage'}
                </div>
              </div>
              <div className="mt-3 w-full bg-[#10182A] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#D6AD60] h-full rounded-full"
                  style={{ width: `${currentCondition.cloudCoverPercentage}%` }}
                />
              </div>
            </div>

            {/* Card 2: Light Pollution / Bortle Scale */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">LIGHT POLLUTION</span>
                <SunMedium className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#D6AD60]">
                  Class {currentCondition.location.bortleClass}
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  Bortle Scale (1 = Pristine Dark, 9 = Inner City)
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400">
                {currentCondition.location.bortleClass <= 3 ? '✓ Excellent Milky Way Visibility' : '⚠ Elevated Light Glow'}
              </div>
            </div>

            {/* Card 3: Atmospheric Seeing & Transparency */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">SEEING & TRANSPARENCY</span>
                <Eye className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#F3F0E8]">
                  {currentCondition.seeingQuality} / 5
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  Sub-arcsecond steady atmosphere for high power planetary viewing
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full ${
                      s <= currentCondition.seeingQuality ? 'bg-[#D6AD60]' : 'bg-[#10182A]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Card 4: Humidity & Visibility */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">HUMIDITY & VISIBILITY</span>
                <Droplets className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#F3F0E8]">
                  {currentCondition.humidityPercentage}% <span className="text-xs text-[#A7B2C5] font-normal">/ {currentCondition.visibilityKm}km</span>
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  Low dew condensation risk on telescope optics
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-[#A7B2C5]">
                Dew Point: {Math.round(currentCondition.temperatureCelsius - (100 - currentCondition.humidityPercentage) / 5)}°C
              </div>
            </div>

            {/* Card 5: Wind Speed */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">WIND SPEED</span>
                <Wind className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#F3F0E8]">
                  {currentCondition.windSpeedKmH} <span className="text-xs text-[#A7B2C5] font-normal">km/h</span>
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  Gentle breeze; safe for long-exposure camera tracking mounts
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400">
                ✓ Stable mount tracking
              </div>
            </div>

            {/* Card 6: Temperature */}
            <div className="p-5 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 hover:border-[#D6AD60]/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#A7B2C5] tracking-wider uppercase">TEMPERATURE</span>
                <Thermometer className="w-5 h-5 text-[#D6AD60]" />
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-[#F3F0E8]">
                  {currentCondition.temperatureCelsius}°C
                </div>
                <div className="mt-1 text-xs text-[#A7B2C5]">
                  Sensor thermal noise reduced at lower temperatures
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-[#A7B2C5]">
                Thermal equilibrium reached
              </div>
            </div>

          </div>
        </div>

        {/* Map Representation Container */}
        <div className="mt-8 p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D6AD60] uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>INTERACTIVE MAP RADAR LOCATION</span>
            </div>
            <h4 className="font-serif-display text-lg font-bold text-[#F3F0E8]">
              {currentCondition.location.name} ({currentCondition.location.kanji})
            </h4>
            <p className="text-xs text-[#A7B2C5]">
              Positioned at Latitude {currentCondition.location.lat}° N, Longitude {currentCondition.location.lng}° E
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#D6AD60] bg-[#10182A] px-3 py-1.5 rounded-lg border border-[#D6AD60]/30">
              RADAR ACTIVE
            </span>
            <button
              onClick={() => {
                alert(`Observatory radar focused on ${currentCondition.location.name}`);
              }}
              className="px-4 py-2 rounded-xl bg-[#D6AD60] text-[#080D1A] font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
            >
              LOCK OBSERVATORY TARGET
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

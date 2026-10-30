import React from 'react';

interface SectionHeadingProps {
  title: string;
  kanjiTitle?: string;
  subtitle: string;
  symbol?: string;
  id?: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  kanjiTitle,
  subtitle,
  symbol = '✦',
  id,
  className = '',
}) => {
  return (
    <div id={id} className={`scroll-mt-24 mb-8 text-center md:text-left ${className}`}>
      {/* Kicker badge / symbol */}
      <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#D6AD60] uppercase mb-2">
        <span className="text-sm">{symbol}</span>
        {kanjiTitle && <span className="font-serif-display text-sm tracking-wider text-[#F3F0E8]/70">{kanjiTitle}</span>}
        <span className="h-px w-8 bg-gradient-to-r from-[#D6AD60]/60 to-transparent" />
      </div>

      {/* Main Section Title */}
      <h2 className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F3F0E8] leading-tight">
        {title}
      </h2>

      {/* Subtitle */}
      <p className="mt-2 text-sm sm:text-base text-[#A7B2C5] max-w-3xl leading-relaxed font-sans-body">
        {subtitle}
      </p>

      {/* Subtle Bottom Gold Hairline Divider */}
      <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
        <div className="h-[2px] w-12 bg-[#D6AD60]" />
        <div className="h-[1px] w-24 bg-[#D6AD60]/30" />
        <div className="h-[1px] w-12 bg-[#D6AD60]/10" />
      </div>
    </div>
  );
};

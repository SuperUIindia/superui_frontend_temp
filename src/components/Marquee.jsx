import React from 'react';
import {
  Code,
  Layout,
  Globe,
  Zap,
  ShoppingBag,
  Database,
  Cpu,
  Search,
  CheckCircle,
  Sparkles,
  Server,
  Smartphone
} from 'lucide-react';
import { useContent } from '../lib/siteContent';

// Icons cycle per chip so the DB only has to store text + highlight flag.
const CHIP_ICONS = [
  Globe,
  Code,
  ShoppingBag,
  Sparkles,
  Layout,
  Zap,
  CheckCircle,
  Server,
  Cpu,
  Database,
  Search,
  Smartphone
];

export default function Marquee() {
  const content = useContent('marquee');

  // Each DB row is { text, highlight }; the icon is assigned by position so the
  // visual rhythm is preserved without duplicating component refs in Mongo.
  const rows = (Array.isArray(content.rows) ? content.rows : []).map((row) =>
    (Array.isArray(row) ? row : []).map((item, index) => ({
      text: typeof item === 'string' ? item : item?.text,
      highlight: typeof item === 'string' ? false : Boolean(item?.highlight),
      icon: CHIP_ICONS[index % CHIP_ICONS.length]
    }))
  );
  const row1 = rows[0] || [];
  const row2 = rows[1] || [];

  const Chip = ({ item }) => {
    const IconComponent = item.icon;
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
          item.highlight
            ? 'bg-white text-[#111111] border-[#EDEDED] shadow-sm hover:border-[#FF5E00]/40 hover:shadow-[#FF5E00]/10 hover:text-[#FF5E00]'
            : 'bg-[#FAFAFA] text-[#6B6B6B] border-[#EDEDED] hover:bg-white hover:text-[#111111] hover:border-[#7C3AED]/40'
        }`}
      >
        <IconComponent
          className={`w-3.5 h-3.5 ${
            item.highlight ? 'text-[#FF5E00]' : 'text-[#7C3AED]'
          }`}
        />
        <span>{item.text}</span>
      </div>
    );
  };

  return (
    <div className="relative py-8 overflow-hidden bg-gradient-to-b from-transparent via-[#FAFAFA]/60 to-transparent border-y border-[#EDEDED]/60 select-none">
      {/* Edge gradient fades for luxury depth */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

      {/* Row 1: Leftward infinite marquee */}
      <div className="marquee-container flex overflow-hidden mb-3">
        <div className="marquee-track flex gap-3 shrink-0 animate-marquee-left">
          {row1.map((item, idx) => (
            <Chip key={`r1-a-${idx}`} item={item} />
          ))}
          {row1.map((item, idx) => (
            <Chip key={`r1-b-${idx}`} item={item} />
          ))}
        </div>
        <div className="marquee-track flex gap-3 shrink-0 animate-marquee-left" aria-hidden="true">
          {row1.map((item, idx) => (
            <Chip key={`r1-c-${idx}`} item={item} />
          ))}
          {row1.map((item, idx) => (
            <Chip key={`r1-d-${idx}`} item={item} />
          ))}
        </div>
      </div>

      {/* Row 2: Rightward infinite marquee */}
      <div className="marquee-container flex overflow-hidden">
        <div className="marquee-track flex gap-3 shrink-0 animate-marquee-right">
          {row2.map((item, idx) => (
            <Chip key={`r2-a-${idx}`} item={item} />
          ))}
          {row2.map((item, idx) => (
            <Chip key={`r2-b-${idx}`} item={item} />
          ))}
        </div>
        <div className="marquee-track flex gap-3 shrink-0 animate-marquee-right" aria-hidden="true">
          {row2.map((item, idx) => (
            <Chip key={`r2-c-${idx}`} item={item} />
          ))}
          {row2.map((item, idx) => (
            <Chip key={`r2-d-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

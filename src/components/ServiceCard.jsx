import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Palette,
  Code2,
  Server,
  Wrench,
  ShieldCheck,
  Cloud,
  Package,
  BookOpen,
  TrendingUp,
  Cpu,
  CreditCard,
  Network,
  ArrowUpRight
} from 'lucide-react';

const ICON_MAP = {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Palette,
  Code2,
  Server,
  Wrench,
  ShieldCheck,
  Cloud,
  Package,
  BookOpen,
  TrendingUp,
  Cpu,
  CreditCard,
  Network
};

export default function ServiceCard({ service, index, onClick }) {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = ICON_MAP[service.icon] || Globe;
  const items = Array.isArray(service.items) ? service.items : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.5,
        delay: shouldReduceMotion ? 0 : (index % 3) * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={shouldReduceMotion ? {} : { y: -6 }}
      onClick={() => onClick(service)}
      className="group relative cursor-pointer flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border border-[#EDEDED] transition-all duration-300 hover:border-transparent hover:shadow-[0_12px_32px_rgba(255,94,0,0.12),0_4px_16px_rgba(124,58,237,0.08)] overflow-hidden"
    >
      {/* Subtle border glow gradient on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-transparent bg-gradient-to-br from-[#FF5E00]/40 via-transparent to-[#7C3AED]/40 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] [mask-composite:exclude]"
        aria-hidden="true"
      />

      {/* Top Bar: Icon + Badge */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] flex items-center justify-center text-[#FF5E00] transition-all duration-300 group-hover:bg-[#FFF1E8] group-hover:border-[#FF5E00]/30 group-hover:rotate-6">
            <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#EDEDED] text-[#6B6B6B] group-hover:text-[#7C3AED] group-hover:border-[#7C3AED]/20 group-hover:bg-[#F3EEFF] transition-colors">
            {service.badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#111111] mb-2 tracking-tight transition-colors group-hover:text-[#FF5E00]">
          {service.title}
        </h3>

        {/* One-line Description */}
        <p className="text-sm text-[#6B6B6B] leading-relaxed line-clamp-2 mb-4">
          {service.description}
        </p>

        {/* Sub-services delivered under this category */}
        {items.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li
                key={item}
                className="text-[11px] leading-none font-medium text-[#6B6B6B] px-2 py-1.5 rounded-lg bg-[#FAFAFA] border border-[#EDEDED] transition-colors group-hover:border-[#FF5E00]/20 group-hover:bg-[#FFF1E8]/60 group-hover:text-[#111111]"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom CTA trigger */}
      <div className="mt-6 pt-4 border-t border-[#EDEDED]/60 flex items-center justify-between text-xs font-semibold text-[#111111] group-hover:text-[#FF5E00] transition-colors">
        <span>Request service</span>
        <div className="w-6 h-6 rounded-full bg-[#FAFAFA] group-hover:bg-[#FFF1E8] flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="w-3.5 h-3.5 text-[#6B6B6B] group-hover:text-[#FF5E00]" />
        </div>
      </div>
    </motion.div>
  );
}
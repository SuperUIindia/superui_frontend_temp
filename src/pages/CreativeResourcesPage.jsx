import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Sparkles, Palette } from 'lucide-react';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { trackVisit } from '../lib/tracking';

export default function CreativeResourcesPage() {
  useEffect(() => {
    trackVisit('/creative-resources');
  }, []);

  useEffect(() => {
    document.title = 'Creative Resources — Design Assets & Code Resources | SuperUI';
  }, []);

  const features = [
    {
      icon: Palette,
      title: 'Design Assets',
      description: 'UI kits, icons, illustrations, and Figma resources for designers.',
      accent: '#FF5E00',
      bg: '#FFF1E8',
      text: '#FF5E00'
    },
    {
      icon: Layers,
      title: 'Code Resources',
      description: 'Reusable code snippets, starter templates, and developer boilerplates.',
      accent: '#7C3AED',
      bg: '#F3EEFF',
      text: '#7C3AED'
    },
    {
      icon: Sparkles,
      title: 'Creative Tools',
      description: 'Mini-courses, checklists, and creative assets to speed up delivery.',
      accent: '#FF5E00',
      bg: '#FFF1E8',
      text: '#FF5E00'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-white text-[#111111]">
      <Navbar onOpenContactModal={() => {}} />

      <main className="flex-1 pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3EEFF] border border-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
              Coming Soon
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#111111] tracking-tight leading-[1.15] mb-6">
              Creative Resources{' '}
              <span className="text-[#FF5E00]">For Creators</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#6B6B6B] leading-relaxed">
              Design assets, code resources, and creative tools to help you ship faster — coming soon.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-[#EDEDED] bg-white p-6 sm:p-8 hover:border-[#7C3AED]/40 hover:shadow-[0_12px_32px_rgba(124,58,237,0.1)] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] flex items-center justify-center mb-4">
                  <feature.icon className={`w-6 h-6 text-[#111111]`} />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button variant="outline" size="lg" icon={ArrowRight} onClick={() => {}}>
              Notify Me When Available
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

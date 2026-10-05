import React, { useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import Blobs from '../components/Blobs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';
import { useContent } from '../lib/siteContent';
import { trackVisit } from '../lib/tracking';

/**
 * Standalone enquiry form at /enquiryform.
 *
 * The same ContactForm component as the home contact section, posting to the
 * same POST /api/leads endpoint and therefore the same MongoDB collection - so
 * every submission lands in Admin > Leads alongside the home-page ones, with no
 * second code path to keep in sync. Only the presentation differs: a white page
 * with drifting orange/violet circles behind a frosted-glass panel.
 */
export default function EnquiryForm() {
  const shouldReduceMotion = useReducedMotion();
  const content = useContent('contact');

  useEffect(() => {
    trackVisit('/enquiryform');
  }, []);

  // The navbar CTA has no dialog to open on this page, so it scrolls to the form.
  const scrollToForm = useCallback(() => {
    const target = document.getElementById('enquiry-form');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-white text-[#111111]">
      <Blobs />

      {/* Extra circles behind the glass panel, so the frosted surface has
          something coloured to refract. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-[18%] -right-[10%] h-[520px] w-[520px] rounded-full bg-[#FF5E00]/20 blur-[110px] animate-float-slow"
          style={shouldReduceMotion ? undefined : { animationPlayState: 'running' }}
        />
        <div
          className="absolute top-[10%] left-[8%] h-[420px] w-[420px] rounded-full bg-[#7C3AED]/20 blur-[110px] animate-float-reverse"
          style={shouldReduceMotion ? undefined : { animationPlayState: 'running' }}
        />
        <div
          className="absolute bottom-[8%] right-[18%] h-[380px] w-[380px] rounded-full bg-[#7C3AED]/10 blur-[100px] animate-float-slow"
          style={shouldReduceMotion ? undefined : { animationDelay: '-6s', animationPlayState: 'running' }}
        />
      </div>

      <Navbar onOpenContactModal={scrollToForm} />

      <main className="flex-1 pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] pb-2">
              {content.sectionTitle} <span className="text-[#FF5E00]">{content.sectionHighlight}</span>
            </h1>
            <p className="text-base sm:text-lg text-[#6B6B6B] mt-4 leading-relaxed">
              {content.sectionSubtitle}
            </p>
          </motion.div>

          {/* Frosted-glass panel holding the form */}
          <motion.div
            id="enquiry-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-white/70 bg-white/60 backdrop-blur-xl backdrop-saturate-150 shadow-2xl shadow-[#FF5E00]/10 overflow-hidden scroll-mt-28"
          >
            {/* Gradient hairline along the top edge of the glass */}
            <div
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF5E00]/60 to-transparent"
              aria-hidden="true"
            />

            <div className="p-6 sm:p-10">
              <div className="text-center mb-7">
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#111111] tracking-tight">
                  {content.formCardTitle}
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-2.5 max-w-md mx-auto">{content.formCardSubtitle}</p>
              </div>

              {/* Same component, same endpoint, same database as the home page.
                  The id prefix keeps its field ids unique to this page. */}
              <ContactForm idPrefix="enquiry" />
            </div>
          </motion.div>

          {/* Reassurance row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 grid gap-4 sm:grid-cols-3 text-center"
          >
            <div className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur-md p-4">
              <Mail className="w-5 h-5 mx-auto text-[#FF5E00]" />
              <p className="text-sm font-semibold mt-2">Reply within 24 hours</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Our engineering team, not a bot</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur-md p-4">
              <ShieldCheck className="w-5 h-5 mx-auto text-[#7C3AED]" />
              <p className="text-sm font-semibold mt-2">NDA on request</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Confidential ideas stay confidential</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur-md p-4">
              <Phone className="w-5 h-5 mx-auto text-[#FF5E00]" />
              <p className="text-sm font-semibold mt-2">Fixed-price quote</p>
              <p className="text-xs text-[#6B6B6B] mt-1">No hidden charges, no surprises</p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer onSelectService={scrollToForm} />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import Blobs from '../components/Blobs';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import ServicesSection from '../components/ServicesSection';
import HowItWorks from '../components/HowItWorks';
import WhyUs from '../components/WhyUs';
import ContactSection from '../components/ContactSection';
import CtaBand from '../components/CtaBand';
import Footer from '../components/Footer';
import ContactModal from '../components/ContactModal';
import OfferPopup from '../components/OfferPopup';
import { trackVisit } from '../lib/tracking';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // Track initial visit on mount (once per session)
  useEffect(() => {
    trackVisit('/');
  }, []);

  const handleOpenModal = (serviceTitle = '') => {
    setSelectedService(serviceTitle);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-white text-[#111111]">
      {/* Background Blobs */}
      <Blobs />

      {/* Sticky Navbar */}
      <Navbar onOpenContactModal={() => handleOpenModal('')} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onOpenContactModal={() => handleOpenModal('')} />

        {/* 2-row Infinite Marquee Banner */}
        <Marquee />

        {/* 10 Services Section */}
        <ServicesSection onSelectService={(service) => handleOpenModal(service)} />

        {/* How It Works (4 steps) */}
        <HowItWorks />

        {/* Why SuperUI (4 trust cards) */}
        <WhyUs />

        {/* Inline Contact Section */}
        <ContactSection />

        {/* Call to Action Band */}
        <CtaBand onOpenContactModal={() => handleOpenModal('')} />
      </main>

      {/* Footer */}
      <Footer onSelectService={(service) => handleOpenModal(service)} />

      {/* Contact Modal */}
      <ContactModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        selectedService={selectedService}
      />

      {/* Admin-managed offer popup (1:1 poster, auto-expires) */}
      <OfferPopup onOpenContact={() => handleOpenModal('')} />
    </div>
  );
}

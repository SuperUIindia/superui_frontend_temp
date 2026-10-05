import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Send, Check } from 'lucide-react';
import { api } from '../lib/api';
import { getVisitorId } from '../lib/tracking';
import { logError } from '../lib/logger';
import { useServices } from '../lib/services';
import { INSTAGRAM_URL, INSTAGRAM_HANDLE, INSTAGRAM_DM_URL } from '../lib/social';
import { EXTERNAL_REL } from '../lib/sanitize';
import InstagramIcon from './InstagramIcon';
import Button from './Button';
import { useContent } from '../lib/siteContent';
import { SITE_CONFIG, BUSINESS_CONFIG } from '../lib/env';

export default function ContactForm({ initialService = '', onSuccessCallback, isModal = false }) {
  const services = useServices();
  const c = useContent('contactform');
  const f = c.fields || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagramId: '',
    purpose: initialService || '',
    description: '',
    honeypot: '' // Hidden spam honeypot
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (initialService) {
      setFormData((prev) => ({ ...prev, purpose: initialService }));
    }
  }, [initialService]);

  // Default to the first database service once the catalogue arrives
  useEffect(() => {
    if (services.length > 0) {
      setFormData((prev) => (prev.purpose ? prev : { ...prev, purpose: services[0].title }));
    }
  }, [services]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'Name is required';
      else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
      else if (value.trim().length > 80) error = 'Name cannot exceed 80 characters';
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = 'Email is required';
      else if (!emailRegex.test(value.trim())) error = 'Please provide a valid email address';
    } else if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (!value.trim()) error = 'Phone number is required';
      else if (digits.length < 7) error = 'Please provide a valid phone number';
    } else if (name === 'purpose') {
      if (!value.trim()) error = 'Please select a purpose';
    } else if (name === 'description') {
      if (!value.trim()) error = 'Reason / note is required';
      else if (value.trim().length < 10)
        error = `Please provide at least 10 characters (${value.trim().length}/10)`;
      else if (value.trim().length > 2000) error = 'Reason / note cannot exceed 2000 characters';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time inline validation feedback
    if (errors[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all required fields
    const nameErr = validateField('name', formData.name);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const purposeErr = validateField('purpose', formData.purpose);
    const descErr = validateField('description', formData.description);

    const newErrors = {};
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (phoneErr) newErrors.phone = phoneErr;
    if (purposeErr) newErrors.purpose = purposeErr;
    if (descErr) newErrors.description = descErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        visitorId: getVisitorId()
      };

      await api.post('/api/leads', payload);

      // The reference ID is intentionally not shown to the visitor; it is still
      // recorded in the admin panel and the confirmation email.
      setSubmitted(true);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err) {
      logError('lead submission', err);
      setServerError(err.message || `Something went wrong. Please try again or email ${c.errorFallbackEmail || BUSINESS_CONFIG.email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      instagramId: '',
      purpose: services[0] ? services[0].title : '',
      description: '',
      honeypot: ''
    });
    setErrors({});
  };

  const fieldClass = (hasError) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#111111] placeholder:text-[#A1A1AA] transition-colors focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20'
    }`;

  // Success State View
  if (submitted) {
    const firstName = (formData.name || '').trim().split(/\s+/)[0] || c.successFallbackName || 'there';

    return (
      <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
        {/* Animated Success Checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center text-green-600 mb-5 shadow-lg shadow-green-500/20"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Check className="w-8 h-8 stroke-[3]" />
          </motion.div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-extrabold text-green-700 mb-2 tracking-tight"
        >
          {c.successHeadingPrefix || 'Thank you dear'} {firstName}!
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base text-green-700/80 max-w-md mb-6 leading-relaxed"
        >
          {c.successBody}
        </motion.p>

        {/* Instagram contact */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm rounded-2xl bg-[#FAFAFA] border border-[#EDEDED] p-4 sm:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-3">
            {c.successFasterReply || 'Want a faster reply?'}
          </p>

          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel={EXTERNAL_REL}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E00] to-[#7C3AED] text-white text-sm font-bold shadow-lg shadow-[#FF5E00]/20 hover:opacity-95 transition-opacity"
          >
            <InstagramIcon className="w-4 h-4" />
            {c.successDmCta || 'Message me on Instagram'}
          </a>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel={EXTERNAL_REL}
            className="mt-2.5 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white border border-[#EDEDED] text-[#111111] text-sm font-semibold hover:border-[#7C3AED]/40 hover:text-[#7C3AED] transition-colors"
          >
            <InstagramIcon className="w-4 h-4" />
            {c.successFollowCta || `Follow ${SITE_CONFIG.brand} on Instagram`}
          </a>

          <p className="mt-2.5 text-[11px] text-[#6B6B6B]">
            {INSTAGRAM_HANDLE}
          </p>
        </motion.div>

        <Button variant="outline" size="sm" onClick={handleReset} className="mt-6">
          {c.successSubmitAnother || 'Submit Another Request'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field (hidden from real users, tricks spam bots) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="hp_field">{c.honeypotLabel || 'Leave this empty'}</label>
        <input
          id="hp_field"
          type="text"
          name="honeypot"
          value={formData.honeypot}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.name.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={f.name.placeholder}
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldClass(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.email.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={f.email.placeholder}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldClass(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      {/* Phone & Instagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.phone.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder={f.phone.placeholder}
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldClass(errors.phone)}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="instagramId" className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.instagram?.label} <span className="text-[#6B6B6B] font-normal">{c.optionalSuffix || '(Optional)'}</span>
          </label>
          <input
            id="instagramId"
            name="instagramId"
            type="text"
            placeholder={f.instagram?.placeholder}
            value={formData.instagramId}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#A1A1AA] focus:border-[#FF5E00] focus:ring-2 focus:ring-[#FF5E00]/20 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label htmlFor="purpose" className="block text-xs font-semibold text-[#111111] mb-1.5">
          {f.purpose?.label} <span className="text-[#FF5E00]">*</span>
        </label>
        <select
          id="purpose"
          name="purpose"
          required
          value={formData.purpose}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-[#111111] focus:ring-2 focus:outline-none transition-colors cursor-pointer ${
            errors.purpose
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20'
          }`}
        >
          <option value="">{f.purpose?.placeholder || 'Select a service'}</option>
          {services.map((srv) => (
            <option key={srv.key} value={srv.title}>
              {srv.title}
            </option>
          ))}
        </select>
        {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>}
      </div>

      {/* Reason / Note */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="description" className="block text-xs font-semibold text-[#111111]">
            {f.description?.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <span className="text-[11px] text-[#6B6B6B]">
            {formData.description.length} / 2000 chars (min 10)
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          rows={isModal ? 3 : 4}
          required
          placeholder={f.description?.placeholder}
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          className={fieldClass(errors.description)}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          icon={Send}
          className="w-full justify-center text-base"
        >
          {c.submitText || 'Send Project Requirements'}
        </Button>
        <p className="text-[11px] text-center text-[#6B6B6B] mt-2">
          {c.footnote}
        </p>
      </div>
    </form>
  );
}
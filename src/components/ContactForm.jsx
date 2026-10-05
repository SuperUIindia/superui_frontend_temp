import React, { useState, useEffect } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { getVisitorId } from '../lib/tracking';
import { logError } from '../lib/logger';
import { useServices } from '../lib/services';
import Button from './Button';
import SubmissionSuccessPopup from './SubmissionSuccessPopup';
import { useContent } from '../lib/siteContent';
import { BUSINESS_CONFIG } from '../lib/env';

/**
 * `idPrefix` namespaces every field id. The form renders in two places at once
 * (inline in the contact section and inside the dialog), and duplicate ids would
 * make a label in the dialog focus the inline field instead of its own.
 */
export default function ContactForm({
  initialService = '',
  onSuccessCallback,
  isModal = false,
  idPrefix = 'contact'
}) {
  const services = useServices();
  const c = useContent('contactform');
  const f = c.fields || {};
  const fieldId = (name) => `${idPrefix}-${name}`;

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
      // recorded in the admin panel and the confirmation email. Confirmation is
      // a popup, so the form underneath stays exactly where the visitor left it.
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

  // Closing the confirmation popup also clears the form, so the visitor can send
  // a second request without reloading the page.
  const handleDismissSuccess = () => {
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

  const submittedFirstName = (formData.name || '').trim().split(/\s+/)[0] || '';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Confirmation popup, shown only once every field has been accepted by the
          API. It portals to <body>, so it adds nothing to the form's own layout
          and the form stays exactly where the visitor left it. */}
      <SubmissionSuccessPopup
        isOpen={submitted}
        firstName={submittedFirstName}
        onClose={handleDismissSuccess}
      />

      {serverError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Honeypot field (hidden from real users, tricks spam bots) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={fieldId('honeypot')}>{c.honeypotLabel || 'Leave this empty'}</label>
        <input
          id={fieldId('honeypot')}
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
          <label htmlFor={fieldId('name')} className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.name.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id={fieldId('name')}
            name="name"
            type="text"
            required
            placeholder={f.name.placeholder}
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            // Opening the dialog should land the caret in the first field, not
            // on the close button.
            {...(isModal ? { 'data-autofocus': 'true' } : {})}
            className={fieldClass(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor={fieldId('email')} className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.email.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id={fieldId('email')}
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
          <label htmlFor={fieldId('phone')} className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.phone.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <input
            id={fieldId('phone')}
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
          <label htmlFor={fieldId('instagramId')} className="block text-xs font-semibold text-[#111111] mb-1.5">
            {f.instagram?.label} <span className="text-[#6B6B6B] font-normal">{c.optionalSuffix || '(Optional)'}</span>
          </label>
          <input
            id={fieldId('instagramId')}
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
        <label htmlFor={fieldId('purpose')} className="block text-xs font-semibold text-[#111111] mb-1.5">
          {f.purpose?.label} <span className="text-[#FF5E00]">*</span>
        </label>
        <select
          id={fieldId('purpose')}
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
          <label htmlFor={fieldId('description')} className="block text-xs font-semibold text-[#111111]">
            {f.description?.label} <span className="text-[#FF5E00]">*</span>
          </label>
          <span className="text-[11px] text-[#6B6B6B]">
            {formData.description.length} / 2000 chars (min 10)
          </span>
        </div>
        <textarea
          id={fieldId('description')}
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
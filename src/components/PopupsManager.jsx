import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, ImageOff, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { useConfirm } from './useConfirm';
import { safeImageUrl } from '../lib/sanitize';
import Button from './Button';

/** Local YYYY-MM-DD (avoids the UTC day shift that toISOString causes). */
const toInput = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayInput = () => toInput(new Date());

function in30DaysInput() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toInput(d);
}

const EMPTY = {
  imageUrl: '',
  title: '',
  bodyText: '',
  footerText: '',
  ctaLabel: 'Contact Us',
  ctaUrl: '',
  fromDate: todayInput(),
  toDate: in30DaysInput(),
  isActive: true
};

const toDateInput = (iso) => (iso ? toInput(new Date(iso)) : '');

/** Live/expired/inactive badge for the popup list. */
function StatusPill({ popup }) {
  const now = Date.now();
  const ended = new Date(popup.toDate).getTime() < now;
  const notStarted = new Date(popup.fromDate).getTime() > now;

  let label = 'Live';
  let cls = 'bg-green-50 text-green-700 border-green-200';
  if (!popup.isActive) {
    label = 'Disabled';
    cls = 'bg-gray-100 text-gray-600 border-gray-200';
  } else if (ended) {
    label = 'Expired';
    cls = 'bg-red-50 text-red-600 border-red-200';
  } else if (notStarted) {
    label = 'Scheduled';
    cls = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

/** Create / edit dialog. */
function PopupEditor({ popup, onClose, onSaved }) {
  const isEdit = Boolean(popup);
  const [form, setForm] = useState(() =>
    popup
      ? {
          imageUrl: popup.imageUrl || '',
          title: popup.title || '',
          bodyText: popup.bodyText || '',
          footerText: popup.footerText || '',
          ctaLabel: popup.ctaLabel || 'Contact Us',
          ctaUrl: popup.ctaUrl || '',
          fromDate: toDateInput(popup.fromDate),
          toDate: toDateInput(popup.toDate),
          isActive: popup.isActive !== false
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!/^https?:\/\//i.test(form.imageUrl.trim())) {
      next.imageUrl = 'Poster image URL must start with http:// or https://';
    }
    if (!form.title.trim()) next.title = 'Header text is required';
    if (!form.fromDate) next.fromDate = 'Start date is required';
    if (!form.toDate) next.toDate = 'End date is required';
    if (form.fromDate && form.toDate && form.toDate < form.fromDate) {
      next.toDate = 'End date must be on or after the start date';
    }
    if (form.ctaUrl.trim() && !/^(https?:\/\/|\/|#)/i.test(form.ctaUrl.trim())) {
      next.ctaUrl = 'Redirect must be a full URL, a /path or an #anchor';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        title: form.title.trim(),
        bodyText: form.bodyText.trim(),
        footerText: form.footerText.trim(),
        ctaLabel: form.ctaLabel.trim() || 'Contact Us',
        ctaUrl: form.ctaUrl.trim(),
        // Send full ISO timestamps so the UTC comparison is unambiguous
        fromDate: new Date(`${form.fromDate}T00:00:00`).toISOString(),
        toDate: new Date(`${form.toDate}T23:59:59`).toISOString(),
        isActive: form.isActive
      };
      if (isEdit) {
        await api.put(`/api/admin/popups/${popup._id}`, payload);
      } else {
        await api.post('/api/admin/popups', payload);
      }
      onSaved();
    } catch (err) {
      setServerError(err.message || 'Failed to save popup');
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full px-3 py-2 text-xs rounded-xl border bg-white text-[#111111] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors';
  const fieldCls = (bad) =>
    `${field} ${bad ? 'border-red-400 focus:ring-red-200' : 'border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-3xl my-auto bg-white rounded-3xl shadow-2xl border border-[#EDEDED] z-10 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#EDEDED]">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#111111]">
              {isEdit ? 'Edit Popup' : 'New Popup'}
            </h2>
            <p className="text-[11px] text-[#6B6B6B]">
              Poster is displayed as a 1:1 square. The popup expires automatically after the end date.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          {serverError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: poster preview (1:1) */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Poster Image URL <span className="text-[#FF5E00]">*</span>
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => {
                  setPreviewFailed(false);
                  set('imageUrl')(e);
                }}
                placeholder="https://example.com/poster.jpg"
                className={fieldCls(errors.imageUrl)}
              />
              {errors.imageUrl && <p className="mt-1 text-[11px] text-red-500">{errors.imageUrl}</p>}

              <div className="mt-2 w-full aspect-square rounded-2xl overflow-hidden border border-[#EDEDED] bg-[#FAFAFA] flex items-center justify-center">
                {form.imageUrl && !previewFailed ? (
                  <img
                    src={safeImageUrl(form.imageUrl)}
                    alt="Poster preview"
                    onError={() => setPreviewFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <ImageOff className="w-6 h-6 text-[#D4D4D8]" />
                    <span className="text-[11px] text-[#A1A1AA]">
                      {form.imageUrl ? 'Could not load that URL' : '1:1 poster preview'}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-[#A1A1AA]">
                Square images (1:1) fill the frame without cropping.
              </p>
            </div>

            {/* Right: copy + schedule */}
            <div className="space-y-3.5">
              <div>
                <label htmlFor="popupTitle" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Header Text <span className="text-[#FF5E00]">*</span>
                </label>
                <input
                  id="popupTitle"
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="Limited time offer"
                  className={fieldCls(errors.title)}
                />
                {errors.title && <p className="mt-1 text-[11px] text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="popupBody" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Body Text <span className="text-[#6B6B6B] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="popupBody"
                  rows={3}
                  value={form.bodyText}
                  onChange={set('bodyText')}
                  placeholder="Describe the offer"
                  className={fieldCls(false)}
                />
              </div>

              <div>
                <label htmlFor="popupFooter" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Footer Text <span className="text-[#6B6B6B] font-normal">(Optional)</span>
                </label>
                <input
                  id="popupFooter"
                  type="text"
                  value={form.footerText}
                  onChange={set('footerText')}
                  placeholder="Terms & conditions apply"
                  className={fieldCls(false)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="popupCta" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Contact Button Label
                  </label>
                  <input
                    id="popupCta"
                    type="text"
                    value={form.ctaLabel}
                    onChange={set('ctaLabel')}
                    placeholder="Contact Us"
                    className={fieldCls(false)}
                  />
                </div>
                <div>
                  <label htmlFor="popupCtaUrl" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Button Redirect
                  </label>
                  <input
                    id="popupCtaUrl"
                    type="text"
                    value={form.ctaUrl}
                    onChange={set('ctaUrl')}
                    placeholder="Leave blank to open the contact form"
                    className={fieldCls(errors.ctaUrl)}
                  />
                  {errors.ctaUrl && <p className="mt-1 text-[11px] text-red-500">{errors.ctaUrl}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="popupFrom" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    From Date <span className="text-[#FF5E00]">*</span>
                  </label>
                  <input
                    id="popupFrom"
                    type="date"
                    value={form.fromDate}
                    onChange={set('fromDate')}
                    className={fieldCls(errors.fromDate)}
                  />
                  {errors.fromDate && <p className="mt-1 text-[11px] text-red-500">{errors.fromDate}</p>}
                </div>
                <div>
                  <label htmlFor="popupTo" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    To Date <span className="text-[#FF5E00]">*</span>
                  </label>
                  <input
                    id="popupTo"
                    type="date"
                    value={form.toDate}
                    min={form.fromDate || undefined}
                    onChange={set('toDate')}
                    className={fieldCls(errors.toDate)}
                  />
                  {errors.toDate && <p className="mt-1 text-[11px] text-red-500">{errors.toDate}</p>}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={set('isActive')}
                  className="w-3.5 h-3.5 rounded border-[#EDEDED] text-[#FF5E00] focus:ring-[#FF5E00]"
                />
                <span className="text-xs font-semibold text-[#111111]">Active</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={saving} icon={Check}>
              {isEdit ? 'Save Changes' : 'Create Popup'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/** Admin tab: list every popup and manage them. */
export default function PopupsManager() {
  const toast = useToast();
  const { confirm, confirmElement } = useConfirm();
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | popup object
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/popups');
      setPopups((res && res.data && res.data.popups) || []);
    } catch (err) {
      setError(err.message || 'Failed to load popups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const handleDelete = async (popup) => {
    const confirmed = await confirm({
      title: `Delete popup "${popup.title}"?`,
      message: 'This permanently removes the offer poster from the site. This cannot be undone.',
      confirmLabel: 'Delete popup'
    });
    if (!confirmed) return;

    setBusyId(popup._id);
    try {
      await api.delete(`/api/admin/popups/${popup._id}`);
      toast.success(`Popup "${popup.title}" deleted.`);
      await fetchPopups();
    } catch (err) {
      setError(err.message || 'Failed to delete popup');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111111]">Offer Popups</h3>
          <p className="text-xs text-[#6B6B6B]">
            Square (1:1) poster shown to visitors. Each popup runs from its start date and disappears
            automatically after its end date.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setEditing('new')} className="shrink-0 justify-center">
          New Popup
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-[#6B6B6B]">Loading popups...</div>
      ) : popups.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-[#EDEDED]">
          <p className="text-sm font-semibold text-[#111111] mb-1">No popups yet</p>
          <p className="text-xs text-[#6B6B6B]">Create one to show a promotional poster on the site.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {popups.map((popup) => (
            <div key={popup._id} className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden flex flex-col">
              <div className="relative w-full aspect-square bg-[#FAFAFA]">
                <img
                  src={safeImageUrl(popup.imageUrl)}
                  alt={popup.title}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#111111] line-clamp-2">{popup.title}</h4>
                  <StatusPill popup={popup} />
                </div>
                {popup.bodyText && (
                  <p className="text-[11px] text-[#6B6B6B] line-clamp-2">{popup.bodyText}</p>
                )}
                <p className="text-[10px] text-[#A1A1AA]">
                  {new Date(popup.fromDate).toLocaleDateString()} → {new Date(popup.toDate).toLocaleDateString()}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditing(popup)} className="flex-1 justify-center">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(popup)}
                    loading={busyId === popup._id}
                    className="justify-center text-red-600 hover:border-red-300"
                    aria-label={`Delete popup ${popup.title}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <PopupEditor
            popup={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              toast.success(editing === 'new' ? 'Popup created.' : 'Popup updated.');
              fetchPopups();
            }}
          />
        )}
      </AnimatePresence>

      {confirmElement}
    </div>
  );
}
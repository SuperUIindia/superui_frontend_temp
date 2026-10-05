import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  FileJson,
  Check,
  AlertCircle,
  RotateCcw,
  Copy,
  ShieldAlert,
  Search
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { useConfirm } from './useConfirm';
import Button from './Button';
import { SECTION_KEYS } from '../lib/siteContent';

const indent = (obj) => JSON.stringify(obj, null, 2);

function bytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} kB`;
}

/** Human summary of a section's shape, shown in the left rail. */
function summarize(section) {
  const d = section?.data;
  if (!d || typeof d !== 'object') return '—';
  const keys = Object.keys(d);
  const arrays = keys.filter((k) => Array.isArray(d[k]));
  const parts = [`${keys.length} field${keys.length === 1 ? '' : 's'}`];
  if (arrays.length) {
    const total = arrays.reduce((sum, k) => sum + d[k].length, 0);
    parts.push(`${arrays.length} array${arrays.length === 1 ? '' : 's'} (${total} items)`);
  }
  return parts.join(' · ');
}

/** Create / edit dialog holding the raw JSON for one section. */
function SectionEditor({ section, mode, onClose, onSaved }) {
  const isNew = mode === 'new';
  const [form, setForm] = useState(() => ({
    key: section?.key || '',
    title: section?.title || '',
    description: section?.description || '',
    data: indent(section?.data ?? {})
  }));
  const [jsonError, setJsonError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => {
    try {
      return { ok: true, value: JSON.parse(form.data) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [form.data]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // Re-validate the JSON box whenever it changes so the error clears itself.
  useEffect(() => {
    if (parsed.ok) setJsonError('');
  }, [parsed.ok]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const key = form.key.trim().toLowerCase();
    if (!key) return setServerError('Section key is required');
    if (!/^[a-z0-9]+$/.test(key)) {
      return setServerError('Section key may contain only letters and numbers');
    }
    if (!form.title.trim()) return setServerError('Title is required');
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return setServerError('Fix the JSON before saving');
    }

    setSaving(true);
    try {
      const payload = {
        key,
        title: form.title.trim(),
        description: form.description.trim(),
        data: parsed.value
      };
      if (isNew) {
        await api.post('/api/admin/content', payload);
      } else {
        await api.put(`/api/admin/content/${section.key}`, payload);
      }
      onSaved(key);
    } catch (err) {
      setServerError(err.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full px-3 py-2 text-xs rounded-xl border bg-white text-[#111111] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-4xl my-auto bg-white rounded-3xl shadow-2xl border border-[#EDEDED] z-10 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#EDEDED]">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-[#111111] truncate">
              {isNew ? 'New Section' : `Edit: ${section.key}`}
            </h2>
            <p className="text-[11px] text-[#6B6B6B]">
              Stored as JSON in MongoDB. Keys are always lowercased.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto overscroll-contain">
          {serverError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">Key</label>
              <input
                type="text"
                value={form.key}
                onChange={set('key')}
                readOnly={!isNew}
                placeholder="e.g. testimonials"
                className={`${field} ${
                  isNew
                    ? 'border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20'
                    : 'border-[#EDEDED] bg-[#FAFAFA] text-[#6B6B6B] cursor-not-allowed'
                }`}
              />
              {!isNew && (
                <p className="mt-1 text-[10px] text-[#A1A1AA]">
                  Use Rename in the section list to change a key.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Human readable label"
                className={`${field} border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={set('description')}
              placeholder="What this section controls"
              className={`${field} border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Data (JSON) <span className="text-[#FF5E00]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    parsed.ok
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  {parsed.ok ? 'Valid JSON' : 'Invalid JSON'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setForm((p) => ({ ...p, data: indent(JSON.parse(p.data)) }));
                      setJsonError('');
                    } catch {
                      /* leave the broken text in place */
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6B6B6B] hover:text-[#FF5E00]"
                >
                  <Copy className="w-3 h-3" /> Format
                </button>
              </div>
            </div>
            <textarea
              rows={18}
              value={form.data}
              onChange={(e) => {
                setForm((p) => ({ ...p, data: e.target.value }));
                if (jsonError) setJsonError('');
              }}
              spellCheck={false}
              className={`${field} font-mono text-[11px] leading-relaxed resize-y ${
                parsed.ok
                  ? 'border-[#EDEDED] focus:border-[#FF5E00] focus:ring-[#FF5E00]/20'
                  : 'border-red-400 focus:ring-red-200'
              }`}
            />
            {jsonError && <p className="mt-1 text-[11px] text-red-500">{jsonError}</p>}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              icon={Check}
              disabled={!parsed.ok}
            >
              {isNew ? 'Create Section' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * Admin -> All Sections.
 *
 * Lists every stored site section (navbar, footer and each home page block) and
 * lets an admin read it as JSON, create a new section, edit the JSON, rename the
 * key or delete it.
 */
export default function SectionsManager() {
  const toast = useToast();
  const { confirm, confirmElement } = useConfirm();
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState({ missingKeys: [], protectedKeys: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(null); // null | {mode:'new'} | {mode:'edit', section}
  const [renaming, setRenaming] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/content');
      const list = (res && res.data && res.data.sections) || [];
      setSections(list);
      setMeta({
        missingKeys: (res && res.data && res.data.missingKeys) || [],
        protectedKeys: (res && res.data && res.data.protectedKeys) || []
      });
      setSelected((prev) => (prev ? list.find((s) => s.key === prev.key) || null : list[0] || null));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleDelete = async (section) => {
    if (section.isProtected) {
      setError(`"${section.key}" is protected and cannot be deleted`);
      return;
    }

    const confirmed = await confirm({
      title: section.isDefault ? `Delete built-in section "${section.key}"?` : `Delete "${section.key}"?`,
      message: section.isDefault
        ? 'This removes your saved copy of a built-in section. The site falls back to re-seeding the defaults on the next page load. This cannot be undone.'
        : 'This permanently removes the section and its content. This cannot be undone.',
      confirmLabel: 'Delete section'
    });
    if (!confirmed) return;

    setBusyKey(section.key);
    try {
      await api.delete(`/api/admin/content/${section.key}`);
      flash(`Section "${section.key}" deleted`);
      setSelected(null);
      await fetchSections();
    } catch (err) {
      setError(err.message || 'Failed to delete section');
    } finally {
      setBusyKey('');
    }
  };

  const handleRename = async (section) => {
    const next = String(newKey || '').trim().toLowerCase();
    if (!next) return setError('Enter a new key');
    if (next === section.key) return setRenaming(null);

    setBusyKey(section.key);
    try {
      await api.patch(`/api/admin/content/${section.key}`, { newKey: next });
      flash(`Section "${section.key}" renamed to "${next}"`);
      setRenaming(null);
      setNewKey('');
      setSelected(null);
      await fetchSections();
    } catch (err) {
      setError(err.message || 'Failed to rename section');
    } finally {
      setBusyKey('');
    }
  };

  const copyJson = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(indent(selected.data));
      flash('Section JSON copied to clipboard');
    } catch {
      setError('Clipboard unavailable in this browser');
    }
  };

  const filtered = sections.filter((s) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      s.key.includes(q) ||
      String(s.title || '').toLowerCase().includes(q) ||
      String(s.description || '').toLowerCase().includes(q)
    );
  });

  const selectedSize = selected ? new Blob([indent(selected.data)]).size : 0;

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111111]">All Sections</h3>
          <p className="text-xs text-[#6B6B6B]">
            Every editable block on the site — navbar, hero, marquee, services, how it works,
            why us, contact, CTA band, footer, contact modal, contact form and SEO. Stored as JSON
            in MongoDB.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setEditor({ mode: 'new' })}
          className="shrink-0 justify-center"
        >
          New Section
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px text-red-500" />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-auto shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {notice && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-green-600" />
          {notice}
        </div>
      )}
      {meta.missingKeys.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-px text-amber-600" />
          <span>
            Registered but not yet in the database:{' '}
            <strong>{meta.missingKeys.join(', ')}</strong>. They are seeded automatically the next
            time a visitor loads the site, or run{' '}
            <code className="font-mono">npm run seed:sections</code>.
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-[#6B6B6B]">Loading sections...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
          {/* Left rail: section list */}
          <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
            <div className="p-3 border-b border-[#EDEDED]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter sections..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#EDEDED] bg-[#FAFAFA] text-[#111111] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/20 focus:border-[#FF5E00]"
                />
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-[#6B6B6B] text-center py-10">
                  {sections.length === 0 ? 'No sections stored yet.' : 'No sections match that filter.'}
                </p>
              ) : (
                filtered.map((s) => {
                  const active = selected && selected.key === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelected(s)}
                      className={`w-full text-left px-3.5 py-2.5 border-b border-[#EDEDED] last:border-0 transition-colors ${
                        active ? 'bg-[#FFF1E8]' : 'hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[11px] font-bold truncate ${
                            active ? 'text-[#FF5E00]' : 'text-[#111111]'
                          }`}
                        >
                          {s.key}
                        </span>
                        {s.isProtected && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F3EEFF] text-[#7C3AED] shrink-0">
                            locked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B6B6B] truncate mt-0.5">{s.title}</p>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-[#EDEDED] text-[10px] text-[#A1A1AA]">
              {sections.length} stored · {SECTION_KEYS.length} registered
            </div>
          </div>

          {/* Right: JSON view of the selected section */}
          <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
            {!selected ? (
              <div className="py-20 text-center">
                <FileJson className="w-8 h-8 mx-auto text-[#D4D4D8] mb-2" />
                <p className="text-xs text-[#6B6B6B]">Select a section to view its JSON</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-[#EDEDED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-mono text-sm font-bold text-[#FF5E00]">{selected.key}</h4>
                      {selected.isProtected && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#F3EEFF] text-[#7C3AED]">
                          protected
                        </span>
                      )}
                      {!selected.isDefault && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FFF1E8] text-[#FF5E00]">
                          custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#111111] font-semibold mt-0.5">{selected.title}</p>
                    <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                      {summarize(selected)} · {bytes(selectedSize)} · updated{' '}
                      {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'}
                      {selected.lastUpdatedBy ? ` by ${selected.lastUpdatedBy}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" icon={Copy} onClick={copyJson}>
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Pencil}
                      onClick={() => setEditor({ mode: 'edit', section: selected })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Trash2}
                      disabled={selected.isProtected}
                      loading={busyKey === selected.key}
                      onClick={() => handleDelete(selected)}
                      className="text-red-600 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Delete section ${selected.key}`}
                    />
                  </div>
                </div>

                {/* Rename */}
                {renaming === selected.key ? (
                  <div className="p-3 border-b border-[#EDEDED] bg-[#FAFAFA] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="newsectionkey"
                      autoFocus
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/20 focus:border-[#FF5E00]"
                    />
                    <Button variant="primary" size="sm" icon={Check} onClick={() => handleRename(selected)}>
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => {
                        setRenaming(null);
                        setNewKey('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="px-4 pt-3">
                    <button
                      type="button"
                      disabled={selected.isProtected}
                      onClick={() => {
                        setRenaming(selected.key);
                        setNewKey(selected.key);
                      }}
                      className="text-[10px] font-bold text-[#6B6B6B] hover:text-[#FF5E00] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Rename this section
                    </button>
                  </div>
                )}

                {selected.description && (
                  <p className="px-4 pt-2 text-[11px] text-[#6B6B6B]">{selected.description}</p>
                )}

                <div className="p-4">
                  <pre className="rounded-xl bg-[#111111] text-[#EDEDED] p-4 overflow-auto max-h-[460px] text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                    {indent(selected.data)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {editor && (
          <SectionEditor
            section={editor.mode === 'edit' ? editor.section : null}
            mode={editor.mode}
            onClose={() => setEditor(null)}
            onSaved={(key) => {
              setEditor(null);
              flash(
                editor.mode === 'new'
                  ? `Section "${key}" created`
                  : `Section "${key}" saved — the live site picks it up on next load`
              );
              toast.success(editor.mode === 'new' ? `Section "${key}" created` : `Section "${key}" saved`);
              fetchSections();
            }}
          />
        )}
      </AnimatePresence>

      {confirmElement}
    </div>
  );
}
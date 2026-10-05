import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import { logError } from '../lib/logger';
import { instagramHandle, EXTERNAL_REL } from '../lib/sanitize';
import InstagramIcon from './InstagramIcon';

const POLL_MS = 30000;

/**
 * Navbar bell for new leads.
 *
 * Lists leads an admin has not opened yet (defaults to today). Opening one from
 * the panel marks it viewed, which removes it from the feed and drops the badge.
 */
export default function LeadNotifications({ onOpenLead, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/leads/notifications?limit=20');
      if (res && res.data) {
        setItems(res.data.leads || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      logError('load lead notifications', err);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Refresh whenever the panel is opened so the list is current
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unreadCount = items.length;

  const handleOpen = async (lead) => {
    // Remove immediately for a responsive badge, restore on failure
    setItems((prev) => prev.filter((l) => l._id !== lead._id));
    setTotal((prev) => Math.max(0, prev - 1));
    setOpen(false);
    await onOpenLead(lead);
    load();
  };

  const handleMarkAll = async () => {
    setLoading(true);
    try {
      await onMarkAllRead();
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`New lead notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5E00] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[min(360px,calc(100vw-24px))] rounded-2xl bg-white border border-[#EDEDED] shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#EDEDED] bg-[#FAFAFA]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  New Leads Today
                </h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  {total === 0 ? 'All caught up' : `${total} awaiting your review`}
                </p>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#FF5E00] hover:bg-[#FFF1E8] border border-[#FF5E00]/30 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[#6B6B6B]">
                  No new leads right now.
                </p>
              ) : (
                items.map((lead) => {
                  // instagramId is visitor-supplied free text. Validate it before
                  // it becomes a profile link so it cannot alter the URL.
                  const handle = instagramHandle(lead.instagramId);
                  return (
                    // A div with button semantics, because the row contains a real
                    // link to the lead's Instagram profile.
                    <div
                      key={lead._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpen(lead)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpen(lead);
                        }
                      }}
                      className="w-full text-left px-4 py-3 border-b border-[#EDEDED] last:border-0 hover:bg-[#FFF7ED] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-[#FF5E00]">
                          {lead.leadId}
                        </span>
                        <span className="text-[10px] text-[#A1A1AA] shrink-0">
                          {new Date(lead.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#111111] truncate">{lead.name}</p>
                      <p className="text-[11px] text-[#6B6B6B] truncate">{lead.purpose}</p>
                      <p className="text-[11px] text-[#6B6B6B] line-clamp-2 mt-1">{lead.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {lead.email && (
                          <span className="text-[10px] text-[#6B6B6B] truncate">{lead.email}</span>
                        )}
                        {handle && (
                          <a
                            href={`https://www.instagram.com/${handle}`}
                            target="_blank"
                            rel={EXTERNAL_REL}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-[#7C3AED] shrink-0 hover:underline"
                          >
                            <InstagramIcon className="w-3 h-3" />
                            {lead.instagramId}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="px-4 py-2 border-t border-[#EDEDED] bg-[#FAFAFA] text-[10px] text-[#6B6B6B]">
              Opening a lead removes it from this list.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
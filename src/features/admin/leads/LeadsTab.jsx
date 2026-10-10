import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Eye,
  Check,
  FileText
} from 'lucide-react';
import { LEAD_STATUSES } from '../../../lib/services';
import Button from '../../../components/Button';
import TableScrollArea from '../../../components/TableScrollArea';
import BulkDeleteBar, { SelectCell, SelectAllCell } from '../../../components/BulkDeleteBar';

const LEAD_VIEWS = [
  { id: 'table', label: 'Table' },
  { id: 'cards', label: 'Cards' },
  { id: 'compact', label: 'Compact' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'timeline', label: 'Timeline' }
];

const UNREAD_ROW = 'bg-[#FFF7ED] hover:bg-[#FFEDD5]';
const READ_ROW = 'hover:bg-[#FFF1E8]/20';

function LeadCard({ lead, onSelect, getStatusBadge }) {
  const unread = !lead.viewedAt;
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className={`text-left p-4 rounded-2xl border transition-all hover:shadow-md ${
        unread
          ? 'bg-[#FFF7ED] border-[#FF5E00]/40 shadow-sm shadow-[#FF5E00]/10'
          : 'bg-white border-[#EDEDED]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-[#FF5E00]">{lead.leadId}</span>
        {unread && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FF5E00]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E00]" /> New
          </span>
        )}
      </div>
      <h3 className="font-bold text-[#111111] text-sm mb-0.5 truncate">{lead.name}</h3>
      <p className="text-[11px] text-[#6B6B6B] truncate mb-2">{lead.email}</p>
      <p className="text-[11px] text-[#6B6B6B] line-clamp-3 mb-3">{lead.description}</p>
      <div className="flex items-center justify-between gap-2">
        {getStatusBadge(lead.status)}
        <span className="text-[10px] text-[#71717A]">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

function LeadCompactRow({ lead, onSelect, getStatusBadge }) {
  const unread = !lead.viewedAt;
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left border-b border-[#EDEDED] last:border-0 transition-colors ${
        unread ? UNREAD_ROW : READ_ROW
      }`}
    >
      <span className="font-mono text-[11px] font-bold text-[#FF5E00] w-20 shrink-0 hidden sm:block">{lead.leadId}</span>
      <span className="text-xs font-semibold text-[#111111] w-24 sm:w-32 shrink-0 truncate">{lead.name}</span>
      <span className="text-[11px] text-[#6B6B6B] flex-1 min-w-0 truncate">{lead.description}</span>
      <span className="text-[10px] text-[#71717A] shrink-0 hidden sm:block">
        {new Date(lead.createdAt).toLocaleDateString()}
      </span>
      <span className="shrink-0">{getStatusBadge(lead.status)}</span>
    </button>
  );
}

function LeadTimeline({ leads, onSelect, getStatusBadge }) {
  const groups = leads.reduce((acc, lead) => {
    const key = new Date(lead.createdAt).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    (acc[key] = acc[key] || []).push(lead);
    return acc;
  }, {});

  return (
    <div className="relative pl-5 sm:pl-6">
      <div className="absolute left-[7px] sm:left-[9px] top-2 bottom-2 w-px bg-[#EDEDED]" aria-hidden="true" />
      <div className="space-y-5">
        {Object.entries(groups).map(([day, items]) => (
          <div key={day} className="relative">
            <span className="absolute -left-5 sm:-left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#FF5E00]" aria-hidden="true" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">{day}</h3>
            <div className="space-y-2">
              {items.map((lead) => (
                <LeadCompactRow key={lead._id} lead={lead} onSelect={onSelect} getStatusBadge={getStatusBadge} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadKanban({ leads, onSelect, getStatusBadge }) {
  const columns = ['New', 'Contacted', 'In Discussion', 'Won', 'Lost'];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {columns.map((status) => {
        const items = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col min-w-0">
            <div className="px-3 py-2.5 border-b border-[#EDEDED] flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] truncate">{status}</span>
              <span className="shrink-0 text-[11px] font-bold text-[#111111] bg-[#FAFAFA] border border-[#EDEDED] rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto max-h-[520px]">
              {items.length === 0 ? (
                <p className="text-[11px] text-[#71717A] text-center py-6">No leads</p>
              ) : (
                items.map((lead) => (
                  <LeadCard key={lead._id} lead={lead} onSelect={onSelect} getStatusBadge={getStatusBadge} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeadsTab({
  leads,
  leadsTotal,
  leadsPage,
  leadsTotalPages,
  setLeadsPage,
  leadStatusFilter,
  setLeadStatusFilter,
  leadPurposeFilter,
  setLeadPurposeFilter,
  leadSearchQuery,
  setLeadSearchQuery,
  leadFromDate,
  setLeadFromDate,
  leadToDate,
  setLeadToDate,
  leadUnreadOnly,
  setLeadUnreadOnly,
  loadingLeads,
  services,
  selectedLead,
  setSelectedLead,
  editStatus,
  setEditStatus,
  editNotes,
  setEditNotes,
  savingLead,
  saveSuccess,
  handleSaveLeadDetails,
  handleExportCsv,
  selectedLeads,
  toggleOne,
  setSelectedLeads,
  toggleAllOnPage,
  clearSelection,
  bulkBusy,
  handleBulkDeleteLeads,
  getStatusBadge
}) {
  const [leadView, setLeadView] = useState('table');

  return (
    <div className="space-y-6">
      {/* Filter & Action Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Search input */}
          <div className="relative w-full sm:w-auto sm:min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search name, email, or SUP ID..."
              value={leadSearchQuery}
              onChange={(e) => {
                setLeadSearchQuery(e.target.value);
                setLeadsPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={leadStatusFilter}
            onChange={(e) => {
              setLeadStatusFilter(e.target.value);
              setLeadsPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:border-[#FF5E00] focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {LEAD_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Purpose Filter */}
          <select
            value={leadPurposeFilter}
            onChange={(e) => {
              setLeadPurposeFilter(e.target.value);
              setLeadsPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:border-[#FF5E00] focus:outline-none cursor-pointer"
          >
            <option value="All">All Purposes</option>
            {services.map((srv) => (
              <option key={srv.key} value={srv.title}>
                {srv.title}
              </option>
            ))}
          </select>
        </div>

        {/* CSV Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          icon={Download}
          className="w-full sm:w-auto shrink-0 justify-center"
        >
          Export CSV (Guarded)
        </Button>
      </div>

      {/* Date Range + View Mode Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* From / To calendar pickers */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor="leadFrom" className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              From
            </label>
            <input
              id="leadFrom"
              type="date"
              value={leadFromDate}
              max={leadToDate || undefined}
              onChange={(e) => {
                setLeadFromDate(e.target.value);
                setLeadsPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:border-[#FF5E00] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="leadTo" className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              To
            </label>
            <input
              id="leadTo"
              type="date"
              value={leadToDate}
              min={leadFromDate || undefined}
              onChange={(e) => {
                setLeadToDate(e.target.value);
                setLeadsPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:border-[#FF5E00] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setLeadFromDate('');
              setLeadToDate('');
              setLeadsPage(1);
            }}
            className="text-[11px] font-semibold text-[#71717A] hover:text-[#111111] px-2 py-1 rounded-lg hover:bg-[#FAFAFA]"
          >
            Clear dates
          </button>

          {/* Unread-only filter */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#111111] cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={leadUnreadOnly}
              onChange={(e) => {
                setLeadUnreadOnly(e.target.checked);
                setLeadsPage(1);
              }}
              className="w-3.5 h-3.5 rounded text-[#FF5E00] focus:ring-[#FF5E00] cursor-pointer"
            />
            <span>Unread only</span>
          </label>
        </div>

        {/* View Switcher buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] self-start xl:self-auto overflow-x-auto max-w-full">
          {LEAD_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setLeadView(v.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                leadView === v.id
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#111111]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alternative Views */}
      {leadView === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onSelect={setSelectedLead} getStatusBadge={getStatusBadge} />
          ))}
        </div>
      )}

      {leadView === 'compact' && (
        <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
          {leads.map((lead) => (
            <LeadCompactRow key={lead._id} lead={lead} onSelect={setSelectedLead} getStatusBadge={getStatusBadge} />
          ))}
        </div>
      )}

      {leadView === 'timeline' && (
        <LeadTimeline leads={leads} onSelect={setSelectedLead} getStatusBadge={getStatusBadge} />
      )}

      {leadView === 'kanban' && (
        <LeadKanban leads={leads} onSelect={setSelectedLead} getStatusBadge={getStatusBadge} />
      )}

      {/* Primary Table View */}
      {leadView === 'table' && (
        <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
          <BulkDeleteBar
            count={selectedLeads.length}
            noun="lead"
            busy={bulkBusy}
            onClear={() => clearSelection(setSelectedLeads)}
            onConfirm={handleBulkDeleteLeads}
          />
          <TableScrollArea>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[#6B6B6B] font-bold uppercase tracking-wider">
                <tr>
                  <SelectAllCell
                    checked={leads.length > 0 && leads.every((l) => selectedLeads.includes(l._id))}
                    indeterminate={leads.some((l) => selectedLeads.includes(l._id))}
                    onChange={() => toggleAllOnPage(setSelectedLeads, leads)}
                    total={leads.length}
                  />
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reason / Note</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEDED]">
                {loadingLeads ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#6B6B6B]">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-[#71717A]" />
                        <span className="text-sm font-semibold text-[#111111]">No leads found</span>
                        <span className="text-xs text-[#6B6B6B]">Try adjusting your search or filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => setSelectedLead(lead)}
                      className={`cursor-pointer transition-colors ${!lead.viewedAt ? UNREAD_ROW : READ_ROW}`}
                    >
                      <SelectCell
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => toggleOne(setSelectedLeads, lead._id)}
                      />
                      <td className="py-3 px-4 font-mono font-bold text-[#FF5E00]">
                        <span className="inline-flex items-center gap-1.5">
                          {!lead.viewedAt && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#FF5E00] shrink-0"
                              title="Unread submission"
                              aria-label="Unread"
                            />
                          )}
                          {lead.leadId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#111111]">{lead.name}</td>
                      <td className="py-3 px-4 text-[#6B6B6B]">
                        <div>{lead.email}</div>
                        <div className="text-[11px] text-[#71717A]">{lead.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111111]">{lead.purpose}</td>
                      <td className="py-3 px-4 text-[#71717A] whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-[#6B6B6B] max-w-xs truncate">
                        <span title={lead.description} className="block truncate">
                          {lead.description}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF5E00] hover:underline">
                          View <Eye className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScrollArea>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#EDEDED] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>
              Showing page {leadsPage} of {leadsTotalPages} ({leadsTotal} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={leadsPage <= 1}
                onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#EDEDED] bg-white hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={leadsPage >= leadsTotalPages}
                onClick={() => setLeadsPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-[#EDEDED] bg-white hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer Modal */}
      {selectedLead && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Lead details for ${selectedLead.leadId}`}
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
        >
          <div
            tabIndex={-1}
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#EDEDED] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#FF5E00] px-2.5 py-1 bg-[#FFF1E8] rounded-lg">
                  {selectedLead.leadId}
                </span>
                <span className="text-xs text-[#71717A]">
                  {new Date(selectedLead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#111111]"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Client Info */}
              <div>
                <h4 className="text-base font-bold text-[#111111] mb-1">{selectedLead.name}</h4>
                <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                  <span>Status:</span>
                  {getStatusBadge(selectedLead.status)}
                </div>
              </div>

              {/* Direct Contact Card */}
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EDEDED] space-y-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#6B6B6B]">Email:</span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="font-bold text-[#FF5E00] hover:underline flex items-center gap-1 text-right break-all"
                  >
                    {selectedLead.email} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                {selectedLead.phone && (
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-[#6B6B6B]">Phone / WhatsApp:</span>
                    <span className="font-bold text-[#111111] text-right break-words">{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.instagramId && (
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-[#6B6B6B]">Instagram:</span>
                    <span className="font-semibold text-[#7C3AED] text-right break-all">{selectedLead.instagramId}</span>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-[#EDEDED] bg-white col-span-2">
                  <span className="text-[#6B6B6B] block mb-1">Service / Purpose</span>
                  <strong className="text-[#111111]">{selectedLead.purpose}</strong>
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Reason / Note
                </label>
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EDEDED] text-xs leading-relaxed text-[#111111] whitespace-pre-wrap">
                  {selectedLead.description}
                </div>
              </div>

              {/* Status Selector & Notes (Editable) */}
              <div className="pt-2 border-t border-[#EDEDED] space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    Lead Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] focus:border-[#FF5E00] focus:outline-none"
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    Internal Admin Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Add private meeting notes, quotes, or communication logs..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:outline-none"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Lead updated successfully!</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="md"
                  loading={savingLead}
                  onClick={handleSaveLeadDetails}
                  icon={Save}
                  className="w-full justify-center"
                >
                  Save Changes
                </Button>
              </div>

              {/* Metadata */}
              <div className="pt-2 text-[11px] text-[#71717A] space-y-1">
                <div>Submitted: {new Date(selectedLead.createdAt).toLocaleString()}</div>
                <div>Visitor UUID: {selectedLead.visitorId}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


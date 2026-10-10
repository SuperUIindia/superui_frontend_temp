import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import TableScrollArea from '../../../components/TableScrollArea';
import BulkDeleteBar, { SelectCell, SelectAllCell } from '../../../components/BulkDeleteBar';

export default function VisitorsTab({
  visitors,
  visitorsTotal,
  visitorsPage,
  visitorsTotalPages,
  setVisitorsPage,
  loadingVisitors,
  selectedVisitors,
  setSelectedVisitors,
  toggleOne,
  toggleAllOnPage,
  clearSelection,
  bulkBusy,
  handleBulkDeleteVisitors,
  handleDeleteAllVisitors,
  stats
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111111]">
            Visitor Session Logs
          </h3>
          <p className="text-xs text-[#6B6B6B]">
            Privacy-preserving telemetry with salted SHA-256 IP hashing, area detection and lead conversion tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#EDEDED] text-xs font-semibold text-[#6B6B6B]">
            {visitorsTotal} Sessions
          </span>
          {stats && stats.deviceBreakdown && stats.deviceBreakdown.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#FFF1E8] border border-[#FF5E00]/20 text-xs font-semibold text-[#FF5E00]">
              {stats.deviceBreakdown.reduce((s, d) => s + d.count, 0)} tracked
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
        <BulkDeleteBar
          count={selectedVisitors.length}
          noun="visitor record"
          busy={bulkBusy}
          allMode={visitors.length > 0}
          onClear={() => clearSelection(setSelectedVisitors)}
          onConfirm={handleBulkDeleteVisitors}
          onDeleteAll={handleDeleteAllVisitors}
        />
        <TableScrollArea>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[#6B6B6B] font-bold uppercase tracking-wider">
              <tr>
                <SelectAllCell
                  checked={visitors.length > 0 && visitors.every((v) => selectedVisitors.includes(v._id))}
                  indeterminate={visitors.some((v) => selectedVisitors.includes(v._id))}
                  onChange={() => toggleAllOnPage(setSelectedVisitors, visitors)}
                  total={visitors.length}
                />
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Visitor ID</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Path</th>
                <th className="py-3 px-4">Referrer</th>
                <th className="py-3 px-4">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {loadingVisitors ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#6B6B6B]">
                    Loading visitor logs...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-xs text-[#6B6B6B]">
                    No visitor records found.
                  </td>
                </tr>
              ) : (
                visitors.map((visit) => (
                  <tr key={visit._id} className="hover:bg-[#FAFAFA] transition-colors">
                    <SelectCell
                      checked={selectedVisitors.includes(visit._id)}
                      onChange={() => toggleOne(setSelectedVisitors, visit._id)}
                    />
                    <td className="py-3 px-4 whitespace-nowrap text-[#71717A]">
                      {new Date(visit.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#111111]">
                      {visit.visitorId.slice(0, 10)}...
                    </td>
                    <td className="py-3 px-4 text-[#111111] font-semibold">{visit.device}</td>
                    <td className="py-3 px-4 text-[#6B6B6B]">{visit.deviceModel || 'Generic'}</td>
                    <td className="py-3 px-4 text-[#111111]">{visit.area || 'Unknown'}</td>
                    <td className="py-3 px-4 text-[#6B6B6B]">{visit.browser || 'Unknown'}</td>
                    <td className="py-3 px-4 text-[#111111] font-mono text-[11px]">{visit.path}</td>
                    <td className="py-3 px-4 text-[#71717A] max-w-[140px] truncate">
                      {visit.referrer || 'Direct'}
                    </td>
                    <td className="py-3 px-4">
                      {visit.hasSubmittedLead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <Sparkles className="w-3 h-3 text-green-600" /> Lead
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#71717A]">-</span>
                      )}
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
            Showing page {visitorsPage} of {visitorsTotalPages} ({visitorsTotal} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={visitorsPage <= 1}
              onClick={() => setVisitorsPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#EDEDED] bg-white hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={visitorsPage >= visitorsTotalPages}
              onClick={() => setVisitorsPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#EDEDED] bg-white hover:bg-[#FAFAFA] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


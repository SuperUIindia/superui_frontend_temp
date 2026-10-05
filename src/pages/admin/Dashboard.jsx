import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MousePointerClick,
  FileText,
  LogOut,
  RefreshCw,
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
  AlertCircle,
  Eye,
  Check,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  Image as ImageIcon,
  LayoutTemplate
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../../lib/api';
import { useServices, LEAD_STATUSES } from '../../lib/services';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/useConfirm';
import { logError } from '../../lib/logger';
import Button from '../../components/Button';
import TableScrollArea from '../../components/TableScrollArea';
import LeadNotifications from '../../components/LeadNotifications';
import PopupsManager from '../../components/PopupsManager';
import SectionsManager from '../../components/SectionsManager';
import BulkDeleteBar, { SelectCell, SelectAllCell } from '../../components/BulkDeleteBar';

/** Local YYYY-MM-DD for a Date (avoids UTC shifting the day). */
const toDateInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const TODAY = toDateInputValue(new Date());

function daysAgoInputValue(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateInputValue(d);
}

/** Leads list view modes. `table` is the default. */
const LEAD_VIEWS = [
  { id: 'table', label: 'Table' },
  { id: 'cards', label: 'Cards' },
  { id: 'compact', label: 'Compact' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'timeline', label: 'Timeline' }
];

/** Shared "unread" highlight: light orange until an admin opens the lead. */
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
        <span className="text-[10px] text-[#A1A1AA]">{new Date(lead.createdAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

/** Compact view */
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
      <span className="text-[10px] text-[#A1A1AA] shrink-0 hidden sm:block">
        {new Date(lead.createdAt).toLocaleDateString()}
      </span>
      <span className="shrink-0">{getStatusBadge(lead.status)}</span>
    </button>
  );
}

/** Timeline view - groups leads by calendar day */
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

/** Kanban view - one column per status */
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
                <p className="text-[11px] text-[#A1A1AA] text-center py-6">No leads</p>
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

// Animated CountUp number component
function CountUp({ target = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 900;
    const incrementTime = 25;
    const step = Math.ceil(end / (duration / incrementTime));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const services = useServices();
  const toast = useToast();
  const { confirm, confirmElement } = useConfirm();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'leads' | 'visitors' | 'clicks'
  const [adminUser, setAdminUser] = useState('Admin');
  const [refreshing, setRefreshing] = useState(false);

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Leads State
  const [leads, setLeads] = useState([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadPurposeFilter, setLeadPurposeFilter] = useState('All');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadView, setLeadView] = useState('table'); // 'table' | 'cards' | 'compact' | 'kanban' | 'timeline'
  // Date range filter, defaults to today
  const [leadFromDate, setLeadFromDate] = useState(TODAY);
  const [leadToDate, setLeadToDate] = useState(TODAY);
  const [leadUnreadOnly, setLeadUnreadOnly] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); // Detail drawer
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Visitors State
  const [visitors, setVisitors] = useState([]);
  const [visitorsTotal, setVisitorsTotal] = useState(0);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [visitorsTotalPages, setVisitorsTotalPages] = useState(1);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  // Clicks State
  const [clicksData, setClicksData] = useState([]);
  const [loadingClicks, setLoadingClicks] = useState(false);

  // Bulk Selection State (leads + visitors)
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedVisitors, setSelectedVisitors] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Fetch Current Admin Info
  useEffect(() => {
    api
      .get('/api/admin/me')
      .then((res) => {
        if (res && res.data && res.data.username) {
          setAdminUser(res.data.username);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Overview Stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/api/admin/stats');
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      logError('load stats', err);
      toast.error('Could not load analytics. Check that the API is reachable.');
    } finally {
      setLoadingStats(false);
    }
  }, [toast]);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const queryParams = new URLSearchParams({
        page: leadsPage,
        limit: 15,
        status: leadStatusFilter,
        purpose: leadPurposeFilter,
        q: leadSearchQuery,
        from: leadFromDate || 'all',
        to: leadToDate || 'all'
      });
      if (leadUnreadOnly) queryParams.set('unread', '1');
      const res = await api.get(`/api/admin/leads?${queryParams.toString()}`);
      if (res && res.data) {
        setLeads(res.data.leads || []);
        setLeadsTotal(res.data.total || 0);
        setLeadsTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      logError('load leads', err);
      toast.error('Could not load leads.');
    } finally {
      setLoadingLeads(false);
    }
  }, [leadsPage, leadStatusFilter, leadPurposeFilter, leadSearchQuery, leadFromDate, leadToDate, leadUnreadOnly, toast]);

  // Fetch Visitors
  const fetchVisitors = useCallback(async () => {
    setLoadingVisitors(true);
    try {
      const res = await api.get(`/api/admin/visitors?page=${visitorsPage}&limit=20`);
      if (res && res.data) {
        setVisitors(res.data.visitors || []);
        setVisitorsTotal(res.data.total || 0);
        setVisitorsTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      logError('load visitors', err);
      toast.error('Could not load visitor telemetry.');
    } finally {
      setLoadingVisitors(false);
    }
  }, [visitorsPage, toast]);

  // Fetch Clicks
  const fetchClicks = useCallback(async () => {
    setLoadingClicks(true);
    try {
      const res = await api.get('/api/admin/clicks');
      if (res && res.data) {
        setClicksData(res.data || []);
      }
    } catch (err) {
      logError('load clicks', err);
      toast.error('Could not load click data.');
    } finally {
      setLoadingClicks(false);
    }
  }, [toast]);

  // Tab change trigger
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'leads') fetchLeads();
    if (activeTab === 'visitors') fetchVisitors();
    if (activeTab === 'clicks') fetchClicks();
  }, [activeTab, fetchStats, fetchLeads, fetchVisitors, fetchClicks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'overview') await fetchStats();
    if (activeTab === 'leads') await fetchLeads();
    if (activeTab === 'visitors') await fetchVisitors();
    if (activeTab === 'clicks') await fetchClicks();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/admin/logout');
    } catch (err) {
      // Ignore
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  // Lead Detail Drawer Click - marks the lead as viewed, clearing its highlight
  const handleSelectLead = async (lead) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
    setSaveSuccess(false);

    if (lead.viewedAt) return;

    const viewedAt = new Date().toISOString();
    // Optimistic: the row loses its highlight straight away
    setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, viewedAt } : l)));
    setSelectedLead((prev) => (prev && prev._id === lead._id ? { ...prev, viewedAt } : prev));

    try {
      await api.get(`/api/admin/leads/${lead._id}`);
    } catch (err) {
      logError('mark lead viewed', err);
      fetchLeads();
    }
  };

  const handleMarkAllLeadsViewed = useCallback(async () => {
    try {
      await api.post('/api/admin/leads/mark-all-viewed');
      if (activeTab === 'leads') fetchLeads();
      toast.success('All leads marked as read.');
    } catch (err) {
      logError('mark all leads viewed', err);
      toast.error('Could not mark all leads as read.');
    }
  }, [activeTab, fetchLeads, toast]);

  const handleSaveLeadDetails = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    setSaveSuccess(false);
    try {
      const res = await api.patch(`/api/admin/leads/${selectedLead._id}`, {
        status: editStatus,
        notes: editNotes
      });
      if (res && res.data) {
        setSelectedLead(res.data);
        setSaveSuccess(true);
        // Refresh leads list
        fetchLeads();
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      logError('update lead', err);
      toast.error(err.message || 'Failed to update lead.');
    } finally {
      setSavingLead(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.downloadCsv('/api/admin/leads/export.csv');
      toast.success('CSV export started.');
    } catch (err) {
      logError('export leads CSV', err);
      toast.error('Failed to download CSV.');
    }
  };

  // ==========================================
  // BULK SELECTION + DELETE
  // ==========================================

  /** Adds or removes one id from a selection array. */
  const toggleId = (setter, id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllOnPage = (setter, rows) =>
    setter((prev) => {
      const ids = rows.map((r) => r._id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      return allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
    });

  const clearSelection = (setter) => setter([]);

  const handleBulkDeleteLeads = async () => {
    if (selectedLeads.length === 0) return;

    const count = selectedLeads.length;
    const confirmed = await confirm({
      title: `Delete ${count} lead${count === 1 ? '' : 's'}?`,
      message: 'This permanently removes the selected leads and their notes. This action cannot be undone.',
      confirmLabel: 'Delete permanently'
    });
    if (!confirmed) return;

    setBulkBusy(true);
    try {
      await api.bulkDelete('/api/admin/leads', { ids: selectedLeads });
      toast.success(`Deleted ${count} lead${count === 1 ? '' : 's'}.`);
      setSelectedLeads([]);
      // Drop the drawer if it was showing a deleted lead
      setSelectedLead(null);
      await Promise.all([fetchLeads(), fetchStats()]);
    } catch (err) {
      logError('delete leads', err);
      toast.error(err.message || 'Failed to delete leads.');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDeleteVisitors = async () => {
    if (selectedVisitors.length === 0) return;

    const count = selectedVisitors.length;
    const confirmed = await confirm({
      title: `Delete ${count} visitor record${count === 1 ? '' : 's'}?`,
      message: 'This permanently removes the selected visitor sessions. This action cannot be undone.',
      confirmLabel: 'Delete permanently'
    });
    if (!confirmed) return;

    setBulkBusy(true);
    try {
      await api.bulkDelete('/api/admin/visitors', { ids: selectedVisitors });
      toast.success(`Deleted ${count} visitor record${count === 1 ? '' : 's'}.`);
      setSelectedVisitors([]);
      await Promise.all([fetchVisitors(), fetchStats()]);
    } catch (err) {
      logError('delete visitor records', err);
      toast.error(err.message || 'Failed to delete visitor records.');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDeleteAllVisitors = async () => {
    const confirmed = await confirm({
      title: 'Delete every visitor record?',
      message:
        'This wipes ALL analytics history from the database. Visitor telemetry cannot be recovered afterwards.',
      confirmLabel: 'Delete everything'
    });
    if (!confirmed) return;

    setBulkBusy(true);
    try {
      await api.bulkDelete('/api/admin/visitors', { scope: 'all' });
      toast.success('All visitor records deleted.');
      setSelectedVisitors([]);
      await Promise.all([fetchVisitors(), fetchStats()]);
    } catch (err) {
      logError('delete all visitor records', err);
      toast.error(err.message || 'Failed to delete visitor records.');
    } finally {
      setBulkBusy(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      New: 'bg-[#FFF1E8] text-[#FF5E00] border-[#FF5E00]/30',
      Contacted: 'bg-blue-50 text-blue-700 border-blue-200',
      'In Discussion': 'bg-[#F3EEFF] text-[#7C3AED] border-[#7C3AED]/30',
      Won: 'bg-green-50 text-green-700 border-green-200',
      Lost: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          colors[status] || colors.New
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-[#111111]">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#EDEDED] shadow-sm">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between gap-2 min-h-14 sm:h-16 py-2 sm:py-0">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF5E00] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-md">
                S
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight truncate">
                Super<span className="text-[#FF5E00]">UI</span>
                <span className="ml-2 hidden sm:inline-flex text-xs font-medium px-2 py-0.5 rounded-md bg-[#FAFAFA] text-[#6B6B6B] border border-[#EDEDED]">
                  Admin Portal
                </span>
              </span>
            </div>

            {/* Admin Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* New lead notifications */}
              <LeadNotifications
                onOpenLead={handleSelectLead}
                onMarkAllRead={handleMarkAllLeadsViewed}
              />
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] transition-colors"
                title="Refresh data"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FF5E00]' : ''}`} />
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] text-xs font-medium text-[#111111]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Signed in as <strong className="font-semibold">{adminUser}</strong></span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 sm:gap-2 lg:gap-4 border-t border-[#EDEDED] pt-2 pb-2 -mx-1 px-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'leads'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Leads ({leadsTotal || (stats ? stats.totalLeads : 0)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('visitors')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'visitors'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Visitors Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clicks')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'clicks'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <MousePointerClick className="w-4 h-4" />
              <span>Service Card Clicks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('popups')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'popups'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Offer Popups</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'sections'
                  ? 'bg-[#FF5E00] text-white shadow-sm shadow-[#FF5E00]/25'
                  : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>All Sections</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1">
        {/* ============================================================ */}
        {/* 1. OVERVIEW TAB */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 2xl:gap-5">
              {/* Total Visits */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Total Visits</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#111111]">
                  {loadingStats ? '-' : <CountUp target={stats?.totalVisits || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-green-600 font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live Sessions
                </div>
              </div>

              {/* Unique Visitors */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Unique Visitors</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#111111]">
                  {loadingStats ? '-' : <CountUp target={stats?.uniqueVisitors || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-[#7C3AED] font-semibold">
                  By UUID
                </div>
              </div>

              {/* Today's Visits */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Today's Visits</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#FF5E00]">
                  {loadingStats ? '-' : <CountUp target={stats?.todayVisits || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-[#6B6B6B]">
                  Since midnight
                </div>
              </div>

              {/* Total Leads */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Total Leads</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#111111]">
                  {loadingStats ? '-' : <CountUp target={stats?.totalLeads || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-[#FF5E00] font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Form Submissions
                </div>
              </div>

              {/* New Leads */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">New Leads</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#FF5E00]">
                  {loadingStats ? '-' : <CountUp target={stats?.newLeads || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-[#6B6B6B]">
                  Uncontacted
                </div>
              </div>

              {/* Card Clicks */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Card Clicks</span>
                <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#7C3AED]">
                  {loadingStats ? '-' : <CountUp target={stats?.totalClicks || 0} />}
                </div>
                <div className="mt-2 text-[11px] text-[#6B6B6B]">
                  Service interactions
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
              {/* Line Chart: 30-Day Visits */}
              <div className="p-6 rounded-3xl bg-white border border-[#EDEDED] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Visits History (Last 30 Days)
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">
                      Daily traffic trend across the public platform
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF1E8] text-[#FF5E00] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="h-56 sm:h-72 2xl:h-80 w-full">
                  {loadingStats ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                      Loading chart data...
                    </div>
                  ) : stats && stats.visitsPerDay ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.visitsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                        <XAxis
                          dataKey="date"
                          stroke="#A1A1AA"
                          fontSize={10}
                          tickFormatter={(val) => val.slice(5)}
                        />
                        <YAxis stroke="#A1A1AA" fontSize={10} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #EDEDED',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            fontSize: '12px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="visits"
                          stroke="#FF5E00"
                          strokeWidth={2.5}
                          dot={{ fill: '#FF5E00', r: 3 }}
                          activeDot={{ r: 6, fill: '#7C3AED' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                      No visit activity recorded yet
                    </div>
                  )}
                </div>
              </div>

              {/* Bar Chart: Clicks per Service */}
              <div className="p-6 rounded-3xl bg-white border border-[#EDEDED] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">
                      Service Card Engagement
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">
                      Total clicks recorded per service card
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#F3EEFF] text-[#7C3AED] flex items-center justify-center">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                </div>

                <div className="h-56 sm:h-72 2xl:h-80 w-full">
                  {loadingStats ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                      Loading engagement data...
                    </div>
                  ) : stats && stats.clicksPerService && stats.clicksPerService.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.clicksPerService} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
                        <XAxis type="number" stroke="#A1A1AA" fontSize={10} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="service"
                          stroke="#A1A1AA"
                          fontSize={10}
                          width={110}
                          tickFormatter={(val) =>
                            val.length > 14 ? val.slice(0, 14) + '...' : val
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #EDEDED',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {stats.clicksPerService.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index % 2 === 0 ? '#FF5E00' : '#7C3AED'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#6B6B6B]">
                      No card clicks recorded yet. Click service cards on the home page to see data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. LEADS TAB */}
        {/* ============================================================ */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Filter & Action Toolbar */}
            <div className="p-4 sm:p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Search input */}
                <div className="relative w-full sm:w-auto sm:min-w-[220px] flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                  <input
                    type="text"
                    placeholder="Search name, email, or SUP ID..."
                    value={leadSearchQuery}
                    onChange={(e) => {
                      setLeadSearchQuery(e.target.value);
                      setLeadsPage(1);
                    }}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#A1A1AA] focus:border-[#FF5E00] focus:outline-none"
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

                {/* Quick ranges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Today', from: TODAY, to: TODAY },
                    { label: '7 days', from: daysAgoInputValue(6), to: TODAY },
                    { label: '30 days', from: daysAgoInputValue(29), to: TODAY },
                    { label: 'All time', from: '', to: '' }
                  ].map((preset) => {
                    const active =
                      leadFromDate === preset.from && leadToDate === preset.to;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setLeadFromDate(preset.from);
                          setLeadToDate(preset.to);
                          setLeadsPage(1);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                          active
                            ? 'bg-[#FF5E00] text-white border-[#FF5E00]'
                            : 'bg-white text-[#6B6B6B] border-[#EDEDED] hover:text-[#111111] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Unread only */}
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={leadUnreadOnly}
                    onChange={(e) => {
                      setLeadUnreadOnly(e.target.checked);
                      setLeadsPage(1);
                    }}
                    className="w-3.5 h-3.5 rounded border-[#EDEDED] text-[#FF5E00] focus:ring-[#FF5E00]"
                  />
                  <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                    New only
                  </span>
                </label>
              </div>

              {/* View mode switcher - table is the default */}
              <div
                className="flex items-center gap-1 p-1 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] overflow-x-auto shrink-0"
                role="tablist"
                aria-label="Lead list view"
              >
                {LEAD_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    role="tab"
                    aria-selected={leadView === view.id}
                    onClick={() => setLeadView(view.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      leadView === view.id
                        ? 'bg-white text-[#FF5E00] shadow-sm'
                        : 'text-[#6B6B6B] hover:text-[#111111]'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads List - 5 view modes */}
            {leadView === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {loadingLeads ? (
                  <p className="col-span-full text-center text-xs text-[#6B6B6B] py-12">Loading inquiries...</p>
                ) : leads.length === 0 ? (
                  <p className="col-span-full text-center text-xs text-[#6B6B6B] py-12">
                    No client leads found matching your criteria.
                  </p>
                ) : (
                  leads.map((lead) => (
                    <LeadCard
                      key={lead._id}
                      lead={lead}
                      onSelect={handleSelectLead}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </div>
            )}

            {leadView === 'compact' && (
              <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
                {loadingLeads ? (
                  <p className="text-center text-xs text-[#6B6B6B] py-12">Loading inquiries...</p>
                ) : leads.length === 0 ? (
                  <p className="text-center text-xs text-[#6B6B6B] py-12">
                    No client leads found matching your criteria.
                  </p>
                ) : (
                  leads.map((lead) => (
                    <LeadCompactRow
                      key={lead._id}
                      lead={lead}
                      onSelect={handleSelectLead}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </div>
            )}

            {leadView === 'kanban' && (
              <LeadKanban leads={leads} onSelect={handleSelectLead} getStatusBadge={getStatusBadge} />
            )}

            {leadView === 'timeline' && (
              <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm p-4 sm:p-5">
                {loadingLeads ? (
                  <p className="text-center text-xs text-[#6B6B6B] py-12">Loading inquiries...</p>
                ) : leads.length === 0 ? (
                  <p className="text-center text-xs text-[#6B6B6B] py-12">
                    No client leads found matching your criteria.
                  </p>
                ) : (
                  <LeadTimeline
                    leads={leads}
                    onSelect={handleSelectLead}
                    getStatusBadge={getStatusBadge}
                  />
                )}
              </div>
            )}

            {leadView === 'table' && (
            <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
              <BulkDeleteBar
                count={selectedLeads.length}
                noun="lead"
                busy={bulkBusy}
                onClear={() => clearSelection(setSelectedLeads)}
                onConfirm={handleBulkDeleteLeads}
              />
              <TableScrollArea className="border-b border-[#EDEDED]">
                <table className="w-full min-w-[1040px] text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[#6B6B6B] font-bold uppercase tracking-wider">
                    <tr>
                      <SelectAllCell
                        checked={leads.length > 0 && leads.every((l) => selectedLeads.includes(l._id))}
                        indeterminate={leads.some((l) => selectedLeads.includes(l._id))}
                        onChange={() => toggleAllOnPage(setSelectedLeads, leads)}
                        total={leads.length}
                      />
                      <th className="py-3 px-4">Lead ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Reason / Note</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDED]">
                    {loadingLeads ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-[#6B6B6B]">
                          <div className="inline-block w-5 h-5 border-2 border-[#FF5E00] border-t-transparent rounded-full animate-spin mb-2" />
                          <p>Loading inquiries...</p>
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-[#6B6B6B]">
                          No client leads found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr
                          key={lead._id}
                          onClick={() => handleSelectLead(lead)}
                          className={`cursor-pointer transition-colors ${lead.viewedAt ? READ_ROW : UNREAD_ROW}`}
                        >
                          <SelectCell
                            checked={selectedLeads.includes(lead._id)}
                            onChange={() => toggleId(setSelectedLeads, lead._id)}
                            label={`Select lead ${lead.leadId}`}
                          />
                          <td className="py-3 px-4 font-mono font-bold text-[#FF5E00]">
                            <span className="inline-flex items-center gap-1.5">
                              {!lead.viewedAt && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-[#FF5E00] shrink-0"
                                  title="New lead - not yet viewed"
                                />
                              )}
                              {lead.leadId}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#111111]">
                            {lead.name}
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {lead.email}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#111111]">
                            {lead.purpose}
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {lead.phone}
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            <span
                              className="line-clamp-2 max-w-[280px] xl:max-w-[420px] 2xl:max-w-[560px] align-top"
                              title={lead.description}
                            >
                              {lead.description}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(lead.status)}
                          </td>
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
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. VISITORS TELEMETRY TAB */}
        {/* ============================================================ */}
        {activeTab === 'visitors' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Visitor Session Logs
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Privacy-preserving telemetry with salted SHA-256 IP hashing and lead conversion tracking
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#EDEDED] text-xs font-semibold text-[#6B6B6B]">
                {visitorsTotal} Recorded Sessions
              </span>
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
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[720px] text-left text-xs">
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
                      <th className="py-3 px-4">Browser</th>
                      <th className="py-3 px-4">Path</th>
                      <th className="py-3 px-4">Referrer</th>
                      <th className="py-3 px-4">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDED]">
                    {loadingVisitors ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#6B6B6B]">
                          <div className="inline-block w-5 h-5 border-2 border-[#FF5E00] border-t-transparent rounded-full animate-spin mb-2" />
                          <p>Loading visitor telemetry...</p>
                        </td>
                      </tr>
                    ) : visitors.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#6B6B6B]">
                          No visitor sessions logged yet.
                        </td>
                      </tr>
                    ) : (
                      visitors.map((v) => (
                        <tr key={v._id} className="hover:bg-[#FAFAFA]">
                          <SelectCell
                            checked={selectedVisitors.includes(v._id)}
                            onChange={() => toggleId(setSelectedVisitors, v._id)}
                            label={`Select visitor session ${v.shortVisitorId}`}
                          />
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {new Date(v.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#111111]">{v.shortVisitorId}&hellip;</td>
                          <td className="py-3 px-4 font-medium text-[#111111]">
                            {v.device}
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {v.browser}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#111111]">
                            {v.path}
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B] truncate max-w-[150px]">
                            {v.referrer}
                          </td>
                          <td className="py-3 px-4">
                            {v.hasLead ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Became Lead
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] text-[#A1A1AA] bg-[#FAFAFA] border border-[#EDEDED]">
                                Browsing
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-[#EDEDED] flex items-center justify-between text-xs text-[#6B6B6B]">
                <span>
                  Showing page {visitorsPage} of {visitorsTotalPages}
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
        )}

        {/* ============================================================ */}
        {/* 4. CARD CLICKS TAB */}
        {/* ============================================================ */}
        {activeTab === 'clicks' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Service Card Interactions
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Aggregated click events grouped by specific service offering
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#EDEDED] shadow-sm overflow-hidden">
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[#6B6B6B] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Total Clicks</th>
                      <th className="py-3 px-4">Last Clicked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEDED]">
                    {loadingClicks ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-[#6B6B6B]">
                          <div className="inline-block w-5 h-5 border-2 border-[#FF5E00] border-t-transparent rounded-full animate-spin mb-2" />
                          <p>Loading clicks data...</p>
                        </td>
                      </tr>
                    ) : clicksData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-[#6B6B6B]">
                          No card click interactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      clicksData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAFA]">
                          <td className="py-3 px-4 font-semibold text-[#111111]">
                            {item.service}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#FF5E00] text-sm">
                              {item.count}
                            </span>{' '}
                            clicks
                          </td>
                          <td className="py-3 px-4 text-[#6B6B6B]">
                            {item.lastClicked
                              ? new Date(item.lastClicked).toLocaleString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. OFFER POPUPS TAB */}
        {/* ============================================================ */}
        {activeTab === 'popups' && <PopupsManager />}

        {/* ============================================================ */}
        {/* 6. ALL SECTIONS TAB (navbar, footer and every home block) */}
        {/* ============================================================ */}
        {activeTab === 'sections' && <SectionsManager />}
      </main>

      {/* ============================================================ */}
      {/* LEAD DETAIL SLIDE-OVER DRAWER */}
      {/* ============================================================ */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLead(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full sm:max-w-lg xl:max-w-xl bg-white h-full shadow-2xl border-l border-[#EDEDED] z-10 p-4 sm:p-6 xl:p-8 flex flex-col overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EDEDED] mb-6">
              <div className="min-w-0">
                <span className="text-xs font-mono font-bold text-[#FF5E00]">
                  {selectedLead.leadId}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#111111]">
                  Lead Specifications
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED]"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-6 flex-1">
              {/* Contact Information */}
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EDEDED] space-y-2">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#6B6B6B]">Client Name:</span>
                  <span className="font-bold text-[#111111] text-right break-words">{selectedLead.name}</span>
                </div>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#6B6B6B]">Email:</span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="font-bold text-[#FF5E00] hover:underline"
                  >
                    {selectedLead.email}
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
                  <span className="text-[#6B6B6B] block mb-1">Purpose</span>
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
                    className="w-full p-3 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#A1A1AA] focus:border-[#FF5E00] focus:outline-none"
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
              <div className="pt-2 text-[11px] text-[#A1A1AA] space-y-1">
                <div>Submitted: {new Date(selectedLead.createdAt).toLocaleString()}</div>
                <div>Visitor UUID: {selectedLead.visitorId}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmElement}
    </div>
  );
}

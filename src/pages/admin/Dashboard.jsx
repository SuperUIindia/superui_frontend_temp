import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useServices } from '../../lib/services';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/useConfirm';
import { logError } from '../../lib/logger';
import { PATHS } from '../../routes/paths';

import AdminLayout from '../../features/admin/AdminLayout';
import OverviewTab from '../../features/admin/overview/OverviewTab';
import LeadsTab from '../../features/admin/leads/LeadsTab';
import VisitorsTab from '../../features/admin/visitors/VisitorsTab';
import ClicksTab from '../../features/admin/clicks/ClicksTab';
import PopupsManager from '../../components/PopupsManager';
import SectionsManager from '../../components/SectionsManager';

const toDateInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const TODAY = toDateInputValue(new Date());

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const services = useServices();
  const toast = useToast();
  const { confirm, confirmElement } = useConfirm();

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
  const [leadFromDate, setLeadFromDate] = useState(TODAY);
  const [leadToDate, setLeadToDate] = useState(TODAY);
  const [leadUnreadOnly, setLeadUnreadOnly] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
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

  // Bulk Selection State
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedVisitors, setSelectedVisitors] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Derive active tab from URL path
  const pathname = location.pathname;
  let activeTab = 'overview';
  if (pathname.includes('/leads')) activeTab = 'leads';
  else if (pathname.includes('/visitors')) activeTab = 'visitors';
  else if (pathname.includes('/clicks')) activeTab = 'clicks';
  else if (pathname.includes('/popups')) activeTab = 'popups';
  else if (pathname.includes('/sections')) activeTab = 'sections';

  // Fetch Current Admin Info
  useEffect(() => {
    api
      .get('/api/admin/me')
      .then((res) => {
        if (res?.data?.username) {
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
      if (res?.data) {
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
      if (res?.data) {
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
      if (res?.data) {
        setVisitors(res.data.visitors || []);
        setVisitorsTotal(res.data.total || 0);
        setVisitorsTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      logError('load visitors', err);
      toast.error('Could not load visitor logs.');
    } finally {
      setLoadingVisitors(false);
    }
  }, [visitorsPage, toast]);

  // Fetch Clicks
  const fetchClicks = useCallback(async () => {
    setLoadingClicks(true);
    try {
      const res = await api.get('/api/admin/clicks');
      if (res?.data) {
        setClicksData(res.data || []);
      }
    } catch (err) {
      logError('load clicks', err);
      toast.error('Could not load clicks data.');
    } finally {
      setLoadingClicks(false);
    }
  }, [toast]);

  // Trigger data loads on tab change
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'leads') {
      fetchLeads();
    } else if (activeTab === 'visitors') {
      fetchVisitors();
      if (!stats) fetchStats();
    } else if (activeTab === 'clicks') {
      fetchClicks();
    }
  }, [activeTab, fetchStats, fetchLeads, fetchVisitors, fetchClicks, stats]);

  // Refresh All
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'overview') await fetchStats();
      else if (activeTab === 'leads') await fetchLeads();
      else if (activeTab === 'visitors') await fetchVisitors();
      else if (activeTab === 'clicks') await fetchClicks();
      toast.success('Data refreshed');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Open Lead Drawer
  const handleSelectLead = useCallback(
    async (lead) => {
      setSelectedLead(lead);
      setEditStatus(lead.status);
      setEditNotes(lead.notes || '');
      setSaveSuccess(false);

      if (!lead.viewedAt) {
        setLeads((prev) =>
          prev.map((item) => (item._id === lead._id ? { ...item, viewedAt: new Date().toISOString() } : item))
        );
        try {
          await api.get(`/api/admin/leads/${lead._id}`);
        } catch {
          // Non-blocking
        }
      }
    },
    []
  );

  // Save Lead Detail
  const handleSaveLeadDetails = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    setSaveSuccess(false);
    try {
      const res = await api.patch(`/api/admin/leads/${selectedLead._id}`, {
        status: editStatus,
        notes: editNotes
      });
      if (res?.success) {
        setSaveSuccess(true);
        toast.success('Lead updated successfully');
        setLeads((prev) =>
          prev.map((item) => (item._id === selectedLead._id ? { ...item, status: editStatus, notes: editNotes } : item))
        );
        fetchStats();
      }
    } catch (err) {
      logError('save lead', err);
      toast.error('Failed to update lead');
    } finally {
      setSavingLead(false);
    }
  };

  // Mark all unread leads viewed
  const handleMarkAllLeadsViewed = useCallback(async () => {
    try {
      await api.post('/api/admin/leads/mark-viewed?all=1');
      toast.success('All notifications marked as read');
      setLeads((prev) => prev.map((l) => ({ ...l, viewedAt: l.viewedAt || new Date().toISOString() })));
    } catch (err) {
      logError('mark all read', err);
      toast.error('Failed to mark all as read');
    }
  }, [toast]);

  // Guarded CSV Export
  const handleExportCsv = async () => {
    try {
      await api.downloadCsv('/api/admin/leads/export.csv');
      toast.success('Lead records exported successfully');
    } catch (err) {
      logError('export csv', err);
      toast.error('Failed to export CSV file');
    }
  };

  // Selection helpers
  const toggleOne = (setter, id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllOnPage = (setter, rows) =>
    setter((prev) => {
      const ids = rows.map((r) => r._id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      return allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
    });

  const clearSelection = (setter) => setter([]);

  // Bulk Delete Leads
  const handleBulkDeleteLeads = async () => {
    if (selectedLeads.length === 0) return;
    const count = selectedLeads.length;
    const confirmed = await confirm({
      title: `Delete ${count} lead${count === 1 ? '' : 's'}?`,
      message: 'This permanently removes the selected leads and notes. This action cannot be undone.',
      confirmLabel: 'Delete permanently'
    });
    if (!confirmed) return;

    setBulkBusy(true);
    try {
      await api.bulkDelete('/api/admin/leads', { ids: selectedLeads });
      toast.success(`Deleted ${count} lead${count === 1 ? '' : 's'}.`);
      setSelectedLeads([]);
      setSelectedLead(null);
      await Promise.all([fetchLeads(), fetchStats()]);
    } catch (err) {
      logError('delete leads', err);
      toast.error(err.message || 'Failed to delete leads.');
    } finally {
      setBulkBusy(false);
    }
  };

  // Bulk Delete Visitors
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

  // Delete All Visitors
  const handleDeleteAllVisitors = async () => {
    const confirmed = await confirm({
      title: 'Delete every visitor record?',
      message: 'This wipes ALL analytics history from the database. This action cannot be undone.',
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
    <AdminLayout
      adminUser={adminUser}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      leadsTotal={leadsTotal || (stats ? stats.totalLeads : 0)}
      onOpenLead={handleSelectLead}
      onMarkAllRead={handleMarkAllLeadsViewed}
    >
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} loadingStats={loadingStats} onRefresh={fetchStats} />
      )}

      {activeTab === 'leads' && (
        <LeadsTab
          leads={leads}
          leadsTotal={leadsTotal}
          leadsPage={leadsPage}
          leadsTotalPages={leadsTotalPages}
          setLeadsPage={setLeadsPage}
          leadStatusFilter={leadStatusFilter}
          setLeadStatusFilter={setLeadStatusFilter}
          leadPurposeFilter={leadPurposeFilter}
          setLeadPurposeFilter={setLeadPurposeFilter}
          leadSearchQuery={leadSearchQuery}
          setLeadSearchQuery={setLeadSearchQuery}
          leadFromDate={leadFromDate}
          setLeadFromDate={setLeadFromDate}
          leadToDate={leadToDate}
          setLeadToDate={setLeadToDate}
          leadUnreadOnly={leadUnreadOnly}
          setLeadUnreadOnly={setLeadUnreadOnly}
          loadingLeads={loadingLeads}
          services={services}
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          savingLead={savingLead}
          saveSuccess={saveSuccess}
          handleSaveLeadDetails={handleSaveLeadDetails}
          handleExportCsv={handleExportCsv}
          selectedLeads={selectedLeads}
          toggleOne={toggleOne}
          setSelectedLeads={setSelectedLeads}
          toggleAllOnPage={toggleAllOnPage}
          clearSelection={clearSelection}
          bulkBusy={bulkBusy}
          handleBulkDeleteLeads={handleBulkDeleteLeads}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'visitors' && (
        <VisitorsTab
          visitors={visitors}
          visitorsTotal={visitorsTotal}
          visitorsPage={visitorsPage}
          visitorsTotalPages={visitorsTotalPages}
          setVisitorsPage={setVisitorsPage}
          loadingVisitors={loadingVisitors}
          selectedVisitors={selectedVisitors}
          setSelectedVisitors={setSelectedVisitors}
          toggleOne={toggleOne}
          toggleAllOnPage={toggleAllOnPage}
          clearSelection={clearSelection}
          bulkBusy={bulkBusy}
          handleBulkDeleteVisitors={handleBulkDeleteVisitors}
          handleDeleteAllVisitors={handleDeleteAllVisitors}
          stats={stats}
        />
      )}

      {activeTab === 'clicks' && (
        <ClicksTab clicksData={clicksData} loadingClicks={loadingClicks} />
      )}

      {activeTab === 'popups' && <PopupsManager />}

      {activeTab === 'sections' && <SectionsManager />}

      {confirmElement}
    </AdminLayout>
  );
}

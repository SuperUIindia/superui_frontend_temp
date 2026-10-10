import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MousePointerClick,
  FileText,
  LogOut,
  RefreshCw,
  Image as ImageIcon,
  LayoutTemplate
} from 'lucide-react';
import { SITE_CONFIG } from '../../lib/env';
import { PATHS } from '../../routes/paths';
import { api } from '../../lib/api';
import LeadNotifications from '../../components/LeadNotifications';

export default function AdminLayout({
  adminUser = 'Admin',
  refreshing = false,
  onRefresh,
  leadsTotal = 0,
  onOpenLead,
  onMarkAllRead,
  children
}) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/admin/logout');
    } catch {
      // Continue navigation even if server error
    } finally {
      navigate(PATHS.adminLogin, { replace: true });
    }
  };

  const navItems = [
    { to: PATHS.adminOverview, label: 'Overview', icon: LayoutDashboard },
    { to: PATHS.adminLeads, label: `Leads (${leadsTotal})`, icon: FileText },
    { to: PATHS.adminVisitors, label: 'Visitors Telemetry', icon: Users },
    { to: PATHS.adminClicks, label: 'Card Clicks', icon: MousePointerClick },
    { to: PATHS.adminPopups, label: 'Offer Popups', icon: ImageIcon },
    { to: PATHS.adminSections, label: 'All Sections', icon: LayoutTemplate }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-[#111111]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EDEDED] shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <a
                href={PATHS.home}
                className="flex items-center gap-2 group shrink-0"
                title="Go to SuperUI homepage"
              >
                <img
                  src={SITE_CONFIG.logoPath}
                  alt={SITE_CONFIG.brand}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-xl object-contain border border-[#EDEDED] group-hover:scale-105 transition-transform"
                />
              </a>
              <span className="text-base sm:text-lg font-black tracking-tight text-[#111111] truncate">
                {SITE_CONFIG.brand}{' '}
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FF5E00] bg-[#FFF1E8] px-2 py-0.5 rounded-full border border-[#FF5E00]/20 hidden sm:inline-block">
                  Console
                </span>
              </span>
            </div>

            {/* Admin Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* New lead notifications */}
              <LeadNotifications
                onOpenLead={onOpenLead}
                onMarkAllRead={onMarkAllRead}
              />

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA] border border-[#EDEDED] transition-colors"
                  title="Refresh data"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FF5E00]' : ''}`} />
                </button>
              )}

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
          <div className="flex gap-1 sm:gap-2 lg:gap-3 border-t border-[#EDEDED] pt-2 pb-2 -mx-1 px-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#FF5E00] text-white shadow-xs shadow-[#FF5E00]/25'
                        : 'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-8 xl:px-10 py-6 sm:py-8 flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
}


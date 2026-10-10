import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Activity,
  MousePointerClick,
  FileText,
  Smartphone,
  Tablet,
  Monitor,
  MapPin,
  Send,
  Check,
  AlertCircle
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
import { api } from '../../../lib/api';
import Button from '../../../components/Button';

function CountUp({ target = 0 }) {
  const [count, setCount] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    // On a refresh the target changes. Animate from the previous value rather
    // than resetting to 0, so the cards never blank out between fetches.
    const start = prevTarget.current;
    const end = parseInt(target, 10) || 0;
    prevTarget.current = end;

    if (end === start) return;

    const duration = 900;
    const incrementTime = 25;
    const steps = Math.max(1, Math.ceil(duration / incrementTime));
    const delta = end - start;
    const step = delta / steps;

    let current = start;
    const timer = setInterval(() => {
      current += step;
      if ((delta > 0 && current >= end) || (delta < 0 && current <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString()}</span>;
}

export default function OverviewTab({ stats, loadingStats, onRefresh }) {
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('Test Email from Admin Dashboard');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/api/admin/email/test', {
        to: testEmailTo.trim(),
        subject: testEmailSubject
      });
      setTestEmailResult({
        success: true,
        message: res.message || `Test email sent successfully to ${testEmailTo}`
      });
    } catch (err) {
      setTestEmailResult({
        success: false,
        message: err.message || 'Failed to send test email. Check your SMTP settings.'
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
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
            <FileText className="w-3 h-3" /> Submissions
          </div>
        </div>

        {/* New Leads */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
          <span className="block text-xs font-medium text-[#6B6B6B] mb-1">New Leads</span>
          <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#FF5E00]">
            {loadingStats ? '-' : <CountUp target={stats?.newLeads || 0} />}
          </div>
          <div className="mt-2 text-[11px] text-[#6B6B6B]">
            Unreviewed
          </div>
        </div>

        {/* Card Clicks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
          <span className="block text-xs font-medium text-[#6B6B6B] mb-1">Card Clicks</span>
          <div className="text-xl sm:text-2xl 2xl:text-3xl font-black text-[#7C3AED]">
            {loadingStats ? '-' : <CountUp target={stats?.totalClicks || 0} />}
          </div>
          <div className="mt-2 text-[11px] text-[#6B6B6B]">
            Interactions
          </div>
        </div>
      </div>

      {/* Device Breakdown */}
      {stats && stats.deviceBreakdown && stats.deviceBreakdown.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
          <h3 className="text-sm font-bold text-[#111111] mb-3">Visitor Devices</h3>
          <div className="flex flex-wrap gap-2">
            {stats.deviceBreakdown.map((d) => {
              const icon = d.device === 'Phone' ? Smartphone : d.device === 'Tablet' ? Tablet : d.device === 'Laptop' ? Monitor : Activity;
              const IconComp = icon;
              return (
                <span key={d.device} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] text-xs font-semibold text-[#111111]">
                  <IconComp className="w-3.5 h-3.5 text-[#FF5E00]" />
                  {d.device}: {d.count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Area Breakdown */}
      {stats && stats.areaBreakdown && stats.areaBreakdown.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
          <h3 className="text-sm font-bold text-[#111111] mb-3">Top Geographic Areas</h3>
          <div className="flex flex-wrap gap-2">
            {stats.areaBreakdown.map((a) => (
              <span key={a.area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#EDEDED] text-xs font-semibold text-[#111111]">
                <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                {a.area}: {a.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Test Email Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEDED] shadow-sm">
        <h3 className="text-sm font-bold text-[#111111] mb-1">Test Email Configuration</h3>
        <p className="text-xs text-[#6B6B6B] mb-3">Send a test email to verify your SMTP setup is working.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="recipient@example.com"
            value={testEmailTo}
            onChange={(e) => setTestEmailTo(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Subject"
            value={testEmailSubject}
            onChange={(e) => setTestEmailSubject(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#EDEDED] bg-white text-[#111111] placeholder:text-[#71717A] focus:border-[#FF5E00] focus:outline-none"
          />
          <Button
            variant="primary"
            size="sm"
            loading={sendingTestEmail}
            onClick={handleSendTestEmail}
            icon={Send}
            disabled={!testEmailTo.trim()}
            className="shrink-0"
          >
            Send Test
          </Button>
        </div>
        {testEmailResult && (
          <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${testEmailResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {testEmailResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {testEmailResult.message}
          </div>
        )}
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
                    stroke="#71717A"
                    fontSize={10}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis stroke="#71717A" fontSize={10} allowDecimals={false} />
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
                  <XAxis type="number" stroke="#71717A" fontSize={10} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="service"
                    stroke="#71717A"
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
  );
}


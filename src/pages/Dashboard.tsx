import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { RecentInvoices } from '../components/dashboard/RecentInvoices';
import { ExceptionChart } from '../components/dashboard/ExceptionChart';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { MobileAppCard } from '../components/dashboard/MobileAppCard';
import { ChatAssistant } from '../components/chat/ChatAssistant';
import { api } from '../services/api';
import { Invoice, DashboardStats } from '../types/invoice';
import { LoadingSpinner } from '../components/common/Loading';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'clean' | 'exception' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(16);
  const [loading, setLoading] = useState(true);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('Sep 1, 2025 – Sep 9, 2025');

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, invoicesData] = await Promise.all([
        api.getDashboardStats(),
        api.getInvoices({
          status: activeTab === 'all' ? undefined : activeTab,
          page: currentPage,
          limit: 8,
        }),
      ]);
      setStats(statsData);
      setInvoices(invoicesData.invoices);
      setTotalPages(invoicesData.totalPages || 16);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const dateRanges = [
    'Sep 1, 2025 – Sep 9, 2025',
    'Aug 1, 2025 – Aug 31, 2025',
    'Last 7 Days',
    'Last 30 Days',
    'Year to Date (2025)',
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout: Left Main Stream + Right AI Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Content Area (8 or 9 cols on wide screens) */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white rounded-2xl p-6 border border-blue-100/70 shadow-2xs">
            {/* Soft decorative background illustration */}
            <div className="absolute right-4 -bottom-6 opacity-30 pointer-events-none hidden sm:block">
              <svg width="220" height="150" viewBox="0 0 220 150" fill="none">
                <rect x="20" y="20" width="120" height="120" rx="16" fill="#BFDBFE" />
                <rect x="50" y="10" width="130" height="130" rx="16" fill="#93C5FD" fillOpacity="0.5" />
                <circle cx="160" cy="50" r="24" fill="#10B981" />
                <path d="M152 50L158 56L170 44" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Here's a quick overview of your invoice processing and exceptions.
                </p>
              </div>

              {/* Date Range Selector */}
              <div className="relative self-start md:self-center">
                <button
                  onClick={() => setDateRangeOpen(!dateRangeOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedDateRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dateRangeOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in-50">
                    {dateRanges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setSelectedDateRange(range);
                          setDateRangeOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                          selectedDateRange === range
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 KPI Cards in a row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Invoices"
              value={stats?.totalInvoices ?? 128}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              iconBgColor="bg-blue-50"
              changeText="12% vs last month"
              changeType="positive"
            />
            <KPICard
              title="Auto-Passed"
              value={stats?.autoPassed ?? 102}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              iconBgColor="bg-emerald-50"
              changeText="18% vs last month"
              changeType="positive"
            />
            <KPICard
              title="Exceptions"
              value={stats?.exceptions ?? 26}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              iconBgColor="bg-rose-50"
              changeText="27% vs last month"
              changeType="negative"
            />
            <KPICard
              title="Pending Review"
              value={stats?.pendingReview ?? 18}
              icon={<Clock className="w-5 h-5 text-indigo-600" />}
              iconBgColor="bg-indigo-50"
              changeText="35% vs last month"
              changeType="neutral"
            />
          </div>

          {/* Invoices Table */}
          {loading && invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8">
              <LoadingSpinner label="Loading live invoice records..." />
            </div>
          ) : (
            <RecentInvoices
              invoices={invoices}
              totalCount={stats?.totalInvoices ?? 128}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}

          {/* Bottom 3 Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ExceptionChart
              data={stats?.breakdown}
              totalExceptions={stats?.exceptions ?? 26}
            />
            <RecentActivityCard />
            <MobileAppCard />
          </div>
        </div>

        {/* Right Sticky AI Assistant Column (Desktop & Tablet) */}
        <div className="xl:col-span-4 2xl:col-span-3 sticky top-20">
          <ChatAssistant isCompact={true} />
        </div>
      </div>
    </div>
  );
};

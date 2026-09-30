import React, { useState } from 'react';
import { Search, Bell, Menu, User, ChevronDown, Check, Shield, UserCheck, Briefcase, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { role, user, switchRole, logout } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      if (role === 'REQUESTER') {
        navigate(`/requester/invoices?search=${encodeURIComponent(searchValue.trim())}`);
      } else {
        navigate(`/invoices?search=${encodeURIComponent(searchValue.trim())}`);
      }
    }
  };

  const handleRoleSelect = (targetRole: UserRole) => {
    switchRole(targetRole);
    setShowRoleMenu(false);
    if (targetRole === 'REQUESTER') {
      navigate('/requester/dashboard');
    } else if (targetRole === 'FINANCE_MANAGER') {
      navigate('/manager/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const roleLabels: Record<UserRole, { title: string; badge: string; icon: React.ReactNode; color: string }> = {
    REQUESTER: {
      title: 'Requester Portal',
      badge: 'Business User',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    AP_REVIEWER: {
      title: 'AP Reviewer Portal',
      badge: 'Primary AP',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
    FINANCE_MANAGER: {
      title: 'Finance Manager Portal',
      badge: 'Executive / Admin',
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200/80',
    },
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: hamburger menu & global search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              role === 'REQUESTER'
                ? 'Search my submissions by invoice #, amount, vendor...'
                : 'Search by invoice number, supplier, amount, date...'
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>
      </div>

      {/* Right side: Role Switcher, notifications, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Portal Switcher Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs hover:opacity-90 transition-all ${roleLabels[role].color}`}
            title="Switch User Role Portal"
          >
            {roleLabels[role].icon}
            <span className="hidden sm:inline">{roleLabels[role].title}</span>
            <span className="sm:hidden">{roleLabels[role].badge}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Active Portal
                </span>
                <span className="text-xs text-slate-500">
                  Select a role to preview its dedicated experience:
                </span>
              </div>

              <div className="py-1">
                {/* Option 1: Requester */}
                <button
                  onClick={() => handleRoleSelect('REQUESTER')}
                  className={`w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    role === 'REQUESTER' ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Requester</span>
                      {role === 'REQUESTER' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">Submit invoices, track my submissions</p>
                  </div>
                </button>

                {/* Option 2: AP Reviewer */}
                <button
                  onClick={() => handleRoleSelect('AP_REVIEWER')}
                  className={`w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    role === 'AP_REVIEWER' ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">AP / Finance Reviewer</span>
                      {role === 'AP_REVIEWER' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">Audit exceptions, approve / reject, AI copilot</p>
                  </div>
                </button>

                {/* Option 3: Finance Manager */}
                <button
                  onClick={() => handleRoleSelect('FINANCE_MANAGER')}
                  className={`w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    role === 'FINANCE_MANAGER' ? 'bg-purple-50/50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Finance Manager / Admin</span>
                      {role === 'FINANCE_MANAGER' && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500">Analytics, policy limits, team productivity</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Notifications
                </h4>
                <span className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <p className="text-xs font-semibold text-slate-800">Duplicate Flagged</p>
                    <span className="text-[10px] text-slate-400 ml-auto">10m ago</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    INV-00124 matches existing record from Global Supplies Ltd.
                  </p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <p className="text-xs font-semibold text-slate-800">Tax Discrepancy</p>
                    <span className="text-[10px] text-slate-400 ml-auto">1h ago</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    INV-00129 missing GSTIN verification details.
                  </p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <p className="text-xs font-semibold text-slate-800">Auto-Pass Complete</p>
                    <span className="text-[10px] text-slate-400 ml-auto">2h ago</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    102 invoices verified and queued for ERP sync.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar with dropdown */}
        <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-medium shadow-sm ring-2 ring-slate-100 hover:ring-blue-400 transition-all ${
              role === 'REQUESTER'
                ? 'bg-emerald-700 text-white'
                : role === 'FINANCE_MANAGER'
                ? 'bg-purple-800 text-white'
                : 'bg-slate-800 text-white'
            }`}
            title={`Active: ${user.title}`}
          >
            <User className="w-4 h-4 text-slate-200" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 pb-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                  {user.title}
                </span>
              </div>

              <div className="pt-2 px-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

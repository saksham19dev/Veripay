import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  AlertTriangle,
  FileText,
  Clock,
  Bot,
  Settings,
  X,
  FileCheck,
  PlusCircle,
  Bell,
  User,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  exceptionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  exceptionCount = 26,
}) => {
  const { role, isRequester, isReviewer, isManager } = useAuth();

  // Role-specific navigation items
  const getNavItems = () => {
    if (isRequester) {
      return [
        { label: 'Dashboard', path: '/requester/dashboard', icon: LayoutDashboard },
        { label: 'Submit Invoice', path: '/requester/submit', icon: PlusCircle },
        { label: 'My Invoices', path: '/requester/invoices', icon: FileText },
        { label: 'Notifications', path: '/requester/notifications', icon: Bell, badge: 2 },
        { label: 'Profile', path: '/requester/profile', icon: User },
      ];
    }

    if (isManager) {
      return [
        { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Invoices', path: '/invoices', icon: FileText },
        {
          label: 'Exceptions',
          path: '/exceptions',
          icon: AlertTriangle,
          badge: exceptionCount > 0 ? exceptionCount : undefined,
        },
        { label: 'Analytics', path: '/manager/analytics', icon: BarChart3 },
        { label: 'Users & Roles', path: '/manager/users', icon: Users },
        { label: 'Policy Rules', path: '/manager/policies', icon: Shield },
        { label: 'Audit Log', path: '/audit-log', icon: Clock },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    // Default AP_REVIEWER
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Upload Invoices', path: '/upload', icon: UploadCloud },
      {
        label: 'Exceptions',
        path: '/exceptions',
        icon: AlertTriangle,
        badge: exceptionCount > 0 ? exceptionCount : undefined,
      },
      { label: 'All Invoices', path: '/invoices', icon: FileText },
      { label: 'AI Assistant', path: '/assistant', icon: Bot },
      { label: 'Audit Log', path: '/audit-log', icon: Clock },
      { label: 'Settings', path: '/settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const getPortalInfo = () => {
    if (isRequester) {
      return {
        badge: 'Requester Portal',
        tagline: 'Submit & Track Invoices',
        homePath: '/requester/dashboard',
        color: 'bg-emerald-600',
      };
    }
    if (isManager) {
      return {
        badge: 'Finance Manager',
        tagline: 'Oversight & Compliance',
        homePath: '/manager/dashboard',
        color: 'bg-purple-600',
      };
    }
    return {
      badge: 'AP Reviewer',
      tagline: 'Invoice Exception Checker',
      homePath: '/dashboard',
      color: 'bg-blue-600',
    };
  };

  const portalInfo = getPortalInfo();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <NavLink to={portalInfo.homePath} className="flex items-center gap-3 group">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 ${portalInfo.color}`}
              >
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block">
                  VeriFlow
                </span>
                <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                  {portalInfo.tagline}
                </span>
              </div>
            </NavLink>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-5 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? isRequester
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : isManager
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                      isRequester
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : isManager
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Illustration and Version */}
        <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Smarter AP.</p>
              <p className="text-[11px] text-slate-500">Faster Payments.</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>VeriFlow v1.0</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
};

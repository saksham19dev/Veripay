import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Briefcase,
  UserCheck,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('AP_REVIEWER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleDirectLogin = (role: UserRole) => {
    login(role);
    showToast(`Logged in as ${role.replace('_', ' ')}`, 'success');
    if (role === 'REQUESTER') {
      navigate('/requester/dashboard');
    } else if (role === 'FINANCE_MANAGER') {
      navigate('/manager/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      handleRoleDirectLogin(selectedRole);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-3">
            <FileCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">VeriFlow</h1>
          <p className="text-xs text-slate-500 mt-1">
            Smarter invoice processing. Faster exception resolution.
          </p>
        </div>

        {/* 1-Click Role Portals Demo Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Click Role-Based Demo Portals
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any role to test its specific permissions and layout:
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Requester Button */}
            <button
              onClick={() => handleRoleDirectLogin('REQUESTER')}
              className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Requester (Business User)</div>
                  <div className="text-[11px] text-slate-500">Alex Rivera • Submit invoices &amp; track</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* AP Reviewer Button */}
            <button
              onClick={() => handleRoleDirectLogin('AP_REVIEWER')}
              className="w-full p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">AP / Finance Reviewer</div>
                  <div className="text-[11px] text-slate-500">Jordan Lee • Audit exceptions &amp; approve</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Finance Manager Button */}
            <button
              onClick={() => handleRoleDirectLogin('FINANCE_MANAGER')}
              className="w-full p-3 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Finance Manager / Admin</div>
                  <div className="text-[11px] text-slate-500">Elena Rostova • Analytics &amp; policy rules</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <form
          onSubmit={handleFormLogin}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4"
        >
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1">
            Or Sign In with Corporate SSO
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="user@enterprise.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="REQUESTER">REQUESTER (Business User)</option>
              <option value="AP_REVIEWER">AP_REVIEWER (Finance Reviewer)</option>
              <option value="FINANCE_MANAGER">FINANCE_MANAGER (Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm mt-2"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400">
          VeriFlow v1.0 • Enterprise AP Exception Management
        </div>
      </div>
    </div>
  );
};

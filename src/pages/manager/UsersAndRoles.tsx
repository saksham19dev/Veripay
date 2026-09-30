import React, { useState } from 'react';
import { Users, UserCheck, Shield, Briefcase, Plus, Check, X, Mail } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  status: 'Active' | 'Invited' | 'Suspended';
}

const INITIAL_TEAM: UserRecord[] = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    email: 'alex.rivera@enterprise.corp',
    role: 'REQUESTER',
    department: 'Procurement & Operations',
    title: 'Business Requisitioner',
    status: 'Active',
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    email: 'jordan.lee@enterprise.corp',
    role: 'AP_REVIEWER',
    department: 'Accounts Payable',
    title: 'Senior AP Auditor',
    status: 'Active',
  },
  {
    id: 'u3',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.corp',
    role: 'FINANCE_MANAGER',
    department: 'Corporate Finance',
    title: 'VP Finance & Operations',
    status: 'Active',
  },
  {
    id: 'u4',
    name: 'Priya Sharma',
    email: 'priya.sharma@enterprise.corp',
    role: 'AP_REVIEWER',
    department: 'Compliance',
    title: 'Tax Compliance Auditor',
    status: 'Active',
  },
  {
    id: 'u5',
    name: 'Marcus Vance',
    email: 'marcus.vance@enterprise.corp',
    role: 'AP_REVIEWER',
    department: 'Accounts Payable',
    title: 'AP Specialist',
    status: 'Active',
  },
];

export const UsersAndRoles: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('AP_REVIEWER');
  const [inviteDept, setInviteDept] = useState('Accounts Payable');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    showToast(`Role updated for user`, 'success');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newUser: UserRecord = {
      id: `u-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      department: inviteDept,
      title: inviteRole === 'REQUESTER' ? 'Requisitioner' : inviteRole === 'AP_REVIEWER' ? 'Auditor' : 'Manager',
      status: 'Active',
    };

    setUsers((prev) => [...prev, newUser]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`Invited ${inviteName} as ${inviteRole}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users &amp; Role-Based Access</h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision user access, assign portal permissions, and govern AP authorization matrices.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowInviteModal(true)}
          icon={<Plus className="w-4 h-4" />}
          className="bg-purple-600 hover:bg-purple-700 shadow-sm self-start sm:self-center"
        >
          Add Team Member
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Active Organization Members</h2>
          <span className="text-xs text-slate-500">{users.length} registered profiles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Portal Access</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{u.department}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        u.role === 'REQUESTER'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.role === 'AP_REVIEWER'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {u.role === 'REQUESTER' && <Briefcase className="w-3 h-3" />}
                      {u.role === 'AP_REVIEWER' && <UserCheck className="w-3 h-3" />}
                      {u.role === 'FINANCE_MANAGER' && <Shield className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {u.role === 'REQUESTER' && '/requester/*'}
                    {u.role === 'AP_REVIEWER' && 'AP Audit & Triage'}
                    {u.role === 'FINANCE_MANAGER' && 'Full Administrative'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="REQUESTER">REQUESTER</option>
                      <option value="AP_REVIEWER">AP_REVIEWER</option>
                      <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Role Permissions Matrix</h2>
          <p className="text-xs text-slate-500">Strict separation of duties enforced across the 3 portals.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-4">Capability / Action</th>
                <th className="py-2.5 px-4 text-center">Requester</th>
                <th className="py-2.5 px-4 text-center">AP Reviewer</th>
                <th className="py-2.5 px-4 text-center">Finance Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Submit Invoices &amp; Upload Receipts</td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Track Own Submission Status &amp; Respond to RFIs</td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Review Organization Exceptions &amp; Evidence</td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Approve / Reject Exceptions &amp; Add Audit Notes</td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Configure Spend Thresholds &amp; Policy Rules</td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800">Manage Users, Portal Roles &amp; Team Productivity</td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-slate-300"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3 px-4 text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Add Team Member"
        subtitle="Provision portal credentials and role permissions"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Lin"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="maya.lin@enterprise.corp"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="REQUESTER">REQUESTER (Business User - Submit &amp; Track)</option>
              <option value="AP_REVIEWER">AP_REVIEWER (Finance Reviewer - Audit &amp; Approve)</option>
              <option value="FINANCE_MANAGER">FINANCE_MANAGER (Admin - Governance &amp; Config)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              required
              value={inviteDept}
              onChange={(e) => setInviteDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

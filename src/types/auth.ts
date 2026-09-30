export type UserRole = 'REQUESTER' | 'AP_REVIEWER' | 'FINANCE_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  avatarUrl?: string;
}

export const DEMO_USERS: Record<UserRole, User> = {
  REQUESTER: {
    id: 'usr-req-01',
    name: 'Alex Rivera',
    email: 'alex.rivera@enterprise.corp',
    role: 'REQUESTER',
    department: 'Procurement & Operations',
    title: 'Business Requisitioner',
  },
  AP_REVIEWER: {
    id: 'usr-rev-02',
    name: 'Jordan Lee',
    email: 'jordan.lee@enterprise.corp',
    role: 'AP_REVIEWER',
    department: 'Accounts Payable',
    title: 'Senior AP Auditor',
  },
  FINANCE_MANAGER: {
    id: 'usr-mgr-03',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.corp',
    role: 'FINANCE_MANAGER',
    department: 'Corporate Finance',
    title: 'VP Finance & Operations',
  },
};

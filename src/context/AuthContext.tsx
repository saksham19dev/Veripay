import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DEMO_USERS } from '../types/auth';

interface AuthContextType {
  user: User;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  isRequester: boolean;
  isReviewer: boolean;
  isManager: boolean;
  canApprove: boolean;
  canConfigurePolicies: boolean;
  canViewAllInvoices: boolean;
}

const STORAGE_KEY_ROLE = 'veriflow_active_role_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE) as UserRole | null;
    if (saved && (saved === 'REQUESTER' || saved === 'AP_REVIEWER' || saved === 'FINANCE_MANAGER')) {
      return saved;
    }
    return 'AP_REVIEWER';
  });

  const user = DEMO_USERS[role];

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_KEY_ROLE, newRole);
  };

  const isRequester = role === 'REQUESTER';
  const isReviewer = role === 'AP_REVIEWER';
  const isManager = role === 'FINANCE_MANAGER';

  const canApprove = isReviewer || isManager;
  const canConfigurePolicies = isManager;
  const canViewAllInvoices = isReviewer || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        isRequester,
        isReviewer,
        isManager,
        canApprove,
        canConfigurePolicies,
        canViewAllInvoices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

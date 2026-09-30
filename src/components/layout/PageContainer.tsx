import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto space-y-6 ${className}`}>
      {children}
    </div>
  );
};

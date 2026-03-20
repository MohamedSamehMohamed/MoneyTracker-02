import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="ml-64 p-8">
      <div className="max-w-6xl">
        {children}
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { StoreHeader } from './StoreHeader';

interface StoreLayoutProps {
  restaurant: {
    name: string;
    description?: string | null;
    logo?: string | null;
    colors: { primary: string; secondary: string; accent: string };
    address: { city: string; state: string };
  };
  children: ReactNode;
}

export function StoreLayout({ restaurant, children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader restaurant={restaurant} />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

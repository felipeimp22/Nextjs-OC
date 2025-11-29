import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface CheckoutLayoutProps {
  restaurantName: string;
  restaurantId: string;
  children: ReactNode;
}

export function CheckoutLayout({ restaurantName, restaurantId, children }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${restaurantId}/store`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Store</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Checkout - {restaurantName}
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { formatRelativeTime } from '@/lib/utils/dateFormatter';
import { Pencil } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: any;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  tags: string[];
  notes: string | null;
  orderHistory: string[];
}

interface CustomersCardProps {
  customers: Customer[];
  currencySymbol: string;
  onEdit: (customer: Customer) => void;
}

export default function CustomersCard({ customers, currencySymbol, onEdit }: CustomersCardProps) {
  const t = useTranslations('customers');

  const formatPhone = (phone: any) => {
    if (!phone) return '-';
    if (typeof phone === 'string') return phone;
    if (phone.number) return phone.number;
    return '-';
  };

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <div key={customer.id} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
              <p className="text-xs text-gray-500">{formatPhone(customer.phone)}</p>
            </div>
            <button
              onClick={() => onEdit(customer)}
              className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
              title={t('edit')}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          {customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {customer.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex px-2 py-1 text-xs font-medium rounded-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('orderCount')}</span>
              <span className="text-sm font-medium text-gray-900">{customer.orderCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('totalSpent')}</span>
              <span className="text-sm font-medium text-gray-900">
                {currencySymbol}{customer.totalSpent.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('lastOrder')}</span>
              <span className="text-sm font-medium text-gray-900">
                {customer.lastOrderDate ? formatRelativeTime(customer.lastOrderDate) : '-'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

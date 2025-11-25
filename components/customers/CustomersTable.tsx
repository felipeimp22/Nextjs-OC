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

interface CustomersTableProps {
  customers: Customer[];
  currencySymbol: string;
  onEdit: (customer: Customer) => void;
}

export default function CustomersTable({ customers, currencySymbol, onEdit }: CustomersTableProps) {
  const t = useTranslations('customers');

  const formatPhone = (phone: any) => {
    if (!phone) return '-';
    if (typeof phone === 'string') return phone;
    if (phone.number) return phone.number;
    return '-';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('email')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('phone')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('orderCount')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('totalSpent')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('lastOrder')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('tags')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{customer.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{formatPhone(customer.phone)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{customer.orderCount}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {currencySymbol}{customer.totalSpent.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {customer.lastOrderDate ? formatRelativeTime(customer.lastOrderDate) : '-'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {customer.tags.length > 0 ? (
                    customer.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => onEdit(customer)}
                  className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                  title={t('edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

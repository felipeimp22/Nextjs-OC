'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { formatCurrencyValue } from '@/lib/utils/numberFormatter';
import { formatRelativeTime } from '@/lib/utils/dateFormatter';

interface Customer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
}

interface TopCustomersTableProps {
  customers: Customer[];
  currencySymbol: string;
}

export default function TopCustomersTable({ customers, currencySymbol }: TopCustomersTableProps) {
  const t = useTranslations('dashboard');

  return (
    <Card variant="elevated" padding="md" className="bg-white border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.topCustomers')}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                {t('topCustomersTable.name')}
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                {t('topCustomersTable.orders')}
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                {t('topCustomersTable.totalSpent')}
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                {t('topCustomersTable.lastOrder')}
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  {t('topCustomersTable.noCustomers')}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-700">
                    {customer.orderCount}
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {formatCurrencyValue(customer.totalSpent, currencySymbol)}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {customer.lastOrderDate
                      ? formatRelativeTime(customer.lastOrderDate)
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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
    <Card variant="elevated" padding="md" className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('charts.topCustomers')}</h3>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="min-w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider pb-3 px-2">
                {t('topCustomersTable.name')}
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider pb-3 px-2">
                {t('topCustomersTable.orders')}
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider pb-3 px-2">
                {t('topCustomersTable.totalSpent')}
              </th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider pb-3 px-2">
                {t('topCustomersTable.lastOrder')}
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">
                  {t('topCustomersTable.noCustomers')}
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-sm font-bold text-gray-900">
                    {formatCurrencyValue(customer.totalSpent, currencySymbol)}
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">
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

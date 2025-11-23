'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';
import OrdersTable from './OrdersTable';
import OrdersCard from './OrdersCard';
import OrdersFilters from './OrdersFilters';
import Pagination from '@/components/shared/Pagination';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  specialInstructions?: string;
  customerAddress?: any;
  driverTip?: number;
  prepTime?: number;
  scheduledPickupTime?: string | Date;
  deliveryInfo?: {
    provider?: string;
    externalId?: string;
  };
}

interface OrdersListProps {
  orders: Order[];
  currencySymbol: string;
  onEdit: (order: Order) => void;
}

export default function OrdersList({ orders, currencySymbol, onEdit }: OrdersListProps) {
  const t = useTranslations('orders');
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrderType, setFilterOrderType] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleDateRangeChange = (value: string) => {
    setFilterDateRange(value);
    if (value) {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
  };

  const handleCustomDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateFrom(e.target.value);
    if (e.target.value) {
      setFilterDateRange('');
    }
  };

  const handleCustomDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateTo(e.target.value);
    if (e.target.value) {
      setFilterDateRange('');
    }
  };

  const handleClearCustomDates = () => {
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterOrderType, filterPaymentStatus, filterDateRange, customDateFrom, customDateTo]);

  return (
    <div className="w-full md:max-w-7xl md:mx-auto">
      <OrdersFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterOrderType={filterOrderType}
        onFilterOrderTypeChange={setFilterOrderType}
        filterPaymentStatus={filterPaymentStatus}
        onFilterPaymentStatusChange={setFilterPaymentStatus}
        filterDateRange={filterDateRange}
        onFilterDateRangeChange={handleDateRangeChange}
        customDateFrom={customDateFrom}
        onCustomDateFromChange={handleCustomDateFromChange}
        customDateTo={customDateTo}
        onCustomDateToChange={handleCustomDateToChange}
        onClearCustomDates={handleClearCustomDates}
      />

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noOrders')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {searchQuery || filterStatus || filterOrderType || filterPaymentStatus || filterDateRange || customDateFrom || customDateTo
              ? t('noOrdersAdjustFilters')
              : t('noOrdersYet')}
          </p>
        </div>
      ) : isMobile ? (
        <OrdersCard orders={paginatedOrders} currencySymbol={currencySymbol} onEdit={onEdit} />
      ) : (
        <OrdersTable orders={paginatedOrders} currencySymbol={currencySymbol} onEdit={onEdit} />
      )}

      {filteredOrders.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}
    </div>
  );
}

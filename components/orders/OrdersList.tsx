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
    // Search filter
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    // Status filter
    const matchesStatus = !filterStatus || order.status === filterStatus;

    // Order type filter
    const matchesOrderType = !filterOrderType || order.orderType === filterOrderType;

    // Payment status filter
    const matchesPaymentStatus = !filterPaymentStatus || order.paymentStatus === filterPaymentStatus;

    // Date range filter
    let matchesDateRange = true;
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterDateRange) {
      switch (filterDateRange) {
        case 'today':
          matchesDateRange = orderDate >= today;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const dayBeforeYesterday = new Date(yesterday);
          dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
          matchesDateRange = orderDate >= dayBeforeYesterday && orderDate < yesterday;
          break;
        case 'last7days':
          const last7Days = new Date(today);
          last7Days.setDate(last7Days.getDate() - 7);
          matchesDateRange = orderDate >= last7Days;
          break;
        case 'last30days':
          const last30Days = new Date(today);
          last30Days.setDate(last30Days.getDate() - 30);
          matchesDateRange = orderDate >= last30Days;
          break;
        case 'thisMonth':
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDateRange = orderDate >= firstDayOfMonth;
          break;
        case 'lastMonth':
          const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDateRange = orderDate >= firstDayOfLastMonth && orderDate < firstDayOfThisMonth;
          break;
      }
    }

    // Custom date range filter
    if (customDateFrom && customDateTo) {
      const fromDate = new Date(customDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(customDateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = orderDate >= fromDate && orderDate <= toDate;
    } else if (customDateFrom) {
      const fromDate = new Date(customDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDateRange = orderDate >= fromDate;
    } else if (customDateTo) {
      const toDate = new Date(customDateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = orderDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesOrderType && matchesPaymentStatus && matchesDateRange;
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useOrders } from '@/hooks/useOrders';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchFilter, { CustomFilter } from '@/components/shared/SearchFilter';
import Pagination from '@/components/shared/Pagination';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/utils/dateFormatter';
import { Pencil } from 'lucide-react';
import OrderModal from '@/components/shared/OrderModal';
import { getRestaurantMenuData } from '@/lib/serverActions/menu.actions';

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
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    options?: Array<{ name: string; choice: string; priceAdjustment: number }>;
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const isMobile = useIsMobile();
  const t = useTranslations('orders');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrderType, setFilterOrderType] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (customDateFrom || customDateTo) {
      setDateFrom(customDateFrom || undefined);
      setDateTo(customDateTo || undefined);
      return;
    }

    if (filterDateRange) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      switch (filterDateRange) {
        case 'today':
          setDateFrom(todayStr);
          setDateTo(todayStr);
          break;
        case 'last7days': {
          const last7Days = new Date(today);
          last7Days.setDate(today.getDate() - 7);
          setDateFrom(last7Days.toISOString().split('T')[0]);
          setDateTo(todayStr);
          break;
        }
        case 'last30days': {
          const last30Days = new Date(today);
          last30Days.setDate(today.getDate() - 30);
          setDateFrom(last30Days.toISOString().split('T')[0]);
          setDateTo(todayStr);
          break;
        }
        case 'thisMonth': {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          setDateFrom(firstDay.toISOString().split('T')[0]);
          setDateTo(todayStr);
          break;
        }
        default:
          setDateFrom(undefined);
          setDateTo(undefined);
      }
    } else {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
  }, [filterDateRange, customDateFrom, customDateTo]);

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

  const { data: orders = [], isLoading } = useOrders(restaurantId, {
    status: filterStatus || undefined,
    orderType: filterOrderType || undefined,
    paymentStatus: filterPaymentStatus || undefined,
    dateFrom,
    dateTo,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['restaurantMenuData', restaurantId],
    queryFn: async () => {
      const result = await getRestaurantMenuData(restaurantId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedRestaurantId && selectedRestaurantId === restaurantId,
  });

  useEffect(() => {
    if (!selectedRestaurantId) {
      router.push('/setup');
    } else if (selectedRestaurantId !== restaurantId) {
      router.push(`/${selectedRestaurantId}/orders`);
    }
  }, [selectedRestaurantId, restaurantId, router]);

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

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOrderSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
  };

  const handleCloseModal = () => {
    setIsOrderModalOpen(false);
    setEditingOrder(null);
  };

  if (!selectedRestaurantId || selectedRestaurantId !== restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'pending', label: t('statusOptions.pending') },
    { value: 'confirmed', label: t('statusOptions.confirmed') },
    { value: 'preparing', label: t('statusOptions.preparing') },
    { value: 'ready', label: t('statusOptions.ready') },
    { value: 'out_for_delivery', label: t('statusOptions.outForDelivery') },
    { value: 'delivered', label: t('statusOptions.delivered') },
    { value: 'completed', label: t('statusOptions.completed') },
    { value: 'cancelled', label: t('statusOptions.cancelled') },
  ];

  const orderTypeOptions = [
    { value: 'pickup', label: t('typeOptions.pickup') },
    { value: 'delivery', label: t('typeOptions.delivery') },
    { value: 'dine_in', label: t('typeOptions.dineIn') },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: t('paymentStatusOptions.pending') },
    { value: 'paid', label: t('paymentStatusOptions.paid') },
    { value: 'failed', label: t('paymentStatusOptions.failed') },
    { value: 'refunded', label: t('paymentStatusOptions.refunded') },
    { value: 'partially_refunded', label: t('paymentStatusOptions.partiallyRefunded') },
  ];

  const dateRangeOptions = [
    { value: 'today', label: t('dateRangeOptions.today') },
    { value: 'last7days', label: t('dateRangeOptions.last7days') },
    { value: 'last30days', label: t('dateRangeOptions.last30days') },
    { value: 'thisMonth', label: t('dateRangeOptions.thisMonth') },
  ];

  const filters: CustomFilter[] = [
    {
      id: 'status',
      label: t('filters.status'),
      placeholder: t('filters.allStatuses'),
      options: statusOptions,
      value: filterStatus,
      onChange: setFilterStatus,
    },
    {
      id: 'orderType',
      label: t('filters.orderType'),
      placeholder: t('filters.allTypes'),
      options: orderTypeOptions,
      value: filterOrderType,
      onChange: setFilterOrderType,
    },
    {
      id: 'paymentStatus',
      label: t('filters.paymentStatus'),
      placeholder: t('filters.allPaymentStatuses'),
      options: paymentStatusOptions,
      value: filterPaymentStatus,
      onChange: setFilterPaymentStatus,
    },
    {
      id: 'dateRange',
      label: t('filters.quickDateFilter'),
      placeholder: t('filters.selectQuickFilter'),
      options: dateRangeOptions,
      value: filterDateRange,
      onChange: handleDateRangeChange,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'refunded':
      case 'partially_refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOrderType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="w-full md:max-w-7xl md:mx-auto">
      <div className="mb-6 space-y-4">
        <SearchFilter
          searchPlaceholder={t('searchPlaceholder')}
          onSearchChange={setSearchQuery}
          filters={filters}
          debounceDelay={500}
        />

        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-gray-700">{t('customDateRange.title')}</h3>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
              <div className="flex-1">
                <label htmlFor="dateFrom" className="block text-xs text-gray-600 mb-1.5">
                  {t('customDateRange.fromDate')}
                </label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={customDateFrom}
                  onChange={handleCustomDateFromChange}
                  max={customDateTo || undefined}
                  placeholder={t('customDateRange.selectStartDate')}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="dateTo" className="block text-xs text-gray-600 mb-1.5">
                  {t('customDateRange.toDate')}
                </label>
                <Input
                  id="dateTo"
                  type="date"
                  value={customDateTo}
                  onChange={handleCustomDateToChange}
                  min={customDateFrom || undefined}
                  placeholder={t('customDateRange.selectEndDate')}
                />
              </div>
            </div>
            {(customDateFrom || customDateTo) && (
              <button
                onClick={() => {
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                className="text-xs text-brand-navy hover:text-brand-red transition-colors self-start"
              >
                {t('customDateRange.clearDates')}
              </button>
            )}
          </div>
        </div>
      </div>

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
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {formatStatus(order.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('orderType')}</span>
                  <span className="text-sm font-medium text-gray-900">{formatOrderType(order.orderType)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('total')}</span>
                  <span className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('created')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatRelativeTime(order.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 mt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(order)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-brand-navy/10 hover:bg-brand-navy/20 rounded-sm transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  {t('edit')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orderNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payment')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('total')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('created')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatOrderType(order.orderType)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(order)}
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
      )}

      {filteredOrders.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}

      {menuData && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={handleCloseModal}
          restaurantId={restaurantId}
          menuItems={menuData.menuItems || []}
          options={menuData.options || []}
          menuRules={menuData.menuRules || []}
          currencySymbol={menuData.currencySymbol || '$'}
          onOrderSaved={handleOrderSaved}
          existingOrder={editingOrder ? {
            id: editingOrder.id,
            customerName: editingOrder.customerName,
            customerPhone: editingOrder.customerPhone,
            customerEmail: editingOrder.customerEmail,
            orderType: editingOrder.orderType as 'pickup' | 'delivery' | 'dine_in',
            paymentStatus: editingOrder.paymentStatus as 'pending' | 'paid',
            paymentMethod: editingOrder.paymentMethod as 'card' | 'cash' | 'other',
            specialInstructions: editingOrder.specialInstructions,
            items: editingOrder.items,
          } : undefined}
        />
      )}
    </div>
  );
}

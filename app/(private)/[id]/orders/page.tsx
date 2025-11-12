'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { useOrders } from '@/hooks/useOrders';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchFilter, { CustomFilter } from '@/components/shared/SearchFilter';
import Pagination from '@/components/shared/Pagination';
import { formatDistanceToNow } from 'date-fns';

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
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const { selectedRestaurantId } = useRestaurantStore();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrderType, setFilterOrderType] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);

  useEffect(() => {
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
  }, [filterDateRange]);

  const { data: orders = [], isLoading } = useOrders(restaurantId, {
    status: filterStatus || undefined,
    orderType: filterOrderType || undefined,
    paymentStatus: filterPaymentStatus || undefined,
    dateFrom,
    dateTo,
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
  }, [searchQuery, filterStatus, filterOrderType, filterPaymentStatus, filterDateRange]);

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
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const orderTypeOptions = [
    { value: 'pickup', label: 'Pickup' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'dine_in', label: 'Dine In' },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
  ];

  const filters: CustomFilter[] = [
    {
      id: 'status',
      label: 'Status',
      placeholder: 'All Statuses',
      options: statusOptions,
      value: filterStatus,
      onChange: setFilterStatus,
    },
    {
      id: 'orderType',
      label: 'Order Type',
      placeholder: 'All Types',
      options: orderTypeOptions,
      value: filterOrderType,
      onChange: setFilterOrderType,
    },
    {
      id: 'paymentStatus',
      label: 'Payment Status',
      placeholder: 'All Payment Statuses',
      options: paymentStatusOptions,
      value: filterPaymentStatus,
      onChange: setFilterPaymentStatus,
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      placeholder: 'All Time',
      options: dateRangeOptions,
      value: filterDateRange,
      onChange: setFilterDateRange,
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your orders</p>
        </div>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchPlaceholder="Search by order number, customer name, email, or phone..."
          onSearchChange={setSearchQuery}
          filters={filters}
          debounceDelay={500}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="text-sm text-gray-600 mt-1">
            {searchQuery || filterStatus || filterOrderType || filterPaymentStatus || filterDateRange
              ? 'Try adjusting your search or filters'
              : 'Orders will appear here once customers place them'}
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
                  <span className="text-sm text-gray-600">Order Type</span>
                  <span className="text-sm font-medium text-gray-900">{formatOrderType(order.orderType)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </span>
                </div>
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
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
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
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </span>
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
    </div>
  );
}

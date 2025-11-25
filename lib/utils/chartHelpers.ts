import { startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export function groupOrdersByDay(
  orders: any[],
  dateFrom: Date,
  dateTo: Date,
  timezone: string
): ChartDataPoint[] {
  const days = eachDayOfInterval({ start: dateFrom, end: dateTo });

  return days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    });

    const revenue = dayOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      date: format(day, 'MMM dd'),
      value: revenue,
      label: formatInTimeZone(day, timezone, 'MMM dd, yyyy'),
    };
  });
}

export function groupOrdersByWeek(
  orders: any[],
  dateFrom: Date,
  dateTo: Date,
  timezone: string
): ChartDataPoint[] {
  const weeks = eachWeekOfInterval({ start: dateFrom, end: dateTo });

  return weeks.map((week) => {
    const weekStart = startOfDay(week);
    const weekEnd = endOfDay(new Date(week.getTime() + 6 * 24 * 60 * 60 * 1000));

    const weekOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });

    const revenue = weekOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      date: format(week, 'MMM dd'),
      value: revenue,
      label: formatInTimeZone(week, timezone, 'Week of MMM dd'),
    };
  });
}

export function groupOrdersByMonth(
  orders: any[],
  dateFrom: Date,
  dateTo: Date,
  timezone: string
): ChartDataPoint[] {
  const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });

  return months.map((month) => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });

    const revenue = monthOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      date: format(month, 'MMM'),
      value: revenue,
      label: formatInTimeZone(month, timezone, 'MMMM yyyy'),
    };
  });
}

export function getChartColors(
  primaryColor: string = '#282e59',
  secondaryColor: string = '#d4af37',
  accentColor: string = '#c7a146'
) {
  return {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    gray: '#6b7280',
  };
}

export function prepareChartData(
  data: any[],
  labelKey: string,
  valueKey: string
): { name: string; value: number }[] {
  return data.map((item) => ({
    name: item[labelKey],
    value: item[valueKey],
  }));
}

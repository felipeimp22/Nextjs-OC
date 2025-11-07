import PrivateLayout from '@/components/layout/PrivateLayout';

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateLayout>{children}</PrivateLayout>;
}

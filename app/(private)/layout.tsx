import PrivateLayout from '@/components/layout/PrivateLayout';

export default function PrivateRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateLayout>{children}</PrivateLayout>;
}
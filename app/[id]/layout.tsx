import { ToastProvider } from '@/components/ui';

export default function CustomerFacingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

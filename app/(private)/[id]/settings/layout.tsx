'use client';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-2">
      {children}
    </div>
  );
}

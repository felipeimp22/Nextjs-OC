import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function FormSection({ title, description, children, actions }: FormSectionProps) {
  return (
    <section className="space-y-4 w-full">
      <div className="flex items-start justify-between pb-3 border-b border-gray-200 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className="w-full">{children}</div>
    </section>
  );
}
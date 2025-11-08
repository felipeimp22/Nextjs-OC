import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function FormSection({ title, description, children, actions }: FormSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
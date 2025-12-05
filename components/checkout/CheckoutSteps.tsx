'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CheckoutStepsProps {
  currentStep: 'info' | 'payment' | 'confirmation';
  primaryColor?: string;
}

const stepIds = ['info', 'payment', 'confirmation'] as const;

export function CheckoutSteps({ currentStep, primaryColor = '#282e59' }: CheckoutStepsProps) {
  const t = useTranslations('checkout.steps');

  const steps = stepIds.map((id, index) => ({
    id,
    label: t(id),
    order: index + 1,
  }));
  const currentStepOrder = steps.find((s) => s.id === currentStep)?.order || 1;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = step.order < currentStepOrder;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors',
                    isCompleted && 'bg-green-500 text-white',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-600'
                  )}
                  style={{
                    backgroundColor: isCurrent ? primaryColor : undefined,
                    color: isCurrent ? 'white' : undefined,
                  }}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.order}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium',
                    !isCurrent && !isCompleted && 'text-gray-500'
                  )}
                  style={{
                    color: (isCurrent || isCompleted) ? primaryColor : undefined,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 md:w-24 h-1 mx-2 transition-colors',
                    !isCompleted && 'bg-gray-200'
                  )}
                  style={{
                    backgroundColor: isCompleted ? '#22c55e' : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
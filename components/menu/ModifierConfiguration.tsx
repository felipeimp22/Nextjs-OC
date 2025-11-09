'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import Toggle from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { useIsMobile } from '@/hooks/use-mobile';
import ChoiceAdjustmentEditor from './ChoiceAdjustmentEditor';

interface Option {
  id: string;
  name: string;
  description?: string;
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number;
  choices: {
    id: string;
    name: string;
    basePrice: number;
  }[];
  category: {
    id: string;
    name: string;
  };
}

interface PriceAdjustment {
  targetOptionId: string;
  targetChoiceId?: string;
  adjustmentType: 'multiplier' | 'addition' | 'fixed';
  value: number;
}

interface ChoiceAdjustment {
  choiceId: string;
  priceAdjustment: number;
  isAvailable: boolean;
  isDefault: boolean;
  adjustments: PriceAdjustment[];
}

interface AppliedOption {
  optionId: string;
  required: boolean;
  order: number;
  choiceAdjustments: ChoiceAdjustment[];
}

interface ModifierConfigurationProps {
  availableOptions: Option[];
  appliedOptions: AppliedOption[];
  onUpdate: (options: AppliedOption[]) => void;
}

export default function ModifierConfiguration({
  availableOptions,
  appliedOptions,
  onUpdate,
}: ModifierConfigurationProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('menu.itemModifiers.configuration');
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(
    appliedOptions.length > 0 ? appliedOptions[0].optionId : null
  );

  const handleToggleRequired = (optionId: string) => {
    const updated = appliedOptions.map(ao =>
      ao.optionId === optionId ? { ...ao, required: !ao.required } : ao
    );
    onUpdate(updated);
  };

  const handleMoveUp = (optionId: string) => {
    const index = appliedOptions.findIndex(ao => ao.optionId === optionId);
    if (index <= 0) return;

    const updated = [...appliedOptions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((ao, i) => ao.order = i);
    onUpdate(updated);
  };

  const handleMoveDown = (optionId: string) => {
    const index = appliedOptions.findIndex(ao => ao.optionId === optionId);
    if (index < 0 || index >= appliedOptions.length - 1) return;

    const updated = [...appliedOptions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((ao, i) => ao.order = i);
    onUpdate(updated);
  };

  const handleUpdateChoiceAdjustments = (optionId: string, choiceAdjustments: ChoiceAdjustment[]) => {
    const updated = appliedOptions.map(ao =>
      ao.optionId === optionId ? { ...ao, choiceAdjustments } : ao
    );
    onUpdate(updated);
  };

  const getOptionDetails = (optionId: string) => {
    return availableOptions.find(o => o.id === optionId);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <Text className="mb-6 text-gray-600">
        {t('description')}
      </Text>

      {appliedOptions.length === 0 && (
        <div className="text-center py-12">
          <Text className="text-gray-500" dangerouslySetInnerHTML={{ __html: t('noModifiersSelected') }} />
        </div>
      )}

        <div className="space-y-4">
          {appliedOptions.map((appliedOption, index) => {
            const optionDetails = getOptionDetails(appliedOption.optionId);
            if (!optionDetails) return null;

            const isExpanded = expandedOptionId === appliedOption.optionId;

            return (
              <div
                key={appliedOption.optionId}
                className="border rounded-lg bg-white overflow-hidden transition-shadow duration-200 hover:shadow-md"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                  onClick={() => setExpandedOptionId(isExpanded ? null : appliedOption.optionId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Text className="font-semibold">
                          {index + 1}. {optionDetails.name}
                        </Text>
                        {appliedOption.required && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                            {t('required')}
                          </span>
                        )}
                      </div>
                      {optionDetails.description && (
                        <Text variant="small" className="text-gray-500">
                          {optionDetails.description}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(appliedOption.optionId);
                        }}
                        disabled={index === 0}
                        className="px-2 py-1"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(appliedOption.optionId);
                        }}
                        disabled={index === appliedOptions.length - 1}
                        className="px-2 py-1"
                      >
                        ↓
                      </Button>
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                        {!isMobile && (
                          <Text variant="small" className="text-gray-600">
                            {t('required')}
                          </Text>
                        )}
                        <Toggle
                          id={`required-toggle-${appliedOption.optionId}`}
                          checked={appliedOption.required}
                          onChange={() => handleToggleRequired(appliedOption.optionId)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  <div className="border-t bg-gray-50 p-4">
                    <ChoiceAdjustmentEditor
                      optionDetails={optionDetails}
                      choiceAdjustments={appliedOption.choiceAdjustments}
                      appliedOptions={appliedOptions}
                      availableOptions={availableOptions}
                      onUpdate={(adjustments) =>
                        handleUpdateChoiceAdjustments(appliedOption.optionId, adjustments)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}

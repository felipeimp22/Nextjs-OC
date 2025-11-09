'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import Toggle from '@/components/ui/Toggle';
import { useIsMobile } from '@/hooks/use-mobile';

interface Option {
  id: string;
  name: string;
  description?: string;
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

interface ModifierSelectorProps {
  availableOptions: Option[];
  selectedOptionIds: string[];
  onUpdate: (selectedIds: string[]) => void;
}

export default function ModifierSelector({
  availableOptions,
  selectedOptionIds,
  onUpdate,
}: ModifierSelectorProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('menu.itemModifiers.selector');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedOptionIds));

  const handleToggle = (optionId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelected(newSelected);
    onUpdate(Array.from(newSelected));
  };

  const groupedOptions = availableOptions.reduce((acc, option) => {
    const categoryName = option.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
        <Text className="mb-6 text-gray-600">
          {t('description')}
        </Text>

        {Object.entries(groupedOptions).map(([categoryName, options]) => (
          <div key={categoryName} className="mb-6">
            <Text className="mb-3 font-semibold text-gray-700 text-lg">
              {categoryName}
            </Text>
            <div className="space-y-3">
              {options.map((option) => (
                <div
                  key={option.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selected.has(option.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                  onClick={() => handleToggle(option.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Toggle
                          checked={selected.has(option.id)}
                          onChange={() => handleToggle(option.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <Text className="font-medium">
                            {option.name}
                          </Text>
                          {option.description && (
                            <Text variant="small" className="text-gray-500 mt-1">
                              {option.description}
                            </Text>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 ml-11">
                        <Text variant="small" className="text-gray-600 mb-2">
                          {t('choices')}: {option.choices.length}
                        </Text>
                        <div className="flex flex-wrap gap-2">
                          {option.choices.slice(0, isMobile ? 3 : 5).map((choice) => (
                            <span
                              key={choice.id}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {choice.name}
                              {choice.basePrice > 0 && ` (+$${choice.basePrice.toFixed(2)})`}
                            </span>
                          ))}
                          {option.choices.length > (isMobile ? 3 : 5) && (
                            <span className="px-2 py-1 text-gray-500 text-xs">
                              +{option.choices.length - (isMobile ? 3 : 5)} {t('moreChoices')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {availableOptions.length === 0 && (
          <div className="text-center py-12">
            <Text className="text-gray-500">
              {t('noModifiersAvailable')}
            </Text>
          </div>
        )}

        <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text variant="small" className="text-blue-900">
            <strong>{selected.size}</strong> {t(selected.size !== 1 ? 'selectedCount_other' : 'selectedCount', {count: selected.size})}{' '}
            {t('switchToConfig')} <strong>{t('configTab')}</strong> {t('toSetup')}
          </Text>
        </div>
    </div>
  );
}

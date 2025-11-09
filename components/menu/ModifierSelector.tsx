'use client';

import { useState } from 'react';
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
  onSelect: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export default function ModifierSelector({
  availableOptions,
  selectedOptionIds,
  onSelect,
  onCancel,
}: ModifierSelectorProps) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedOptionIds));

  const handleToggle = (optionId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelected(newSelected);
  };

  const handleContinue = () => {
    onSelect(Array.from(selected));
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Text className="mb-6 text-gray-600">
          Select the modifiers you want to apply to this menu item. You can configure pricing and rules in the next step.
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
                          Choices: {option.choices.length}
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
                              +{option.choices.length - (isMobile ? 3 : 5)} more
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
              No modifiers available. Create modifiers first to add them to menu items.
            </Text>
          </div>
        )}
      </div>

      <div className="border-t px-6 py-4 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <Text variant="small" className="text-gray-600">
            {selected.size} modifier{selected.size !== 1 ? 's' : ''} selected
          </Text>
        </div>
        <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'flex-row justify-end'}`}>
          <Button variant="secondary" onClick={onCancel} className="flex-1 md:flex-none">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={selected.size === 0}
            className="flex-1 md:flex-none"
          >
            Continue to Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}

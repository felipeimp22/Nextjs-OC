'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';

interface ModifierSelectorProps {
  itemRules: any;
  options: any[];
  selectedOptions: any[];
  onOptionsChange: (options: any[]) => void;
  currencySymbol: string;
}

export default function ItemModifierSelector({
  itemRules,
  options,
  selectedOptions,
  onOptionsChange,
  currencySymbol,
}: ModifierSelectorProps) {
  if (!itemRules || !itemRules.appliedOptions || itemRules.appliedOptions.length === 0) {
    return null;
  }

  const handleOptionSelect = (appliedOption: any, option: any, choice: any) => {
    const choiceAdjustment = appliedOption.choiceAdjustments.find(
      (ca: any) => ca.choiceId === choice.id
    );

    if (!choiceAdjustment || !choiceAdjustment.isAvailable) {
      return;
    }

    const optionData = {
      optionId: option.id,
      optionName: option.name,
      choiceId: choice.id,
      choiceName: choice.name,
      quantity: 1,
      priceAdjustment: choice.basePrice + (choiceAdjustment.priceAdjustment || 0),
    };

    if (option.multiSelect) {
      const existingIndex = selectedOptions.findIndex(
        (opt) => opt.optionId === option.id && opt.choiceId === choice.id
      );

      if (existingIndex >= 0) {
        const newOptions = [...selectedOptions];
        newOptions.splice(existingIndex, 1);
        onOptionsChange(newOptions);
      } else {
        const optionsForThisType = selectedOptions.filter(
          (opt) => opt.optionId === option.id
        );

        if (optionsForThisType.length < option.maxSelections) {
          onOptionsChange([...selectedOptions, optionData]);
        }
      }
    } else {
      const newOptions = selectedOptions.filter(
        (opt) => opt.optionId !== option.id
      );
      onOptionsChange([...newOptions, optionData]);
    }
  };

  const isChoiceSelected = (optionId: string, choiceId: string) => {
    return selectedOptions.some(
      (opt) => opt.optionId === optionId && opt.choiceId === choiceId
    );
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-semibold text-gray-900">Modifiers</h4>
      {itemRules.appliedOptions
        .sort((a: any, b: any) => a.order - b.order)
        .map((appliedOption: any) => {
          const option = options.find((opt) => opt.id === appliedOption.optionId);

          if (!option) {
            return null;
          }

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {option.name}
                  {appliedOption.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </p>
                {option.multiSelect && (
                  <span className="text-xs text-gray-500">
                    Select up to {option.maxSelections}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {option.choices
                  .filter((choice: any) => {
                    const choiceAdjustment = appliedOption.choiceAdjustments.find(
                      (ca: any) => ca.choiceId === choice.id
                    );
                    return choiceAdjustment && choiceAdjustment.isAvailable && choice.isAvailable;
                  })
                  .map((choice: any) => {
                    const choiceAdjustment = appliedOption.choiceAdjustments.find(
                      (ca: any) => ca.choiceId === choice.id
                    );

                    const price = choice.basePrice + (choiceAdjustment.priceAdjustment || 0);
                    const isSelected = isChoiceSelected(option.id, choice.id);

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleOptionSelect(appliedOption, option, choice)}
                        className={`w-full p-2 rounded border transition-all text-left text-sm ${
                          isSelected
                            ? 'border-brand-navy bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-brand-navy bg-brand-navy'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-2.5 h-2.5 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-gray-900">
                              {choice.name}
                            </span>
                          </div>
                          {price > 0 && (
                            <span className="text-sm font-medium text-gray-700">
                              +{currencySymbol}{price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
    </div>
  );
}

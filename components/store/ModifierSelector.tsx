'use client';

import { useState, useEffect } from 'react';

interface ModifierSelectorProps {
  itemRules: any;
  options: any[];
  selectedOptions: any[];
  onOptionsChange: (options: any[]) => void;
}

export default function ModifierSelector({
  itemRules,
  options,
  selectedOptions,
  onOptionsChange,
}: ModifierSelectorProps) {
  if (!itemRules || !itemRules.appliedOptions) {
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
    <div className="space-y-6">
      {itemRules.appliedOptions
        .sort((a: any, b: any) => a.order - b.order)
        .map((appliedOption: any) => {
          const option = options.find((opt) => opt.id === appliedOption.optionId);

          if (!option) {
            return null;
          }

          return (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  {option.name}
                  {appliedOption.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </h4>
                {option.multiSelect && (
                  <span className="text-sm text-gray-500">
                    Select up to {option.maxSelections}
                  </span>
                )}
              </div>

              {option.description && (
                <p className="text-sm text-gray-600">{option.description}</p>
              )}

              <div className="space-y-2">
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
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-brand-navy bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-brand-navy bg-brand-navy'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
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
                              +${price.toFixed(2)}
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

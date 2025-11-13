'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Minus, Plus } from 'lucide-react';

interface Choice {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
}

interface Option {
  id: string;
  name: string;
  description?: string;
  choices: Choice[];
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number;
  requiresSelection: boolean;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number;
}

interface AppliedOption {
  optionId: string;
  required: boolean;
  order: number;
  choiceAdjustments: Array<{
    choiceId: string;
    priceAdjustment: number;
    isAvailable: boolean;
    isDefault: boolean;
  }>;
}

interface SelectedChoice {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  quantity: number;
  priceAdjustment: number;
}

interface ItemModifierSelectorProps {
  itemRules: {
    appliedOptions: AppliedOption[];
  };
  options: Option[];
  selectedOptions: SelectedChoice[];
  onOptionsChange: (options: SelectedChoice[]) => void;
  currencySymbol: string;
}

export default function ItemModifierSelector({
  itemRules,
  options,
  selectedOptions,
  onOptionsChange,
  currencySymbol,
}: ItemModifierSelectorProps) {
  if (!itemRules?.appliedOptions || itemRules.appliedOptions.length === 0) {
    return null;
  }

  const getSelectedChoicesForOption = (optionId: string): SelectedChoice[] => {
    return selectedOptions.filter(sc => sc.optionId === optionId);
  };

  const getChoiceQuantity = (optionId: string, choiceId: string): number => {
    const selected = selectedOptions.find(
      sc => sc.optionId === optionId && sc.choiceId === choiceId
    );
    return selected?.quantity || 0;
  };

  const isChoiceSelected = (optionId: string, choiceId: string): boolean => {
    return selectedOptions.some(
      sc => sc.optionId === optionId && sc.choiceId === choiceId
    );
  };

  const handleSingleSelect = (
    appliedOption: AppliedOption,
    option: Option,
    choice: Choice,
    choiceAdjustment: any
  ) => {
    const finalPrice = choice.basePrice + (choiceAdjustment.priceAdjustment || 0);

    const newSelection: SelectedChoice = {
      optionId: option.id,
      optionName: option.name,
      choiceId: choice.id,
      choiceName: choice.name,
      quantity: option.allowQuantity ? Math.max(option.minQuantity, 1) : 1,
      priceAdjustment: finalPrice,
    };

    const filteredOptions = selectedOptions.filter(sc => sc.optionId !== option.id);

    const isCurrentlySelected = isChoiceSelected(option.id, choice.id);
    if (isCurrentlySelected && !appliedOption.required && !option.requiresSelection) {
      onOptionsChange(filteredOptions);
    } else {
      onOptionsChange([...filteredOptions, newSelection]);
    }
  };

  const handleMultiSelect = (
    appliedOption: AppliedOption,
    option: Option,
    choice: Choice,
    choiceAdjustment: any
  ) => {
    const isSelected = isChoiceSelected(option.id, choice.id);
    const selectedForOption = getSelectedChoicesForOption(option.id);

    if (isSelected) {
      const isRequired = appliedOption.required || option.requiresSelection;
      const wouldViolateMinimum = isRequired && selectedForOption.length <= option.minSelections;

      if (wouldViolateMinimum) {
        return;
      }

      const newOptions = selectedOptions.filter(
        sc => !(sc.optionId === option.id && sc.choiceId === choice.id)
      );
      onOptionsChange(newOptions);
    } else {
      if (selectedForOption.length >= option.maxSelections) {
        return;
      }

      const finalPrice = choice.basePrice + (choiceAdjustment.priceAdjustment || 0);

      const newSelection: SelectedChoice = {
        optionId: option.id,
        optionName: option.name,
        choiceId: choice.id,
        choiceName: choice.name,
        quantity: option.allowQuantity ? Math.max(option.minQuantity, 1) : 1,
        priceAdjustment: finalPrice,
      };

      onOptionsChange([...selectedOptions, newSelection]);
    }
  };

  const handleQuantityChange = (
    option: Option,
    choice: Choice,
    newQuantity: number
  ) => {
    const clampedQuantity = Math.max(
      option.minQuantity,
      Math.min(option.maxQuantity, newQuantity)
    );

    const newOptions = selectedOptions.map(sc => {
      if (sc.optionId === option.id && sc.choiceId === choice.id) {
        return { ...sc, quantity: clampedQuantity };
      }
      return sc;
    });

    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-semibold text-gray-900">Modifiers</h4>
      {itemRules.appliedOptions
        .sort((a, b) => a.order - b.order)
        .map(appliedOption => {
          const option = options.find(opt => opt.id === appliedOption.optionId);
          if (!option) return null;

          const isOptional = !appliedOption.required && !option.requiresSelection;
          const selectedForOption = getSelectedChoicesForOption(option.id);

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {option.name}
                  {!isOptional && <span className="text-red-600 ml-1">*</span>}
                  {isOptional && <span className="text-gray-500 ml-1 text-xs">(Optional)</span>}
                </p>
                <div className="text-xs text-gray-500">
                  {option.multiSelect && (
                    <span>
                      {option.minSelections > 0 && `Min ${option.minSelections}, `}
                      Max {option.maxSelections}
                    </span>
                  )}
                  {option.allowQuantity && (
                    <span className="ml-2">
                      Qty: {option.minQuantity}-{option.maxQuantity}
                    </span>
                  )}
                </div>
              </div>

              {option.description && (
                <p className="text-xs text-gray-600">{option.description}</p>
              )}

              <div className="space-y-1.5">
                {option.choices
                  .filter(choice => {
                    const choiceAdj = appliedOption.choiceAdjustments.find(
                      ca => ca.choiceId === choice.id
                    );
                    return choiceAdj && choiceAdj.isAvailable && choice.isAvailable;
                  })
                  .map(choice => {
                    const choiceAdjustment = appliedOption.choiceAdjustments.find(
                      ca => ca.choiceId === choice.id
                    );

                    const finalPrice = choice.basePrice + (choiceAdjustment!.priceAdjustment || 0);
                    const isSelected = isChoiceSelected(option.id, choice.id);
                    const quantity = getChoiceQuantity(option.id, choice.id);

                    return (
                      <div
                        key={choice.id}
                        className={`border rounded-lg transition-all ${
                          isSelected
                            ? 'border-brand-navy bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (option.multiSelect) {
                              handleMultiSelect(appliedOption, option, choice, choiceAdjustment);
                            } else {
                              handleSingleSelect(appliedOption, option, choice, choiceAdjustment);
                            }
                          }}
                          className="w-full p-3 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-${option.multiSelect ? 'sm' : 'full'} border-2 flex items-center justify-center flex-shrink-0 ${
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
                              <span className="font-medium text-gray-900 text-sm">
                                {choice.name}
                              </span>
                            </div>
                            {finalPrice > 0 && (
                              <span className="text-sm font-medium text-gray-700">
                                +{currencySymbol}{finalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>

                        {isSelected && option.allowQuantity && (
                          <div className="px-3 pb-3 pt-1 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Quantity:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(option, choice, quantity - 1);
                                  }}
                                  disabled={quantity <= option.minQuantity}
                                  className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || option.minQuantity;
                                    handleQuantityChange(option, choice, val);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  min={option.minQuantity}
                                  max={option.maxQuantity}
                                  className="w-12 h-7 text-center text-sm border border-gray-300 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuantityChange(option, choice, quantity + 1);
                                  }}
                                  disabled={quantity >= option.maxQuantity}
                                  className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {quantity > 1 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({currencySymbol}{(finalPrice * quantity).toFixed(2)})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {option.multiSelect && selectedForOption.length < option.minSelections && (
                <p className="text-xs text-orange-600">
                  Please select at least {option.minSelections} option{option.minSelections > 1 ? 's' : ''}
                </p>
              )}
            </div>
          );
        })}
    </div>
  );
}

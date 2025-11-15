'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Minus, Plus } from 'lucide-react';
import { calculateModifierPrice } from '@/lib/utils/modifierPricingCalculator';

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

interface PriceAdjustment {
  targetOptionId: string;
  targetChoiceId?: string;
  adjustmentType: 'multiplier' | 'addition' | 'fixed';
  value: number;
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
    adjustments: PriceAdjustment[];
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
  const [initializedForItemKey, setInitializedForItemKey] = useState<string | null>(null);

  // Initialize default selections ONCE when item changes
  useEffect(() => {
    if (!itemRules?.appliedOptions || itemRules.appliedOptions.length === 0) {
      return;
    }

    // Create unique key for current item configuration
    const currentItemKey = itemRules.appliedOptions.map(ao => ao.optionId).join('-');

    // Only initialize if this is a new item (different key than last initialized)
    if (initializedForItemKey !== currentItemKey) {
      // Check if we should initialize defaults
      const hasNoSelections = selectedOptions.length === 0;

      if (hasNoSelections) {
        const defaultSelections: SelectedChoice[] = [];

        itemRules.appliedOptions.forEach(appliedOption => {
          const option = options.find(opt => opt.id === appliedOption.optionId);
          if (!option) return;

          // Find default choices for this option
          const defaultChoices = appliedOption.choiceAdjustments.filter(
            ca => ca.isDefault && ca.isAvailable
          );

          defaultChoices.forEach(choiceAdj => {
            const choice = option.choices.find(c => c.id === choiceAdj.choiceId);
            if (choice && choice.isAvailable) {
              defaultSelections.push({
                optionId: option.id,
                optionName: option.name,
                choiceId: choice.id,
                choiceName: choice.name,
                quantity: option.allowQuantity ? Math.max(option.minQuantity, 1) : 1,
                priceAdjustment: choiceAdj.priceAdjustment,
              });
            }
          });
        });

        if (defaultSelections.length > 0) {
          onOptionsChange(defaultSelections);
        }
      }

      // Mark this item as initialized
      setInitializedForItemKey(currentItemKey);
    }
    // IMPORTANT: Do NOT include onOptionsChange in dependencies to avoid re-initialization loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemRules, options, initializedForItemKey]);

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

  /**
   * Calculate the dynamic price for a choice considering cross-option pricing rules
   * This shows what the price would be if this choice is selected with current selections
   */
  const calculateChoicePrice = (
    optionId: string,
    choiceId: string,
    choiceAdjustment: any
  ): number => {
    // If no adjustments array, just return the base priceAdjustment
    if (!choiceAdjustment.adjustments || choiceAdjustment.adjustments.length === 0) {
      return choiceAdjustment.priceAdjustment;
    }

    // Create a simulated selection set that includes this choice
    const simulatedSelections = selectedOptions
      .filter(sc => sc.optionId !== optionId) // Remove other selections from same option
      .map(sc => ({
        optionId: sc.optionId,
        choiceId: sc.choiceId,
        quantity: sc.quantity,
      }));

    // Add this choice to the simulation
    simulatedSelections.push({
      optionId,
      choiceId,
      quantity: 1,
    });

    // Calculate price using the calculator
    try {
      const result = calculateModifierPrice(
        { appliedOptions: itemRules.appliedOptions },
        simulatedSelections
      );

      // Find this choice in the breakdown
      const breakdown = result.choiceBreakdown.find(cb => cb.choiceId === choiceId);
      if (breakdown) {
        return breakdown.finalPrice;
      }
    } catch (error) {
      console.warn('Price calculation failed for choice:', choiceId, error);
    }

    // Fallback to base price
    return choiceAdjustment.priceAdjustment;
  };

  /**
   * Handle single-select option clicks
   *
   * Behavior:
   * - Clicking a DIFFERENT choice: Always switch to the new choice (even if required)
   * - Clicking the SAME choice (trying to deselect):
   *   - If required=true OR requiresSelection=true: Prevent deselection (must keep one selected)
   *   - If both are false (optional): Allow deselection
   *
   * Note: isDefault only affects initial selection, NOT whether user can change it
   */
  const handleSingleSelect = (
    appliedOption: AppliedOption,
    option: Option,
    choice: Choice,
    choiceAdjustment: any
  ) => {
    const isCurrentlySelected = isChoiceSelected(option.id, choice.id);
    const isRequired = appliedOption.required || option.requiresSelection;

    // If clicking the same choice that's already selected
    if (isCurrentlySelected) {
      // Only allow deselection if optional (not required)
      if (!isRequired) {
        // Remove all selections for this option (deselect)
        const filteredOptions = selectedOptions.filter(sc => sc.optionId !== option.id);
        onOptionsChange(filteredOptions);
      }
      // If required, do nothing (silently prevent deselection)
      return;
    }

    // Clicking a different choice - always switch to it
    const newSelection: SelectedChoice = {
      optionId: option.id,
      optionName: option.name,
      choiceId: choice.id,
      choiceName: choice.name,
      quantity: option.allowQuantity ? Math.max(option.minQuantity, 1) : 1,
      priceAdjustment: choiceAdjustment.priceAdjustment,
    };

    // Remove old selection and add new one
    const filteredOptions = selectedOptions.filter(sc => sc.optionId !== option.id);
    onOptionsChange([...filteredOptions, newSelection]);
  };

  /**
   * Handle multi-select option clicks
   *
   * Behavior:
   * - Can select up to maxSelections choices
   * - If trying to deselect:
   *   - Check if it would violate minSelections when required
   *   - If (required=true OR requiresSelection=true) AND count would drop below minSelections: Prevent
   *   - Otherwise: Allow deselection
   * - If trying to select:
   *   - Check if already at maxSelections limit
   *   - If at limit: Prevent selection
   *   - Otherwise: Add to selections
   */
  const handleMultiSelect = (
    appliedOption: AppliedOption,
    option: Option,
    choice: Choice,
    choiceAdjustment: any
  ) => {
    const isSelected = isChoiceSelected(option.id, choice.id);
    const selectedForOption = getSelectedChoicesForOption(option.id);

    if (isSelected) {
      // Trying to deselect - check if it would violate minimum requirement
      const isRequired = appliedOption.required || option.requiresSelection;
      const wouldViolateMinimum = isRequired && selectedForOption.length <= option.minSelections;

      if (wouldViolateMinimum) {
        // Silently prevent deselection (would go below required minimum)
        return;
      }

      // Allow deselection
      const newOptions = selectedOptions.filter(
        sc => !(sc.optionId === option.id && sc.choiceId === choice.id)
      );
      onOptionsChange(newOptions);
    } else {
      // Trying to select - check if at maximum limit
      if (selectedForOption.length >= option.maxSelections) {
        // Silently prevent selection (already at max)
        return;
      }

      // Allow selection
      const newSelection: SelectedChoice = {
        optionId: option.id,
        optionName: option.name,
        choiceId: choice.id,
        choiceName: choice.name,
        quantity: option.allowQuantity ? Math.max(option.minQuantity, 1) : 1,
        priceAdjustment: choiceAdjustment.priceAdjustment,
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    {option.name}
                    {!isOptional && <span className="text-red-600 ml-1">*</span>}
                  </p>
                  {isOptional && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {option.multiSelect && (
                    <span className={`font-medium ${
                      selectedForOption.length < option.minSelections && !isOptional
                        ? 'text-orange-600'
                        : selectedForOption.length >= option.minSelections
                          ? 'text-green-600'
                          : 'text-gray-600'
                    }`}>
                      {selectedForOption.length}/{option.maxSelections} selected
                    </span>
                  )}
                  {option.allowQuantity && (
                    <span className="ml-2 text-gray-500">
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

                    // Calculate dynamic price considering cross-option rules
                    const finalPrice = calculateChoicePrice(option.id, choice.id, choiceAdjustment);
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

              {/* Validation message for multi-select */}
              {option.multiSelect && (() => {
                const isRequired = appliedOption.required || option.requiresSelection;
                const currentCount = selectedForOption.length;
                const { minSelections, maxSelections } = option;

                // Only show message if required and below minimum
                if (isRequired && currentCount < minSelections) {
                  let message = '';
                  if (minSelections === maxSelections) {
                    message = `Select exactly ${minSelections} option${minSelections > 1 ? 's' : ''}`;
                  } else if (minSelections > 0) {
                    message = `Select ${minSelections} to ${maxSelections} option${maxSelections > 1 ? 's' : ''}`;
                  } else {
                    message = `Select up to ${maxSelections} option${maxSelections > 1 ? 's' : ''}`;
                  }
                  return <p className="text-xs text-orange-600">{message}</p>;
                }

                // Show helpful info for optional selections
                if (!isRequired && currentCount === 0 && minSelections === 0) {
                  return <p className="text-xs text-gray-500">Optional - select up to {maxSelections}</p>;
                }

                return null;
              })()}
            </div>
          );
        })}
    </div>
  );
}

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

interface SelectedChoice {
  optionId: string;
  choiceId: string;
  quantity?: number;
}

interface MenuRules {
  appliedOptions: AppliedOption[];
}

interface ChoicePriceBreakdown {
  choiceId: string;
  basePrice: number;
  finalPrice: number;
  adjustmentsApplied: {
    type: 'multiplier' | 'addition' | 'fixed';
    value: number;
    triggerOptionId: string;
    triggerChoiceId?: string;
  }[];
}

interface ModifierPricingResult {
  totalModifierPrice: number;
  choiceBreakdown: ChoicePriceBreakdown[];
  errors: string[];
}

export function calculateModifierPrice(
  menuRules: MenuRules,
  selectedChoices: SelectedChoice[]
): ModifierPricingResult {
  const result: ModifierPricingResult = {
    totalModifierPrice: 0,
    choiceBreakdown: [],
    errors: [],
  };

  const selectedChoicesMap = new Map<string, Map<string, number>>();
  selectedChoices.forEach((sc) => {
    if (!selectedChoicesMap.has(sc.optionId)) {
      selectedChoicesMap.set(sc.optionId, new Map());
    }
    selectedChoicesMap.get(sc.optionId)!.set(sc.choiceId, sc.quantity ?? 1);
  });

  selectedChoices.forEach((selectedChoice) => {
    const appliedOption = menuRules.appliedOptions.find(
      (ao) => ao.optionId === selectedChoice.optionId
    );

    if (!appliedOption) {
      result.errors.push(
        `Option ${selectedChoice.optionId} not found in menu rules`
      );
      return;
    }

    const choiceAdjustment = appliedOption.choiceAdjustments.find(
      (ca) => ca.choiceId === selectedChoice.choiceId
    );

    if (!choiceAdjustment) {
      result.errors.push(
        `Choice ${selectedChoice.choiceId} not found in option ${selectedChoice.optionId}`
      );
      return;
    }

    if (!choiceAdjustment.isAvailable) {
      result.errors.push(
        `Choice ${selectedChoice.choiceId} is not available`
      );
      return;
    }

    let finalPrice = choiceAdjustment.priceAdjustment;
    const adjustmentsApplied: ChoicePriceBreakdown['adjustmentsApplied'] = [];

    choiceAdjustment.adjustments.forEach((adjustment) => {
      const targetChoicesMap = selectedChoicesMap.get(adjustment.targetOptionId);

      if (!targetChoicesMap) {
        return;
      }

      if (adjustment.targetChoiceId) {
        if (!targetChoicesMap.has(adjustment.targetChoiceId)) {
          return;
        }
      }

      switch (adjustment.adjustmentType) {
        case 'multiplier':
          finalPrice = choiceAdjustment.priceAdjustment * adjustment.value;
          adjustmentsApplied.push({
            type: 'multiplier',
            value: adjustment.value,
            triggerOptionId: adjustment.targetOptionId,
            triggerChoiceId: adjustment.targetChoiceId,
          });
          break;

        case 'addition':
          finalPrice = choiceAdjustment.priceAdjustment + adjustment.value;
          adjustmentsApplied.push({
            type: 'addition',
            value: adjustment.value,
            triggerOptionId: adjustment.targetOptionId,
            triggerChoiceId: adjustment.targetChoiceId,
          });
          break;

        case 'fixed':
          finalPrice = adjustment.value;
          adjustmentsApplied.push({
            type: 'fixed',
            value: adjustment.value,
            triggerOptionId: adjustment.targetOptionId,
            triggerChoiceId: adjustment.targetChoiceId,
          });
          break;
      }
    });

    const quantity = selectedChoice.quantity ?? 1;
    const totalPriceForChoice = finalPrice * quantity;

    result.choiceBreakdown.push({
      choiceId: selectedChoice.choiceId,
      basePrice: choiceAdjustment.priceAdjustment,
      finalPrice: totalPriceForChoice,
      adjustmentsApplied,
    });

    result.totalModifierPrice += totalPriceForChoice;
  });

  return result;
}

export function validateMenuRules(menuRules: MenuRules): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!menuRules.appliedOptions || menuRules.appliedOptions.length === 0) {
    return { isValid: true, errors: [] };
  }

  const optionIds = new Set<string>();
  menuRules.appliedOptions.forEach((ao, index) => {
    if (optionIds.has(ao.optionId)) {
      errors.push(`Duplicate option ID: ${ao.optionId}`);
    }
    optionIds.add(ao.optionId);

    if (!ao.choiceAdjustments || ao.choiceAdjustments.length === 0) {
      errors.push(
        `Option at index ${index} has no choice adjustments`
      );
    }

    const choiceIds = new Set<string>();
    ao.choiceAdjustments.forEach((ca) => {
      if (choiceIds.has(ca.choiceId)) {
        errors.push(`Duplicate choice ID: ${ca.choiceId} in option ${ao.optionId}`);
      }
      choiceIds.add(ca.choiceId);

      ca.adjustments?.forEach((adj) => {
        if (!['multiplier', 'addition', 'fixed'].includes(adj.adjustmentType)) {
          errors.push(
            `Invalid adjustment type: ${adj.adjustmentType} for choice ${ca.choiceId}`
          );
        }

        if (!optionIds.has(adj.targetOptionId)) {
          errors.push(
            `Target option ${adj.targetOptionId} not found in applied options (referenced by choice ${ca.choiceId})`
          );
        }
      });
    });
  });

  return { isValid: errors.length === 0, errors };
}

export function getDefaultSelections(menuRules: MenuRules): SelectedChoice[] {
  const selections: SelectedChoice[] = [];

  menuRules.appliedOptions.forEach((appliedOption) => {
    const defaultChoices = appliedOption.choiceAdjustments.filter(
      (ca) => ca.isDefault && ca.isAvailable
    );

    defaultChoices.forEach((choice) => {
      selections.push({
        optionId: appliedOption.optionId,
        choiceId: choice.choiceId,
        quantity: 1,
      });
    });
  });

  return selections;
}

export function calculateItemTotalPrice(
  basePrice: number,
  menuRules: MenuRules | null,
  selectedChoices: SelectedChoice[],
  quantity: number = 1
): {
  basePrice: number;
  modifierPrice: number;
  itemTotal: number;
  total: number;
  breakdown: ModifierPricingResult;
} {
  if (!menuRules || selectedChoices.length === 0) {
    return {
      basePrice,
      modifierPrice: 0,
      itemTotal: basePrice,
      total: basePrice * quantity,
      breakdown: {
        totalModifierPrice: 0,
        choiceBreakdown: [],
        errors: [],
      },
    };
  }

  const modifierBreakdown = calculateModifierPrice(menuRules, selectedChoices);

  const itemTotal = basePrice + modifierBreakdown.totalModifierPrice;
  const total = itemTotal * quantity;

  return {
    basePrice,
    modifierPrice: modifierBreakdown.totalModifierPrice,
    itemTotal,
    total,
    breakdown: modifierBreakdown,
  };
}

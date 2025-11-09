'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useIsMobile } from '@/hooks/use-mobile';

interface Option {
  id: string;
  name: string;
  choices: {
    id: string;
    name: string;
    basePrice: number;
  }[];
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

interface PriceAdjustmentRuleEditorProps {
  choiceAdjustment: ChoiceAdjustment;
  choiceName: string;
  otherOptions: AppliedOption[];
  availableOptions: Option[];
  onUpdate: (adjustments: PriceAdjustment[]) => void;
}

export default function PriceAdjustmentRuleEditor({
  choiceAdjustment,
  choiceName,
  otherOptions,
  availableOptions,
  onUpdate,
}: PriceAdjustmentRuleEditorProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('menu.itemModifiers.ruleEditor');

  const handleAddRule = () => {
    const newRule: PriceAdjustment = {
      targetOptionId: otherOptions[0]?.optionId || '',
      targetChoiceId: undefined,
      adjustmentType: 'addition',
      value: 0,
    };
    onUpdate([...choiceAdjustment.adjustments, newRule]);
  };

  const handleRemoveRule = (index: number) => {
    const updated = choiceAdjustment.adjustments.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const handleUpdateRule = (index: number, updates: Partial<PriceAdjustment>) => {
    const updated = choiceAdjustment.adjustments.map((adj, i) =>
      i === index ? { ...adj, ...updates } : adj
    );
    onUpdate(updated);
  };

  const getOptionDetails = (optionId: string) => {
    return availableOptions.find(o => o.id === optionId);
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'multiplier':
        return t('adjustmentTypeLabels.multiplier');
      case 'addition':
        return t('adjustmentTypeLabels.addition');
      case 'fixed':
        return t('adjustmentTypeLabels.fixed');
      default:
        return type;
    }
  };

  const getAdjustmentDescription = (adjustment: PriceAdjustment) => {
    const option = getOptionDetails(adjustment.targetOptionId);
    if (!option) return '';

    const choice = adjustment.targetChoiceId
      ? option.choices.find(c => c.id === adjustment.targetChoiceId)
      : null;

    const choiceText = choice ? ` "${choice.name}"` : ` ${t('anyChoice')}`;
    const basePrice = choiceAdjustment.priceAdjustment;

    switch (adjustment.adjustmentType) {
      case 'multiplier':
        return `${t('whenSelected')} "${option.name}"${choiceText} ${t('isSelected')}: ${basePrice.toFixed(2)} × ${adjustment.value} = $${(basePrice * adjustment.value).toFixed(2)}`;
      case 'addition':
        return `${t('whenSelected')} "${option.name}"${choiceText} ${t('isSelected')}: ${basePrice.toFixed(2)} + ${adjustment.value} = $${(basePrice + adjustment.value).toFixed(2)}`;
      case 'fixed':
        return `${t('whenSelected')} "${option.name}"${choiceText} ${t('isSelected')}: Price = $${adjustment.value.toFixed(2)} ${t('replacesBase')}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-3">
        <Text variant="small" className="font-semibold text-gray-700 mb-1">
          {t('title')} "{choiceName}"
        </Text>
        <Text variant="small" className="text-gray-600">
          {t('description')}
        </Text>
      </div>

      {choiceAdjustment.adjustments.length === 0 && (
        <div className="text-center py-6 bg-white rounded border border-dashed">
          <Text variant="small" className="text-gray-500 mb-3">
            {t('noRules')}
          </Text>
        </div>
      )}

      {choiceAdjustment.adjustments.map((adjustment, index) => {
        const option = getOptionDetails(adjustment.targetOptionId);

        return (
          <div key={index} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <Text variant="small" className="font-medium text-gray-700">
                {t('rule')} #{index + 1}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRemoveRule(index)}
                className="text-red-600 hover:bg-red-50"
              >
                {t('remove')}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  {t('whenModifierSelected')}
                </label>
                <Select
                  value={adjustment.targetOptionId}
                  onChange={(e) => handleUpdateRule(index, {
                    targetOptionId: e.target.value,
                    targetChoiceId: undefined,
                  })}
                  className="w-full"
                >
                  {otherOptions.map((ao) => {
                    const opt = getOptionDetails(ao.optionId);
                    return opt ? (
                      <option key={ao.optionId} value={ao.optionId}>
                        {opt.name}
                      </option>
                    ) : null;
                  })}
                </Select>
              </div>

              {option && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    {t('specificChoice')}
                  </label>
                  <Select
                    value={adjustment.targetChoiceId || ''}
                    onChange={(e) => handleUpdateRule(index, {
                      targetChoiceId: e.target.value || undefined,
                    })}
                    className="w-full"
                  >
                    <option value="">{t('anyChoiceFrom')} {option.name}</option>
                    {option.choices.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    {t('adjustmentType')}
                  </label>
                  <Select
                    value={adjustment.adjustmentType}
                    onChange={(e) => handleUpdateRule(index, {
                      adjustmentType: e.target.value as PriceAdjustment['adjustmentType'],
                    })}
                    className="w-full"
                  >
                    <option value="addition">{t('adjustmentTypes.addition')}</option>
                    <option value="multiplier">{t('adjustmentTypes.multiplier')}</option>
                    <option value="fixed">{t('adjustmentTypes.fixed')}</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustment.value}
                    onChange={(e) => handleUpdateRule(index, {
                      value: parseFloat(e.target.value) || 0,
                    })}
                    placeholder={adjustment.adjustmentType === 'multiplier' ? '1.0' : '0.00'}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <Text variant="small" className="text-blue-900">
                  <strong>{t('example')}:</strong> {getAdjustmentDescription(adjustment)}
                </Text>
              </div>
            </div>
          </div>
        );
      })}

      {otherOptions.length > 0 && (
        <Button
          variant="secondary"
          onClick={handleAddRule}
          className="w-full"
        >
          + {t('addPriceRule')}
        </Button>
      )}

      {otherOptions.length === 0 && (
        <div className="text-center py-4">
          <Text variant="small" className="text-gray-500">
            {t('addMoreModifiers')}
          </Text>
        </div>
      )}
    </div>
  );
}

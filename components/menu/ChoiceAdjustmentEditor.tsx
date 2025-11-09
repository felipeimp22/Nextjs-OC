'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import Toggle from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useIsMobile } from '@/hooks/use-mobile';
import PriceAdjustmentRuleEditor from './PriceAdjustmentRuleEditor';

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

interface ChoiceAdjustmentEditorProps {
  optionDetails: Option;
  choiceAdjustments: ChoiceAdjustment[];
  appliedOptions: AppliedOption[];
  availableOptions: Option[];
  onUpdate: (adjustments: ChoiceAdjustment[]) => void;
}

export default function ChoiceAdjustmentEditor({
  optionDetails,
  choiceAdjustments,
  appliedOptions,
  availableOptions,
  onUpdate,
}: ChoiceAdjustmentEditorProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('menu.itemModifiers.choiceEditor');
  const [expandedChoiceId, setExpandedChoiceId] = useState<string | null>(null);

  const handleUpdatePrice = (choiceId: string, price: number) => {
    const updated = choiceAdjustments.map(ca =>
      ca.choiceId === choiceId ? { ...ca, priceAdjustment: price } : ca
    );
    onUpdate(updated);
  };

  const handleToggleAvailable = (choiceId: string) => {
    const updated = choiceAdjustments.map(ca =>
      ca.choiceId === choiceId ? { ...ca, isAvailable: !ca.isAvailable } : ca
    );
    onUpdate(updated);
  };

  const handleToggleDefault = (choiceId: string) => {
    const updated = choiceAdjustments.map(ca => ({
      ...ca,
      isDefault: ca.choiceId === choiceId ? !ca.isDefault : ca.isDefault,
    }));
    onUpdate(updated);
  };

  const handleUpdateAdjustments = (choiceId: string, adjustments: PriceAdjustment[]) => {
    const updated = choiceAdjustments.map(ca =>
      ca.choiceId === choiceId ? { ...ca, adjustments } : ca
    );
    onUpdate(updated);
  };

  const getChoiceDetails = (choiceId: string) => {
    return optionDetails.choices.find(c => c.id === choiceId);
  };

  const otherOptions = appliedOptions.filter(ao => ao.optionId !== optionDetails.id);

  return (
    <div className="space-y-3">
      <Text variant="small" className="font-semibold text-gray-700 mb-3">
        {t('title')}
      </Text>

      {choiceAdjustments.map((choiceAdjustment) => {
        const choiceDetails = getChoiceDetails(choiceAdjustment.choiceId);
        if (!choiceDetails) return null;

        const isExpanded = expandedChoiceId === choiceAdjustment.choiceId;

        return (
          <div
            key={choiceAdjustment.choiceId}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Text variant="small" className="font-medium">
                      {choiceDetails.name}
                    </Text>
                    {choiceAdjustment.isDefault && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {t('default')}
                      </span>
                    )}
                    {!choiceAdjustment.isAvailable && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {t('unavailable')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        {t('priceAdjustment')}
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={choiceAdjustment.priceAdjustment}
                        onChange={(e) => handleUpdatePrice(
                          choiceAdjustment.choiceId,
                          parseFloat(e.target.value) || 0
                        )}
                        placeholder="0.00"
                        className="w-full"
                      />
                      <Text variant="small" className="text-gray-500 mt-1">
                        {t('base')}: ${choiceDetails.basePrice.toFixed(2)}
                      </Text>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Toggle
                          checked={choiceAdjustment.isAvailable}
                          onChange={() => handleToggleAvailable(choiceAdjustment.choiceId)}
                          label={t('available')}
                        />
                      </div>
                      <div className="flex-1">
                        <Toggle
                          checked={choiceAdjustment.isDefault}
                          onChange={() => handleToggleDefault(choiceAdjustment.choiceId)}
                          label={t('default')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {otherOptions.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedChoiceId(isExpanded ? null : choiceAdjustment.choiceId)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{t('crossModifierRules')}</span>
                    {choiceAdjustment.adjustments.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {choiceAdjustment.adjustments.length}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="border-t bg-gray-50 p-3">
                <PriceAdjustmentRuleEditor
                  choiceAdjustment={choiceAdjustment}
                  choiceName={choiceDetails.name}
                  otherOptions={otherOptions}
                  availableOptions={availableOptions}
                  onUpdate={(adjustments) =>
                    handleUpdateAdjustments(choiceAdjustment.choiceId, adjustments)
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

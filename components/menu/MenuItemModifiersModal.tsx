'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { useIsMobile } from '@/hooks/use-mobile';
import { getOptions, getMenuRules, createOrUpdateMenuRules } from '@/lib/serverActions/menu.actions';
import { useToast } from '@/components/ui/ToastContainer';
import Tabs from '@/components/shared/Tabs';
import ModifierSelector from './ModifierSelector';
import ModifierConfiguration from './ModifierConfiguration';

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

interface MenuItemModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItemId: string;
  menuItemName: string;
  restaurantId: string;
}

export default function MenuItemModifiersModal({
  isOpen,
  onClose,
  menuItemId,
  menuItemName,
  restaurantId,
}: MenuItemModifiersModalProps) {
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableOptions, setAvailableOptions] = useState<Option[]>([]);
  const [appliedOptions, setAppliedOptions] = useState<AppliedOption[]>([]);
  const [activeTab, setActiveTab] = useState<string>('add');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, menuItemId, restaurantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [optionsResult, rulesResult] = await Promise.all([
        getOptions(restaurantId),
        getMenuRules(menuItemId),
      ]);

      if (optionsResult.success && optionsResult.data) {
        setAvailableOptions(optionsResult.data as any);
      }

      if (rulesResult.success && rulesResult.data) {
        setAppliedOptions(rulesResult.data.appliedOptions || []);
        if (rulesResult.data.appliedOptions && rulesResult.data.appliedOptions.length > 0) {
          setActiveTab('configure');
        }
      } else {
        setAppliedOptions([]);
        setActiveTab('add');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load modifiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (appliedOptions.length === 0) {
      showToast('error', 'Please select at least one modifier');
      return;
    }

    setSaving(true);
    try {
      const result = await createOrUpdateMenuRules({
        menuItemId,
        restaurantId,
        appliedOptions,
      });

      if (result.success) {
        showToast('success', 'Modifiers saved successfully');
        onClose();
      } else {
        showToast('error', result.error || 'Failed to save modifiers');
      }
    } catch (error) {
      console.error('Error saving modifiers:', error);
      showToast('error', 'Failed to save modifiers');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSelectedOptions = (selectedOptionIds: string[]) => {
    const newAppliedOptions: AppliedOption[] = selectedOptionIds.map((optionId, index) => {
      const existingOption = appliedOptions.find(ao => ao.optionId === optionId);
      if (existingOption) {
        return { ...existingOption, order: index };
      }

      const option = availableOptions.find(o => o.id === optionId);
      if (!option) {
        return null;
      }

      return {
        optionId,
        required: false,
        order: index,
        choiceAdjustments: option.choices.map((choice, choiceIndex) => ({
          choiceId: choice.id,
          priceAdjustment: choice.basePrice,
          isAvailable: true,
          isDefault: choiceIndex === 0,
          adjustments: [],
        })),
      };
    }).filter(Boolean) as AppliedOption[];

    setAppliedOptions(newAppliedOptions);
  };

  const handleUpdateAppliedOptions = (options: AppliedOption[]) => {
    setAppliedOptions(options);
  };

  const tabs = [
    { id: 'add', label: 'Add Modifiers' },
    { id: 'configure', label: 'Modifier Configuration' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Modifiers - ${menuItemName}`}
      size={isMobile ? 'full' : 'xl'}
    >
      <div className="flex flex-col h-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Text>Loading...</Text>
          </div>
        ) : (
          <>
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="px-6" />

            <div className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
              {activeTab === 'add' ? (
                <ModifierSelector
                  availableOptions={availableOptions}
                  selectedOptionIds={appliedOptions.map(ao => ao.optionId)}
                  onUpdate={handleUpdateSelectedOptions}
                />
              ) : (
                <ModifierConfiguration
                  availableOptions={availableOptions}
                  appliedOptions={appliedOptions}
                  onUpdate={handleUpdateAppliedOptions}
                />
              )}
            </div>

            <div className="border-t px-6 py-4 bg-gray-50">
              <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'flex-row justify-end'}`}>
                <Button variant="secondary" onClick={onClose} className="flex-1 md:flex-none">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || appliedOptions.length === 0}
                  className="flex-1 md:flex-none"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

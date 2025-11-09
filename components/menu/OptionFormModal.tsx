'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import  Select  from '@/components/ui/Select';
import  Toggle  from '@/components/ui/Toggle';
import FormField from '@/components/shared/FormField';
import { useToast } from '@/components/ui/ToastContainer';
import { createOption, updateOption } from '@/lib/serverActions/menu.actions';

interface Choice {
  id?: string;
  name: string;
  basePrice: number;
  useNewPrice: boolean;
  isDefault: boolean;
  isAvailable: boolean;
}

interface OptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
  categories: Array<{ id: string; name: string }>;
  option?: any | null;
}

export default function OptionFormModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
  categories,
  option,
}: OptionFormModalProps) {
  const t = useTranslations('menu.modifiers');
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    image: '',
    multiSelect: false,
    minSelections: 1,
    maxSelections: 1,
    allowQuantity: false,
    minQuantity: 0,
    maxQuantity: 1,
    isAvailable: true,
    isVisible: true,
  });
  const [choices, setChoices] = useState<Choice[]>([
    { name: '', basePrice: 0, useNewPrice: false, isDefault: false, isAvailable: true },
  ]);

  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        description: option.description || '',
        categoryId: option.category.id,
        image: option.image || '',
        multiSelect: option.multiSelect,
        minSelections: option.minSelections,
        maxSelections: option.maxSelections,
        allowQuantity: option.allowQuantity,
        minQuantity: option.minQuantity,
        maxQuantity: option.maxQuantity,
        isAvailable: option.isAvailable,
        isVisible: option.isVisible,
      });
      setChoices(option.choices.map((choice: any) => ({
        id: choice.id,
        name: choice.name,
        basePrice: choice.basePrice,
        useNewPrice: choice.useNewPrice,
        isDefault: choice.isDefault,
        isAvailable: choice.isAvailable ?? true,
      })));
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        image: '',
        multiSelect: false,
        minSelections: 1,
        maxSelections: 1,
        allowQuantity: false,
        minQuantity: 0,
        maxQuantity: 1,
        isAvailable: true,
        isVisible: true,
      });
      setChoices([
        { name: '', basePrice: 0, useNewPrice: false, isDefault: false, isAvailable: true },
      ]);
    }
  }, [option, isOpen, categories]);

  const handleAddChoice = () => {
    setChoices([
      ...choices,
      { name: '', basePrice: 0, useNewPrice: false, isDefault: false, isAvailable: true },
    ]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 1) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const handleChoiceChange = (index: number, field: keyof Choice, value: any) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (choices.length === 0 || !choices[0].name) {
      showToast('error', t('atLeastOneChoice'));
      return;
    }

    setSaving(true);

    try {
      const result = option
        ? await updateOption(option.id, {
            restaurantId,
            ...formData,
            choices,
          })
        : await createOption({
            restaurantId,
            ...formData,
            choices,
          });

      if (result.success) {
        showToast('success', option ? 'Modifier updated successfully' : 'Modifier created successfully');
        onSuccess();
      } else {
        showToast('error', result.error || 'Failed to save modifier');
      }
    } catch (error) {
      showToast('error', 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={option ? t('editModifier') : t('addModifier')}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('saving') : t('saveModifier')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('name')} required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('namePlaceholder')}
              required
            />
          </FormField>

          <FormField label={t('category')} required>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label={t('description')}>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('descriptionPlaceholder')}
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
          />
        </FormField>

        <FormField label={t('image')}>
          <Input
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </FormField>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{t('choices')}</h3>
            <Button type="button" variant="ghost" onClick={handleAddChoice} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addChoice')}
            </Button>
          </div>

          <div className="space-y-4">
            {choices.map((choice, index) => (
              <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-sm">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <FormField label={t('choiceName')} required>
                    <Input
                      value={choice.name}
                      onChange={(e) => handleChoiceChange(index, 'name', e.target.value)}
                      placeholder={t('choiceNamePlaceholder')}
                      required
                    />
                  </FormField>

                  <FormField label={t('basePrice')} required>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={choice.basePrice}
                      onChange={(e) => handleChoiceChange(index, 'basePrice', parseFloat(e.target.value) || 0)}
                      placeholder={t('basePricePlaceholder')}
                      required
                    />
                  </FormField>

                  <FormField label={t('useNewPrice')}>
                    <Toggle
                      id={`choice-use-new-price-${index}`}
                      checked={choice.useNewPrice}
                      onChange={(checked) => handleChoiceChange(index, 'useNewPrice', checked)}
                    />
                  </FormField>

                  <FormField label={t('isDefault')}>
                    <Toggle
                      id={`choice-is-default-${index}`}
                      checked={choice.isDefault}
                      onChange={(checked) => handleChoiceChange(index, 'isDefault', checked)}
                    />
                  </FormField>
                </div>

                {choices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('selectionSettings')}</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('multiSelect')}>
              <Toggle
                id="option-multi-select"
                checked={formData.multiSelect}
                onChange={(checked) => setFormData({ ...formData, multiSelect: checked })}
              />
            </FormField>

            {formData.multiSelect && (
              <>
                <FormField label={t('minSelections')}>
                  <Input
                    type="number"
                    min="1"
                    value={formData.minSelections}
                    onChange={(e) => setFormData({ ...formData, minSelections: parseInt(e.target.value) || 1 })}
                  />
                </FormField>

                <FormField label={t('maxSelections')}>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxSelections}
                    onChange={(e) => setFormData({ ...formData, maxSelections: parseInt(e.target.value) || 1 })}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('quantitySettings')}</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('allowQuantity')}>
              <Toggle
                id="option-allow-quantity"
                checked={formData.allowQuantity}
                onChange={(checked) => setFormData({ ...formData, allowQuantity: checked })}
              />
            </FormField>

            {formData.allowQuantity && (
              <>
                <FormField label={t('minQuantity')}>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                  />
                </FormField>

                <FormField label={t('maxQuantity')}>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
          <FormField label={t('isAvailable')}>
            <Toggle
              id="option-is-available"
              checked={formData.isAvailable}
              onChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            />
          </FormField>

          <FormField label={t('isVisible')}>
            <Toggle
              id="option-is-visible"
              checked={formData.isVisible}
              onChange={(checked) => setFormData({ ...formData, isVisible: checked })}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

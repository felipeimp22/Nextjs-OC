'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import FormField from '@/components/shared/FormField';
import { useToast } from '@/components/ui/ToastContainer';
import { createOptionCategory, updateOptionCategory } from '@/lib/serverActions/menu.actions';

interface OptionCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
  category?: {
    id: string;
    name: string;
    description: string | null;
    order: number;
  } | null;
}

export default function OptionCategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
  category,
}: OptionCategoryFormModalProps) {
  const t = useTranslations('menu.modifierCategories');
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        order: category.order,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        order: 0,
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = category
        ? await updateOptionCategory(category.id, {
            restaurantId,
            ...formData,
          })
        : await createOptionCategory({
            restaurantId,
            ...formData,
          });

      if (result.success) {
        showToast('success', category ? 'Category updated successfully' : 'Category created successfully');
        onSuccess();
      } else {
        showToast('error', result.error || 'Failed to save category');
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
      title={category ? t('editCategory') : t('addCategory')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('saving') : t('saveCategory')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t('name')} required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('namePlaceholder')}
            required
          />
        </FormField>

        <FormField label={t('description')}>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('descriptionPlaceholder')}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
          />
        </FormField>

        <FormField label={t('order')}>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </FormField>
      </form>
    </Modal>
  );
}

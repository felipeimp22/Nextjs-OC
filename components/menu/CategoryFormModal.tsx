'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import FormField from '@/components/shared/FormField';
import { useToast } from '@/components/ui/ToastContainer';
import { createMenuCategory, updateMenuCategory } from '@/lib/serverActions/menu.actions';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
  category?: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order: number;
    highlight: boolean;
  } | null;
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
  category,
}: CategoryFormModalProps) {
  const t = useTranslations('menu.categories');
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    order: 0,
    highlight: false,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        order: category.order,
        highlight: category.highlight,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        order: 0,
        highlight: false,
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = category
        ? await updateMenuCategory(category.id, {
            restaurantId,
            ...formData,
          })
        : await createMenuCategory({
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

        <FormField label={t('image')}>
          <Input
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
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

        <FormField label={t('highlight')}>
          <Toggle
            checked={formData.highlight}
            onChange={(checked) => setFormData({ ...formData, highlight: checked })}
          />
        </FormField>
      </form>
    </Modal>
  );
}

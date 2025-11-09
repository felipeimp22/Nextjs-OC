'use client';

import { useState } from 'react';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField } from '@/components/shared';
import { Plus, Trash2 } from 'lucide-react';

interface TaxSetting {
  name: string;
  enabled: boolean;
  rate: number;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

interface TaxManagementSectionProps {
  taxes: TaxSetting[];
  currencySymbol: string;
  onTaxesChange: (taxes: TaxSetting[]) => void;
}

export default function TaxManagementSection({
  taxes,
  currencySymbol,
  onTaxesChange,
}: TaxManagementSectionProps) {
  const { showToast } = useToast();
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [editingTaxIndex, setEditingTaxIndex] = useState<number | null>(null);

  const handleAddTax = () => {
    setEditingTax({
      name: '',
      enabled: true,
      rate: 0,
      type: 'percentage',
      applyTo: 'entire_order',
    });
    setEditingTaxIndex(null);
  };

  const handleEditTax = (index: number) => {
    setEditingTax(taxes[index]);
    setEditingTaxIndex(index);
  };

  const handleSaveTax = () => {
    if (!editingTax || !editingTax.name.trim()) {
      showToast('error', 'Tax name is required');
      return;
    }

    if (editingTaxIndex !== null) {
      const updatedTaxes = [...taxes];
      updatedTaxes[editingTaxIndex] = editingTax;
      onTaxesChange(updatedTaxes);
    } else {
      onTaxesChange([...taxes, editingTax]);
    }

    setEditingTax(null);
    setEditingTaxIndex(null);
  };

  const handleDeleteTax = (index: number) => {
    onTaxesChange(taxes.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setEditingTax(null);
    setEditingTaxIndex(null);
  };

  return (
    <FormSection
      title="Taxes"
      description="Configure applicable taxes for your orders"
      actions={
        <Button
          onClick={handleAddTax}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tax
        </Button>
      }
    >
      {taxes.length === 0 && !editingTax && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          No taxes configured. Click "Add Tax" to create one.
        </div>
      )}

      {taxes.length > 0 && (
        <div className="space-y-3">
          {taxes.map((tax, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900">{tax.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${tax.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {tax.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                  <span>
                    {tax.type === 'percentage' ? `${tax.rate}%` : `${currencySymbol}${tax.rate.toFixed(2)}`}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{tax.applyTo === 'entire_order' ? 'Entire Order' : 'Per Item'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  onClick={() => handleEditTax(index)}
                  variant="ghost"
                  className="text-brand-red hover:text-brand-red/80 text-sm"
                >
                  Edit
                </Button>
                <button
                  onClick={() => handleDeleteTax(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTax && (
        <div className="mt-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
          <h4 className="font-semibold text-blue-900">
            {editingTaxIndex !== null ? 'Edit Tax' : 'Add New Tax'}
          </h4>

          <FormField label="Tax Name" required>
            <Input
              value={editingTax.name}
              onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })}
              placeholder="e.g., Sales Tax, VAT, etc."
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Type">
              <select
                value={editingTax.type}
                onChange={(e) =>
                  setEditingTax({
                    ...editingTax,
                    type: e.target.value as 'percentage' | 'fixed',
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </FormField>

            <FormField label={editingTax.type === 'percentage' ? 'Rate (%)' : `Amount (${currencySymbol})`}>
              <Input
                type="number"
                step="0.01"
                value={editingTax.rate}
                onChange={(e) => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </FormField>
          </div>

          <FormField label="Apply To">
            <select
              value={editingTax.applyTo}
              onChange={(e) =>
                setEditingTax({
                  ...editingTax,
                  applyTo: e.target.value as 'entire_order' | 'per_item',
                })
              }
              className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
            >
              <option value="entire_order">Entire Order</option>
              <option value="per_item">Per Item</option>
            </select>
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tax-enabled"
              checked={editingTax.enabled}
              onChange={(e) => setEditingTax({ ...editingTax, enabled: e.target.checked })}
              className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
            />
            <label htmlFor="tax-enabled" className="text-sm font-medium text-gray-900">
              Enable this tax
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-blue-200">
            <Button onClick={handleSaveTax} className="bg-brand-red hover:bg-brand-red/90 text-white w-full md:w-auto">
              {editingTaxIndex !== null ? 'Update Tax' : 'Add Tax'}
            </Button>
            <Button onClick={handleCancelEdit} variant="ghost" className="w-full md:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </FormSection>
  );
}

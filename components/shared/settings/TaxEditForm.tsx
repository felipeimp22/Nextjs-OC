'use client';

import { Button, Input } from '@/components/ui';
import { FormField } from '@/components/shared';

interface TaxSetting {
  name: string;
  enabled: boolean;
  rate: number;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

interface TaxEditFormProps {
  tax: TaxSetting;
  isEditing: boolean;
  currencySymbol: string;
  onTaxChange: (tax: TaxSetting) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function TaxEditForm({
  tax,
  isEditing,
  currencySymbol,
  onTaxChange,
  onSave,
  onCancel,
}: TaxEditFormProps) {
  return (
    <div className="mt-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-4">
      <h4 className="font-semibold text-blue-900">
        {isEditing ? 'Edit Tax' : 'Add New Tax'}
      </h4>

      <FormField label="Tax Name" required>
        <Input
          value={tax.name}
          onChange={(e) => onTaxChange({ ...tax, name: e.target.value })}
          placeholder="e.g., Sales Tax, VAT, etc."
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Type">
          <select
            value={tax.type}
            onChange={(e) =>
              onTaxChange({
                ...tax,
                type: e.target.value as 'percentage' | 'fixed',
              })
            }
            className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </FormField>

        <FormField label={tax.type === 'percentage' ? 'Rate (%)' : `Amount (${currencySymbol})`}>
          <Input
            type="number"
            step="0.01"
            value={tax.rate}
            onChange={(e) => onTaxChange({ ...tax, rate: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </FormField>
      </div>

      <FormField label="Apply To">
        <select
          value={tax.applyTo}
          onChange={(e) =>
            onTaxChange({
              ...tax,
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
          checked={tax.enabled}
          onChange={(e) => onTaxChange({ ...tax, enabled: e.target.checked })}
          className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
        />
        <label htmlFor="tax-enabled" className="text-sm font-medium text-gray-900">
          Enable this tax
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-blue-200">
        <Button onClick={onSave} className="bg-brand-red hover:bg-brand-red/90 text-white">
          {isEditing ? 'Update Tax' : 'Add Tax'}
        </Button>
        <Button onClick={onCancel} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface TaxSetting {
  name: string;
  enabled: boolean;
  rate: number;
  type: 'percentage' | 'fixed';
  applyTo: 'entire_order' | 'per_item';
}

interface TaxListItemProps {
  tax: TaxSetting;
  index: number;
  currencySymbol: string;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export default function TaxListItem({ tax, index, currencySymbol, onEdit, onDelete }: TaxListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{tax.name}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${tax.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
            {tax.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
          <span>
            {tax.type === 'percentage' ? `${tax.rate}%` : `${currencySymbol}${tax.rate.toFixed(2)}`}
          </span>
          <span className="text-gray-400">•</span>
          <span>{tax.applyTo === 'entire_order' ? 'Entire Order' : 'Per Item'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onEdit(index)}
          variant="ghost"
          className="text-brand-red hover:text-brand-red/80"
        >
          Edit
        </Button>
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';
import CustomersTable from './CustomersTable';
import CustomersCard from './CustomersCard';
import CustomersFilters from './CustomersFilters';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui';
import { updateCustomer } from '@/lib/serverActions/customer.actions';
import { useToast } from '@/components/ui';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: any;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  tags: string[];
  notes: string | null;
  orderHistory: string[];
}

interface CustomersListProps {
  customers: Customer[];
  currencySymbol: string;
  onCustomerUpdated: () => void;
}

export default function CustomersList({ customers, currencySymbol, onCustomerUpdated }: CustomersListProps) {
  const t = useTranslations('customers');
  const isMobile = useIsMobile();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    tags: '',
    notes: '',
  });

  const ITEMS_PER_PAGE = 10;

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone?.number && customer.phone.number.includes(searchQuery));
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone?.number || '',
      tags: customer.tags.join(', '),
      notes: customer.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      tags: '',
      notes: '',
    });
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;

    setIsSaving(true);
    try {
      const tagsArray = editForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const result = await updateCustomer({
        customerId: editingCustomer.id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone ? { countryCode: '+1', number: editForm.phone } : null,
        tags: tagsArray,
        notes: editForm.notes,
      });

      if (result.success) {
        showToast(t('modal.updateSuccess'), 'success');
        handleCloseModal();
        onCustomerUpdated();
      } else {
        showToast(result.error || t('modal.updateFailed'), 'error');
      }
    } catch (error: any) {
      showToast(error.message || t('modal.updateFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full md:max-w-7xl md:mx-auto">
      <CustomersFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCustomers')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {searchQuery ? t('noCustomersAdjustFilters') : t('noCustomersYet')}
          </p>
        </div>
      ) : isMobile ? (
        <CustomersCard customers={paginatedCustomers} currencySymbol={currencySymbol} onEdit={handleEdit} />
      ) : (
        <CustomersTable customers={paginatedCustomers} currencySymbol={currencySymbol} onEdit={handleEdit} />
      )}

      {filteredCustomers.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={t('modal.editTitle')}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.customerName')}
            </label>
            <Input
              id="customerName"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder={t('modal.customerNamePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.customerEmail')}
            </label>
            <Input
              id="customerEmail"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder={t('modal.customerEmailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.customerPhone')}
            </label>
            <Input
              id="customerPhone"
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder={t('modal.customerPhonePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="customerTags" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.tags')}
            </label>
            <Input
              id="customerTags"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              placeholder={t('modal.tagsPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.notes')}
            </label>
            <textarea
              id="customerNotes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder={t('modal.notesPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCloseModal}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              {t('modal.cancel')}
            </Button>
            <Button
              onClick={handleSaveCustomer}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? t('modal.saving') : t('modal.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

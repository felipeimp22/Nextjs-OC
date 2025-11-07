'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { scrollToSection } from '@/lib/utils';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('common');

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    scrollToSection(sectionId);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="OrderChop Logo"
                className="h-10 mr-2"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavClick('features')}
              className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
            >
              {t('features')}
            </button>
            <button
              onClick={() => handleNavClick('results')}
              className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
            >
              {t('results')}
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
            >
              {t('contact')}
            </button>
            <Link href="/auth">
              <Button className="bg-brand-navy hover:bg-brand-darkNavy text-white">
                {t('signIn')}
              </Button>
            </Link>
            <Link href="/book-demo">
              <Button className="bg-brand-red hover:bg-brand-red/90">
                {t('bookDemo')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg rounded-b-lg animate-fade-in">
            <div className="flex flex-col px-4 py-6 space-y-4">
              <button
                onClick={() => handleNavClick('features')}
                className="text-gray-600 hover:text-brand-red transition-colors py-2 text-left"
              >
                {t('features')}
              </button>
              <button
                onClick={() => handleNavClick('results')}
                className="text-gray-600 hover:text-brand-red transition-colors py-2 text-left"
              >
                {t('results')}
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="text-gray-600 hover:text-brand-red transition-colors py-2 text-left"
              >
                {t('contact')}
              </button>
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-brand-navy hover:bg-brand-darkNavy text-white">
                  {t('signIn')}
                </Button>
              </Link>
              <Link href="/book-demo" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-brand-red hover:bg-brand-red/90 w-full">
                  {t('bookDemo')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
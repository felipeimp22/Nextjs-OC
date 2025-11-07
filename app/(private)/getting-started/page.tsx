'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import RestaurantForm from '@/components/restaurant/RestaurantForm';
import RestaurantSearch from '@/components/restaurant/RestaurantSearch';

type Mode = 'choose' | 'create' | 'search';

export default function GettingStartedPage() {
  const t = useTranslations('gettingStarted');
  const [mode, setMode] = useState<Mode>('choose');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/images/logo.png" alt="OrderChop Logo" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === 'choose' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {t('chooseOption')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <button
                  onClick={() => setMode('create')}
                  className="group bg-gradient-to-br from-brand-navy to-brand-navy/80 rounded-xl p-8 text-left hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('createRestaurant')}</h3>
                  <p className="text-white/80">{t('createDescription')}</p>
                </button>

                <button
                  onClick={() => setMode('search')}
                  className="group bg-gradient-to-br from-brand-red to-brand-red/80 rounded-xl p-8 text-left hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('searchRestaurant')}</h3>
                  <p className="text-white/80">{t('searchDescription')}</p>
                </button>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <button
                onClick={() => setMode('choose')}
                className="mb-6 text-brand-navy hover:text-brand-navy/80 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToOptions')}
              </button>
              <RestaurantForm />
            </div>
          )}

          {mode === 'search' && (
            <div>
              <button
                onClick={() => setMode('choose')}
                className="mb-6 text-brand-navy hover:text-brand-navy/80 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToOptions')}
              </button>
              <RestaurantSearch />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

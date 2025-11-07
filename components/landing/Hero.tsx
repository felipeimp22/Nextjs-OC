'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { ArrowRight, Flame, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-gray-900 via-brand-navy to-black text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-brand-red blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-brand-blue blur-[120px]"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          {/* Left side with text */}
          <div className="max-w-2xl lg:max-w-xl">
            <div className="flex items-center space-x-2 mb-6 bg-brand-red/20 text-brand-red px-4 py-2 rounded-full w-fit backdrop-blur-sm">
              <Flame size={18} className="text-brand-red" />
              <span className="text-sm font-semibold">{t('badge')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-8 leading-tight">
              <span className="text-white">{t('title')}</span>{' '}
              <span className="bg-gradient-to-r from-brand-red to-brand-blue bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-8 text-gray-300 leading-relaxed">
              {t('description')}
              <br /><br />
              {t('descriptionFull')}
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/book-demo">
                <Button size="lg" className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold px-6 py-6 h-auto rounded-xl">
                  {t('bookDemo')}
                </Button>
              </Link>
              <Link href="/get-started">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-6 h-auto rounded-xl"
                >
                  {t('getStarted')} <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex -space-x-3">
                <img 
                  className="w-10 h-10 rounded-full border-2 border-gray-900" 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Customer" 
                />
                <img 
                  className="w-10 h-10 rounded-full border-2 border-gray-900" 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Customer" 
                />
                <img 
                  className="w-10 h-10 rounded-full border-2 border-gray-900" 
                  src="https://randomuser.me/api/portraits/men/86.jpg" 
                  alt="Customer" 
                />
              </div>
              <div>
                <p className="text-white/80">
                  {t('socialProof')} <span className="font-bold text-brand-red">{t('socialProofCount')}</span> {t('socialProofText')}
                </p>
                <p className="text-white/60 text-sm">{t('socialProofSubtext')}</p>
              </div>
            </div>
          </div>

          {/* Right side with dashboard mockup */}
          <div className="relative w-full lg:w-1/2 animate-fade-in">
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-2xl shadow-2xl border border-gray-700">
              <img 
                alt="Restaurant kitchen" 
                className="w-full h-auto rounded-xl opacity-90" 
                src="/images/hero-kitchen.png" 
              />

              <div className="absolute -bottom-6 -right-6 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 backdrop-blur-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                    +
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-gray-400">{t('revenueIncrease')}</p>
                    <p className="text-xl font-bold text-green-400">{t('revenueValue')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-1/4 -left-8 p-4 bg-gray-800 rounded-xl shadow-xl border border-gray-700 hidden md:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-navy rounded-full flex items-center justify-center text-white">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-white font-medium">{t('allInOne')}</p>
                  <p className="text-xs text-gray-400">{t('allInOneSubtext')}</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 left-1/4 bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-700 hidden md:block">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/888/888857.png" 
                  alt="App icon" 
                  className="w-12 h-12" 
                />
                <div>
                  <p className="text-white font-medium">
                    {t('ownApp')} <span className="text-brand-red">{t('ownAppHighlight')}</span> {t('ownAppText')}
                  </p>
                  <p className="text-xs text-gray-400">{t('ownAppSubtext')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
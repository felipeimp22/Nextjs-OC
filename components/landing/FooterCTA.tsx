'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FooterCTA() {
  const t = useTranslations('footerCta');
  const isMobile = useIsMobile();

  return (
    <section id="contact" className="py-20 md:py-28 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-black rounded-3xl">
          {/* Background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-red blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-blue blur-[100px]"></div>
          </div>

          <div className="relative z-10 p-8 md:p-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="text-white max-w-2xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  {t('title')}{' '}
                  <span className="bg-gradient-to-r from-brand-red to-brand-blue bg-clip-text text-transparent">
                    {t('titleHighlight')}
                  </span>
                </h2>

                <p className="text-lg text-white/80 mb-8">
                  {t('subtitle')}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/book-demo">
                    <Button 
                      size="lg" 
                      className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold px-6 py-6 h-auto rounded-xl"
                    >
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
              </div>

              <div className="relative w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] mx-auto lg:mx-0">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                  {/* Laptop frame with dashboard image inside */}
                  <div className="relative w-full rounded-xl overflow-hidden bg-gray-900">
                    {/* Laptop bezel/frame */}
                    <div className="pt-[2%] px-[2%] bg-gray-800 rounded-t-lg">
                      {/* Dashboard image */}
                      <img
                        src="/images/dashboard-mockup.png"
                        alt="OrderChop Dashboard"
                        className="w-full h-auto rounded-t-sm object-cover"
                      />
                    </div>
                    {/* Laptop base */}
                    <div className="h-3 bg-gray-700 rounded-b-lg"></div>
                  </div>

                  <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-brand-red text-white text-xs font-bold uppercase px-1.5 md:px-2 py-1 rounded-full shadow-md">
                    {t('liveDemo')}
                  </div>
                </div>

                <div className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 bg-white p-2 md:p-3 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ChevronRight size={isMobile ? 12 : 16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('setupTime')}</p>
                      <p className="text-xs md:text-sm font-bold text-gray-900">
                        {t('setupValue')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
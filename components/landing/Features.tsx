'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DollarSign,
  Search,
  Smartphone,
  PhoneCall,
  Users,
  Send,
  Bot,
  TrendingUp,
  LineChart,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/ui';

const features = [
  {
    key: 'commissionFree',
    icon: DollarSign,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1564053489984-317bbd824340?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-red/30',
  },
  {
    key: 'seo',
    icon: Search,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-navy/30',
  },
  {
    key: 'app',
    icon: Smartphone,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-blue/30',
  },
  {
    key: 'aiPhone',
    icon: PhoneCall,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-red/30',
  },
  {
    key: 'crm',
    icon: Users,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-navy/30',
  },
  {
    key: 'marketing',
    icon: Send,
    bgImage: "bg-[url('https://images.unsplash.com/photo-1557200134-90327ee9fafa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center",
    hoverClass: 'hover:shadow-brand-blue/30',
  },
];

export default function Features() {
  const t = useTranslations('features');
  const isMobile = useIsMobile();

  return (
    <section id="features" className="py-20 md:py-28 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-brand-red font-semibold mb-2 inline-block">
            {t('sectionBadge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {t('title')} <span className="text-brand-red">{t('titleHighlight')}</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className={`transform transition-all duration-300 hover:-translate-y-2 ${feature.hoverClass}`}
              >
                <Card padding="none" className="h-full overflow-hidden rounded-2xl border-none shadow-lg">
                  <div
                    className={`${feature.bgImage} p-4 flex items-center justify-center relative before:absolute before:inset-0 before:bg-black/50`}
                  >
                    <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-full flex items-center justify-center relative z-10">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      {t(`${feature.key}.title`)}
                    </h3>
                    <p className="text-gray-600">{t(`${feature.key}.description`)}</p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Choppy Feature Highlight */}
        <div className="mt-20 bg-gradient-to-r from-brand-navy to-brand-red/90 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 md:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="flex items-center mb-4">
                  <Bot className="w-10 h-10 text-white mr-4" />
                  <h3 className="text-2xl md:text-3xl font-bold text-white">
                    {t('choppy.title')}
                  </h3>
                </div>

                <p className="text-white/90 text-lg mb-6">
                  {t('choppy.subtitle')}{' '}
                  <span className="font-bold text-white">{t('choppy.subtitleHighlight')}</span>{' '}
                  {t('choppy.subtitleEnd')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <TrendingUp className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">{t('choppy.analysis.title')}</h4>
                      <p className="text-white/80">{t('choppy.analysis.description')}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <DollarSign className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">{t('choppy.costCutting.title')}</h4>
                      <p className="text-white/80">{t('choppy.costCutting.description')}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <LineChart className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">{t('choppy.trends.title')}</h4>
                      <p className="text-white/80">{t('choppy.trends.description')}</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="mr-4 mt-1">
                      <ThumbsUp className="w-6 h-6 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-2">{t('choppy.automation.title')}</h4>
                      <p className="text-white/80">{t('choppy.automation.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-xl mb-6">
                  <p className="text-white italic">&ldquo;{t('choppy.quote')}&rdquo;</p>
                </div>

                <Button className="bg-white text-brand-navy hover:bg-gray-100 font-semibold px-6 py-2 md:px-8 md:py-3 text-base md:text-lg w-full sm:w-auto h-auto">
                  {isMobile ? t('common.getStarted') : t('choppy.cta')}
                </Button>
              </div>

              <div className="lg:col-span-4 flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-brand-blue via-brand-blue/70 to-brand-blue/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-xl shadow-brand-blue/30"></div>
                  <img
                    src="/images/choppy-character.png"
                    alt="Choppy Chef Character"
                    className="w-48 h-auto relative z-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { useTranslations } from 'next-intl';
import { Star, TrendingUp, Users, DollarSign } from 'lucide-react';

const testimonials = [
  {
    key: 'testimonial1',
    image: 'https://randomuser.me/api/portraits/women/65.jpg',
    stars: 5,
  },
  {
    key: 'testimonial2',
    image: 'https://randomuser.me/api/portraits/men/42.jpg',
    stars: 5,
  },
  {
    key: 'testimonial3',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    stars: 5,
  },
];

const stats = [
  {
    key: 'revenueIncrease',
    valueKey: 'revenueValue',
    icon: TrendingUp,
    color: 'text-brand-red',
  },
  {
    key: 'retention',
    valueKey: 'retentionValue',
    icon: Users,
    color: 'text-brand-blue',
  },
  {
    key: 'savings',
    valueKey: 'savingsValue',
    icon: DollarSign,
    color: 'text-green-500',
  },
];

export default function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section id="results" className="py-20 md:py-28 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-brand-red font-semibold mb-2 inline-block">
            {t('sectionBadge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.key}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 flex-grow mb-6 italic">
                &ldquo;{t(`${testimonial.key}.text`)}&rdquo;
              </p>

              <div className="flex items-center mt-auto">
                <img
                  src={testimonial.image}
                  alt={t(`${testimonial.key}.name`)}
                  className="w-14 h-14 rounded-full border-2 border-gray-100"
                />
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">
                    {t(`${testimonial.key}.name`)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t(`${testimonial.key}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-white rounded-2xl shadow-xl p-10 max-w-5xl mx-auto border border-gray-100">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">
            {t('statsTitle')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Icon className={stat.color} size={20} />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-1">
                    {t(stat.valueKey)}
                  </p>
                  <p className="text-gray-600">{t(stat.key)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 p-8 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-xl font-medium text-gray-900 mb-4 md:mb-0 md:mr-8">
                {t('ctaText')}
              </p>
              <button className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                {t('ctaButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
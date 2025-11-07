import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first (user preference)
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  // If no cookie, detect from Accept-Language header
  if (!locale) {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    
    // Check if Portuguese is preferred
    if (acceptLanguage?.includes('pt')) {
      locale = 'pt';
    } else {
      locale = 'en'; // Default to English
    }
  }

  // Ensure locale is valid
  const supportedLocales = ['en', 'pt'];
  if (!supportedLocales.includes(locale)) {
    locale = 'en';
  }
 
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
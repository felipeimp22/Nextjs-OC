// Currencies used in North, Central, and South America
export const AMERICAS_CURRENCIES = [
  // North America
  { code: 'USD', symbol: '$', name: 'US Dollar', countries: 'United States, Ecuador, El Salvador, Panama' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', countries: 'Canada' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', countries: 'Mexico' },

  // Central America & Caribbean
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', countries: 'Guatemala' },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', countries: 'Honduras' },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', countries: 'Nicaragua' },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', countries: 'Costa Rica' },
  { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', countries: 'Panama' },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', countries: 'Dominican Republic' },
  { code: 'CUP', symbol: '$', name: 'Cuban Peso', countries: 'Cuba' },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', countries: 'Haiti' },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', countries: 'Jamaica' },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar', countries: 'Trinidad and Tobago' },
  { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar', countries: 'Belize' },
  { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', countries: 'Barbados' },
  { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar', countries: 'Eastern Caribbean' },

  // South America
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', countries: 'Brazil' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', countries: 'Argentina' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', countries: 'Chile' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', countries: 'Colombia' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', countries: 'Peru' },
  { code: 'VES', symbol: 'Bs.', name: 'Venezuelan Bolívar', countries: 'Venezuela' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', countries: 'Uruguay' },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', countries: 'Paraguay' },
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano', countries: 'Bolivia' },
  { code: 'GYD', symbol: 'G$', name: 'Guyanese Dollar', countries: 'Guyana' },
  { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', countries: 'Suriname' },
] as const;

export type CurrencyCode = typeof AMERICAS_CURRENCIES[number]['code'];

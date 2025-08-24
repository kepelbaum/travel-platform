// Simple country flag mapping - just use destination.country
export const countryFlags: Record<string, string> = {
  // Europe
  France: '🇫🇷',
  Germany: '🇩🇪',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Switzerland: '🇨🇭',
  Austria: '🇦🇹',
  Portugal: '🇵🇹',
  Greece: '🇬🇷',
  Norway: '🇳🇴',
  Sweden: '🇸🇪',
  Denmark: '🇩🇰',
  Finland: '🇫🇮',
  Iceland: '🇮🇸',
  Poland: '🇵🇱',
  'Czech Republic': '🇨🇿',
  Hungary: '🇭🇺',
  Croatia: '🇭🇷',
  Russia: '🇷🇺',
  Turkey: '🇹🇷',

  // North America
  'United States': '🇺🇸',
  USA: '🇺🇸',
  US: '🇺🇸',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',

  // Asia Pacific
  Japan: '🇯🇵',
  China: '🇨🇳',
  'South Korea': '🇰🇷',
  Korea: '🇰🇷',
  India: '🇮🇳',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Singapore: '🇸🇬',
  Malaysia: '🇲🇾',
  Indonesia: '🇮🇩',
  Philippines: '🇵🇭',
  Australia: '🇦🇺',
  'New Zealand': '🇳🇿',
  Taiwan: '🇹🇼',
  'Hong Kong': '🇭🇰',

  // Middle East & Africa
  Egypt: '🇪🇬',
  Morocco: '🇲🇦',
  'South Africa': '🇿🇦',
  Israel: '🇮🇱',
  UAE: '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  Jordan: '🇯🇴',

  // South America
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Chile: '🇨🇱',
  Peru: '🇵🇪',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',

  // Central America & Caribbean
  'Costa Rica': '🇨🇷',
  Panama: '🇵🇦',
  Guatemala: '🇬🇹',
  Cuba: '🇨🇺',
  Jamaica: '🇯🇲',
  'Dominican Republic': '🇩🇴',
};

// Simple helper function
export const getCountryFlag = (country: string): string => {
  return countryFlags[country] || '🌍';
};

// Usage: getCountryFlag(destination.country)
export default getCountryFlag;

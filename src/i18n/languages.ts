export type LanguageType = 'en' | 'fil';

export const LANGUAGES: Record<LanguageType, { label: string; short: string }> =
  {
    en: { label: 'English', short: 'EN' },
    fil: { label: 'Filipino', short: 'FIL' },
  };

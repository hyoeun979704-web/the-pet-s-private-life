import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/config/Constants';
import { logger } from '@/utils/Logger';

type Dict = Record<string, unknown>;

class I18nSystem {
  private locale: SupportedLocale = DEFAULT_LOCALE;

  private dict: Dict = {};

  async init(preferred?: SupportedLocale): Promise<void> {
    const target = preferred ?? this.detectLocale();
    await this.load(target);
  }

  async load(locale: SupportedLocale): Promise<void> {
    try {
      const mod = await import(`@/data/locales/${locale}.json`);
      this.dict = (mod.default ?? mod) as Dict;
      this.locale = locale;
    } catch (err) {
      logger.error('i18n.loadFailed', err);
      if (locale !== DEFAULT_LOCALE) await this.load(DEFAULT_LOCALE);
    }
  }

  t(key: string, fallback?: string): string {
    const parts = key.split('.');
    let cursor: unknown = this.dict;
    for (const p of parts) {
      if (cursor && typeof cursor === 'object' && p in (cursor as Dict)) {
        cursor = (cursor as Dict)[p];
      } else {
        return fallback ?? key;
      }
    }
    return typeof cursor === 'string' ? cursor : (fallback ?? key);
  }

  current(): SupportedLocale {
    return this.locale;
  }

  private detectLocale(): SupportedLocale {
    if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
    const raw = navigator.language.toLowerCase().split('-')[0] as SupportedLocale;
    return SUPPORTED_LOCALES.includes(raw) ? raw : DEFAULT_LOCALE;
  }
}

export const i18n = new I18nSystem();

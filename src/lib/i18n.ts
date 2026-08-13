import { I18n } from 'i18n-js';

import english from '../../languages/english.json';
import arabic from '../../languages/arabic.json';

export const i18n = new I18n({
  en: english,
  ar: arabic.translations,
});

i18n.enableFallback = true;
i18n.locale = 'ar';

export function setAppLanguage(language: 'en' | 'ar') {
  i18n.locale = language;
}

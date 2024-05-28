import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';
import * as Localization from 'expo-localization';
import React from 'react';

// Import translation files
import en from './en.json';
import lv from './lv.json';

// Translation messages
const messages = {
  en,
  lv,
};

// Cache for the intl instance
const cache = createIntlCache();

// Determine the locale
const locales = Localization.getLocales();
const locale = locales && locales.length > 0 ? locales[0].languageTag : 'en';

// Create the intl instance
const intl = createIntl({ locale, messages: messages[locale] }, cache);

const LocalizationProvider = ({ children }) => (
  <RawIntlProvider value={intl}>{children}</RawIntlProvider>
);

export default LocalizationProvider;
export { intl };

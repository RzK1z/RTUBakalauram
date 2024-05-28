// LocalizationContext.js
import React, { createContext, useState, useContext } from 'react';
import { IntlProvider } from 'react-intl';
import en from './localization/en.json';
import lv from './localization/lv.json';

const LocalizationContext = createContext();

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(en);

  const switchLanguage = (language) => {
    setLocale(language);
    setMessages(language === 'en' ? en : lv);
  };

  return (
    <LocalizationContext.Provider value={{ locale, switchLanguage }}>
      <IntlProvider locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => useContext(LocalizationContext);

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LanguageCode, TranslationDictionary, translations } from "./translations";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  formatStatus: (status: string) => string;
  formatUrgency: (urgency: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
  formatStatus: (status) => status,
  formatUrgency: (urgency) => urgency,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yuva_rakt_lang") as LanguageCode;
      if (saved && ["en", "hi", "mr", "te"].includes(saved)) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("yuva_rakt_lang", lang);
        document.cookie = `yuva_rakt_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.error("[LanguageContext setLanguage Error]", e);
    }
  };

  const currentTranslations = translations[language] || translations.en;

  const formatStatus = (status: string): string => {
    if (!status) return "";
    return currentTranslations.statuses?.[status] || status;
  };

  const formatUrgency = (urgency: string): string => {
    if (!urgency) return "";
    return currentTranslations.urgencies?.[urgency] || urgency;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: currentTranslations,
        formatStatus,
        formatUrgency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

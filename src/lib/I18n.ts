import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'
import resources from '../locale'

const options = {
  fallbackLng: 'en',
  debug: true,
  resources,
  interpolation: {
    escapeValue: false,
  },
}

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (cb: any) => {
    const locales = RNLocalize.getLocales()
    cb(locales[0].languageCode)
  },
  init: () => {},
  cacheUserLanguage: () => {},
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init(options)

export default i18n

import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

// Import all translations
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import it from "../locales/it.json";
import pt from "../locales/pt.json";
import zh from "../locales/zh.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import ru from "../locales/ru.json";

// Initialize i18n
const i18n = new I18n({
  en,
  es,
  fr,
  de,
  it,
  pt,
  zh,
  ja,
  ko,
  ru,
});

// Set the locale once at the beginning of your app.
// Fallback to English if the system locale is not available in our translations
const systemLocales = getLocales();
if (systemLocales && systemLocales.length > 0) {
  // Use the languageCode from the first preferred locale (e.g., 'en', 'es', 'zh')
  i18n.locale = systemLocales[0].languageCode ?? "en";
  // i18n.locale = "en";
} else {
  i18n.locale = "en";
}

// Enable fallback to English if a translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;

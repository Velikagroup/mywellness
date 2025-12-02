import React, { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from './LanguageContext';
import { ChevronDown, Check, Globe, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LanguageSelector({ variant = 'default', showLabel = true }) {
  const { language, setLanguage, t } = useLanguage();
  const [showWarning, setShowWarning] = useState(false);
  const [previousLanguage, setPreviousLanguage] = useState(language);

  const handleLanguageChange = (newLang) => {
    if (newLang !== language) {
      setPreviousLanguage(language);
      setLanguage(newLang);
      setShowWarning(true);
    }
  };

  // Translation for the warning banner
  const warningTexts = {
    it: "Hai cambiato lingua! Per vedere i piani di nutrizione e allenamento nella nuova lingua, dovrai rigenerarli. Altrimenti rimarranno nella lingua originale.",
    en: "You changed language! To see your nutrition and workout plans in the new language, you'll need to regenerate them. Otherwise they'll remain in the original language.",
    es: "¡Cambiaste de idioma! Para ver tus planes de nutrición y entrenamiento en el nuevo idioma, deberás regenerarlos. De lo contrario, permanecerán en el idioma original.",
    pt: "Você mudou o idioma! Para ver seus planos de nutrição e treino no novo idioma, você precisará regenerá-los. Caso contrário, eles permanecerão no idioma original.",
    de: "Sie haben die Sprache geändert! Um Ihre Ernährungs- und Trainingspläne in der neuen Sprache zu sehen, müssen Sie sie neu generieren. Andernfalls bleiben sie in der ursprünglichen Sprache.",
    fr: "Vous avez changé de langue ! Pour voir vos plans de nutrition et d'entraînement dans la nouvelle langue, vous devrez les régénérer. Sinon, ils resteront dans la langue d'origine."
  };
  
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-2 gap-1"
          >
            <span className="text-lg">{currentLang.flag}</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-[#26847F]" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'settings') {
    return (
      <div className="space-y-3">
        {showLabel && (
          <label className="text-sm font-semibold text-gray-700">
            {t('settings.selectLanguage')}
          </label>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                language === lang.code
                  ? 'border-[#26847F] bg-[#e9f6f5]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className={`font-medium text-sm ${
                language === lang.code ? 'text-[#26847F]' : 'text-gray-700'
              }`}>
                {lang.name}
              </span>
              {language === lang.code && (
                <Check className="w-4 h-4 text-[#26847F] ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 h-10"
        >
          <Globe className="w-4 h-4" />
          <span className="text-lg">{currentLang.flag}</span>
          {showLabel && <span>{currentLang.name}</span>}
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-[#26847F]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
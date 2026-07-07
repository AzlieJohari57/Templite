import React from 'react';
import { Sparkles, CheckCircle, Clock, Award } from 'lucide-react';
import { translations, Language } from '../translations';

interface LandingBannerProps {
  language: Language;
}

const LandingBanner: React.FC<LandingBannerProps> = ({ language }) => {
  const t = translations[language].landingBanner;
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 dark:from-yellow-600 dark:via-amber-600 dark:to-orange-600 rounded-2xl mb-12 shadow-xl">
      <div className="absolute inset-0 bg-black bg-opacity-10 dark:bg-opacity-20"></div>
      <div className="relative px-4 py-8 sm:px-8 sm:py-12 text-center">
        <div className="flex justify-center mb-3 sm:mb-4">
          <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
          {t.title}
        </h1>
        <p className="text-base sm:text-xl text-white/90 dark:text-white/95 mb-6 sm:mb-8 max-w-2xl mx-auto">
          {t.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-white/90 dark:text-white/95">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
            <span className="font-medium text-sm sm:text-base">{t.professionalTemplates}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
            <span className="font-medium text-sm sm:text-base">{t.quickEasy}</span>
          </div>
          <div className="flex items-center">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
            <span className="font-medium text-sm sm:text-base">{t.atsFriendly}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingBanner;
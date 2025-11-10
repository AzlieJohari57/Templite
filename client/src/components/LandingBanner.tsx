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
      <div className="relative px-8 py-12 text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="w-12 h-12 text-white animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {t.title}
        </h1>
        <p className="text-xl text-white/90 dark:text-white/95 mb-8 max-w-2xl mx-auto">
          {t.description}
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 text-white/90 dark:text-white/95">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">{t.professionalTemplates}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">{t.quickEasy}</span>
          </div>
          <div className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            <span className="font-medium">{t.atsFriendly}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingBanner;
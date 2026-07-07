import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { translations, Language } from '../translations';
import logo from '../assets/logo.png';

interface HeaderProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedLanguage, 
  onLanguageChange, 
  isDarkMode, 
  onDarkModeToggle 
}) => {
  const t = translations[selectedLanguage].header;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center gap-2">
          {/* Logo/Title */}
          <img src={logo} alt="Templite" className="h-10 sm:h-12 w-auto shrink-0 invert dark:invert-0" />

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Language Toggle */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300 hidden sm:block shrink-0" />
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => onLanguageChange('English')}
                  className={`px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                    selectedLanguage === 'English'
                      ? 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  ENG
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('BM')}
                  className={`px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                    selectedLanguage === 'BM'
                      ? 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  BM
                </button>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onDarkModeToggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label={t.toggleDarkMode}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


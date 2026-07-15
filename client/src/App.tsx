import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LandingBanner from './components/LandingBanner';
import ResumeTemplateCarousel from './components/ResumeTemplateCarousel';
import ResumeForm from './components/ResumeForm';
import OrderVerification from './components/OrderVerification';
import { translations } from './translations';

function App() {
  const [isVerified, setIsVerified] = useState(() => sessionStorage.getItem('templite_verified') === 'true');

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const selectedTemplateRef = useRef<string | null>(null);

  const [resumeLanguage, setResumeLanguage] = useState<'English' | 'BM' | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((id: string) => {
    setPendingTemplateId(id);
    setShowLanguageModal(true);
  }, []);

  const handleResumeLanguageSelect = useCallback((lang: 'English' | 'BM') => {
    if (pendingTemplateId) {
      selectedTemplateRef.current = pendingTemplateId;
      setSelectedTemplate(pendingTemplateId);
    }
    setResumeLanguage(lang);
    setShowLanguageModal(false);
    setPendingTemplateId(null);
  }, [pendingTemplateId]);

  const [selectedPages, setSelectedPages] = useState<'1' | '2' | '3+'>('1');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'BM'>('English');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const handleVerify = useCallback((phone: string) => {
    sessionStorage.setItem('templite_verified', 'true');
    setIsVerified(true);
  }, []);

  const tc = translations[selectedLanguage].templateCarousel;

  if (!isVerified) {
    return (
      <OrderVerification
        onVerify={handleVerify}
        language={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <LandingBanner language={selectedLanguage} />
        <ResumeTemplateCarousel
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          language={selectedLanguage}
        />
        <ResumeForm
          selectedTemplate={selectedTemplate}
          selectedTemplateRef={selectedTemplateRef}
          selectedLanguage={selectedLanguage}
          resumeLanguage={resumeLanguage}
          selectedPages={selectedPages}
          onPagesChange={setSelectedPages}
        />
      </div>

      {/* Resume Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
              {tc.selectResumeLanguage}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              {tc.resumeLanguageSubtitle}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResumeLanguageSelect('English')}
                className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors shadow-md text-sm"
              >
                {tc.english}
              </button>
              <button
                onClick={() => handleResumeLanguageSelect('BM')}
                className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors shadow-md text-sm"
              >
                {tc.bahasaMalaysia}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

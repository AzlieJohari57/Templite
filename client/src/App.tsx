import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LandingBanner from './components/LandingBanner';
import ResumeTemplateCarousel from './components/ResumeTemplateCarousel';
import ResumeForm from './components/ResumeForm';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState('A');
  // Ref so ResumeForm never re-renders on template change — only reads value at submit time
  const selectedTemplateRef = useRef('A');
  const handleTemplateSelect = useCallback((id: string) => {
    selectedTemplateRef.current = id;
    setSelectedTemplate(id);
  }, []);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'BM'>('English');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header 
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />
      <div className="container mx-auto px-4 py-8">
        <LandingBanner language={selectedLanguage} />
        <ResumeTemplateCarousel
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          language={selectedLanguage}
        />

        <ResumeForm
          selectedTemplateRef={selectedTemplateRef}
          selectedLanguage={selectedLanguage}
        />
      </div>
    </div>
  );
}

export default App;
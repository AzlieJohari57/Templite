import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingBanner from './components/LandingBanner';
import ResumeTemplateCarousel from './components/ResumeTemplateCarousel';
import ResumeForm from './components/ResumeForm';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState('A');
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
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
          onTemplateSelect={setSelectedTemplate}
          language={selectedLanguage}
        />

        <ResumeForm 
          selectedTemplate={selectedTemplate}
          selectedLanguage={selectedLanguage}
        />
      </div>
    </div>
  );
}

export default App;
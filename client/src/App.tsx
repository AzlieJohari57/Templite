import React from 'react';
import LandingBanner from './components/LandingBanner';
import ResumeTemplateCarousel from './components/ResumeTemplateCarousel';
import ResumeForm from './components/ResumeForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <LandingBanner />
        <ResumeTemplateCarousel />
        <ResumeForm />
      </div>
    </div>
  );
}

export default App;
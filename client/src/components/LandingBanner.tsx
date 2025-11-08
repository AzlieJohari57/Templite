import React from 'react';
import { Sparkles, CheckCircle, Clock, Award } from 'lucide-react';

const LandingBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl mb-12 shadow-xl">
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      <div className="relative px-8 py-12 text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="w-12 h-12 text-white animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          TEMPLITE
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Create a professional resume that stands out. Choose from beautiful templates and let our smart form guide you through every step.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 text-white/90">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Professional Templates</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Quick & Easy</span>
          </div>
          <div className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            <span className="font-medium">ATS-Friendly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingBanner;
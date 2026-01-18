import React from 'react';
import { Check } from 'lucide-react';
import { translations, Language } from '../translations';

interface ResumeTemplateCarouselProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  language: Language;
}

const ResumeTemplateCarousel: React.FC<ResumeTemplateCarouselProps> = ({ selectedTemplate, onTemplateSelect, language }) => {
  const t = translations[language].templateCarousel;

  const templates = [
    {
      id: 'A',
      name: language === 'English' ? 'Template A - Classic' : 'Templat A - Klasik',
      description: language === 'English' ? 'Traditional professional layout' : 'Susun atur profesional tradisional',
      color: 'bg-blue-500'
    },
    {
      id: 'B',
      name: language === 'English' ? 'Template B - ATS Friendly' : 'Templat B - Mesra ATS',
      description: language === 'English' ? 'Optimized for applicant tracking' : 'Dioptimumkan untuk sistem penjejakan',
      color: 'bg-green-500'
    },
    {
      id: 'C',
      name: language === 'English' ? 'Template C - Executive' : 'Templat C - Eksekutif',
      description: language === 'English' ? 'Corporate executive style' : 'Gaya eksekutif korporat',
      color: 'bg-purple-500'
    },
    {
      id: 'D',
      name: language === 'English' ? 'Template D - Creative' : 'Templat D - Kreatif',
      description: language === 'English' ? 'Bold creative design' : 'Reka bentuk kreatif berani',
      color: 'bg-pink-500'
    },
    {
      id: 'E',
      name: language === 'English' ? 'Template E - Elegant' : 'Templat E - Elegan',
      description: language === 'English' ? 'Elegant minimalist style' : 'Gaya minimalis elegan',
      color: 'bg-indigo-500'
    },
    {
      id: 'F',
      name: language === 'English' ? 'Template F - Simple' : 'Templat F - Ringkas',
      description: language === 'English' ? 'Clean and simple layout' : 'Susun atur bersih dan ringkas',
      color: 'bg-teal-500'
    },
    {
      id: 'G',
      name: language === 'English' ? 'Template G - Compact' : 'Templat G - Padat',
      description: language === 'English' ? 'Space-efficient design' : 'Reka bentuk cekap ruang',
      color: 'bg-orange-500'
    },
    {
      id: 'H',
      name: language === 'English' ? 'Template H - Professional' : 'Templat H - Profesional',
      description: language === 'English' ? 'Clean professional design' : 'Reka bentuk profesional bersih',
      color: 'bg-cyan-500'
    },
    {
      id: 'I',
      name: language === 'English' ? 'Template I - Modern' : 'Templat I - Moden',
      description: language === 'English' ? 'Modern creative layout' : 'Susun atur kreatif moden',
      color: 'bg-rose-500'
    },
    {
      id: 'J',
      name: language === 'English' ? 'Template J - Technical' : 'Templat J - Teknikal',
      description: language === 'English' ? 'Great for tech professionals' : 'Sesuai untuk profesional teknologi',
      color: 'bg-slate-500'
    },
    {
      id: 'K',
      name: language === 'English' ? 'Template K - Minimal' : 'Templat K - Minimal',
      description: language === 'English' ? 'Ultra-minimal clean design' : 'Reka bentuk bersih ultra-minimal',
      color: 'bg-amber-500'
    },
    {
      id: 'L',
      name: language === 'English' ? 'Template L - Stylish' : 'Templat L - Bergaya',
      description: language === 'English' ? 'Stylish modern design' : 'Reka bentuk moden bergaya',
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.chooseTemplate}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t.selectDesign}</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplate;

            return (
              <div
                key={template.id}
                onClick={() => onTemplateSelect(template.id)}
                className={`relative cursor-pointer group transition-all duration-200 transform hover:scale-105 ${
                  isSelected
                    ? 'ring-4 ring-yellow-400 dark:ring-yellow-500 scale-105'
                    : 'hover:ring-2 hover:ring-yellow-300 dark:hover:ring-yellow-400'
                } rounded-xl overflow-hidden shadow-lg`}
              >
                <div className={`${template.color} w-full h-40 flex items-center justify-center`}>
                  <span className="text-white text-4xl font-bold opacity-80">{template.id}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{template.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{template.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-100 p-1.5 rounded-full shadow-md">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateCarousel;
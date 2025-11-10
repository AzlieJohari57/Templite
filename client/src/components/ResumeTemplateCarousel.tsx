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
      name: t.classicProfessional,
      preview: 'https://cdn-images.zety.com/pages/linkedin_on_resume_zety_us_2a.jpg',
      description: t.classicProfessionalDesc
    },
    {
      id: 'B',
      name: t.modernCreative,
      preview: 'https://i.pinimg.com/originals/ec/ea/0d/ecea0d573d40130b611e1347b2b78a73.jpg',
      description: t.modernCreativeDesc
    },
    {
      id: 'C',
      name: t.minimalist,
      preview: 'https://tse3.mm.bing.net/th/id/OIP.RI1MsVv-spttGIjnHMDDUgHaJ4?w=900&h=1200&rs=1&pid=ImgDetMain&o=7&rm=3',
      description: t.minimalistDesc
    }
  ];

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.chooseTemplate}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t.selectDesign}</p>
      </div>
      
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplate;
            
            return (
              <div
                key={template.id}
                className="transition-all duration-300"
              >
                <div
                  onClick={() => onTemplateSelect(template.id)}
                  className={`relative cursor-pointer group ${
                    isSelected 
                      ? 'ring-4 ring-yellow-400 dark:ring-yellow-500 ring-opacity-60' 
                      : 'hover:ring-2 hover:ring-yellow-300 dark:hover:ring-yellow-400 hover:ring-opacity-40'
                  } rounded-xl overflow-hidden transition-all duration-200`}
                >
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-48 h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                    <p className="text-sm text-white/90">{template.description}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-100 p-2 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateCarousel;
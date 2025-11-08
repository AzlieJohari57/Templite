import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  preview: string;
  description: string;
}

const templates: Template[] = [
  {
    id: 'A',
    name: 'Classic Professional',
    preview: 'https://cdn-images.zety.com/pages/linkedin_on_resume_zety_us_2a.jpg',
    description: 'Clean and traditional layout perfect for corporate roles'
  },
  {
    id: 'B',
    name: 'Modern Creative',
    preview: 'https://i.pinimg.com/originals/ec/ea/0d/ecea0d573d40130b611e1347b2b78a73.jpg',
    description: 'Contemporary design with creative elements'
  },
  {
    id: 'C',
    name: 'Minimalist',
    preview: 'https://tse3.mm.bing.net/th/id/OIP.RI1MsVv-spttGIjnHMDDUgHaJ4?w=900&h=1200&rs=1&pid=ImgDetMain&o=7&rm=3',
    description: 'Simple and elegant with focus on content'
  },
  {
    id: 'D',
    name: 'Executive',
    preview: 'https://images.pexels.com/photos/590018/pexels-photo-590018.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
    description: 'Premium design for senior positions'
  }
];

const ResumeTemplateCarousel: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('A');
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTemplate = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const prevTemplate = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
        <p className="text-gray-600">Select a design that matches your style and industry</p>
      </div>
      
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={prevTemplate}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-yellow-50 border border-yellow-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex space-x-4 overflow-hidden">
            {templates.map((template, index) => {
              const isVisible = index >= currentIndex && index < currentIndex + 3;
              const isSelected = template.id === selectedTemplate;
              
              return (
                <div
                  key={template.id}
                  className={`transition-all duration-300 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
                  }`}
                >
                  <div
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative cursor-pointer group ${
                      isSelected 
                        ? 'ring-4 ring-yellow-400 ring-opacity-60' 
                        : 'hover:ring-2 hover:ring-yellow-300 hover:ring-opacity-40'
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
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 p-2 rounded-full">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <button
            onClick={nextTemplate}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-yellow-50 border border-yellow-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex justify-center mt-6 space-x-2">
          {templates.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-yellow-400' : 'bg-gray-300 hover:bg-yellow-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplateCarousel;
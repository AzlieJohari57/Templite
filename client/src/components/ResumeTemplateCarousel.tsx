import React, { memo, useState, useCallback, useMemo } from 'react';
import { Check, ZoomIn, X } from 'lucide-react';
import { translations, Language } from '../translations';

import thumbA from '../resume_image/thumbs/Test_A_resume_page-0001.jpg';
import thumbB from '../resume_image/thumbs/Test_B_resume_page-0001.jpg';
import thumbC from '../resume_image/thumbs/Test_C_resume_page-0001.jpg';
import thumbD from '../resume_image/thumbs/Test_D_resume_page-0001.jpg';
import thumbE from '../resume_image/thumbs/Test_E_resume_page-0001.jpg';
import thumbF from '../resume_image/thumbs/Test_F_resume_page-0001.jpg';
import thumbG from '../resume_image/thumbs/Test_G_resume_page-0001.jpg';
import thumbH from '../resume_image/thumbs/Test_H_resume_page-0001.jpg';
import thumbI from '../resume_image/thumbs/Test_I_resume_page-0001.jpg';
import thumbJ from '../resume_image/thumbs/Test_J_resume_page-0001.jpg';
import thumbK from '../resume_image/thumbs/Test_K_resume_page-0001.jpg';
import thumbL from '../resume_image/thumbs/Test_L_resume_page-0001.jpg';
import thumbM from '../resume_image/thumbs/Test_M_resume_page-0001.jpg';

const imgA = thumbA, imgB = thumbB, imgC = thumbC, imgD = thumbD,
      imgE = thumbE, imgF = thumbF, imgG = thumbG, imgH = thumbH,
      imgI = thumbI, imgJ = thumbJ, imgK = thumbK, imgL = thumbL,
      imgM = thumbM;

const TEMPLATE_DATA = [
  { id: 'A', thumb: thumbA, full: imgA, en: 'Template A - Classic',      bm: 'Templat A - Klasik',      descEn: 'Traditional professional layout',  descBm: 'Susun atur profesional tradisional' },
  { id: 'B', thumb: thumbB, full: imgB, en: 'Template B - ATS Friendly', bm: 'Templat B - Mesra ATS',   descEn: 'Optimized for applicant tracking',  descBm: 'Dioptimumkan untuk sistem penjejakan' },
  { id: 'C', thumb: thumbC, full: imgC, en: 'Template C - Executive',    bm: 'Templat C - Eksekutif',   descEn: 'Corporate executive style',         descBm: 'Gaya eksekutif korporat' },
  { id: 'D', thumb: thumbD, full: imgD, en: 'Template D - Creative',     bm: 'Templat D - Kreatif',     descEn: 'Bold creative design',              descBm: 'Reka bentuk kreatif berani' },
  { id: 'E', thumb: thumbE, full: imgE, en: 'Template E - Elegant',      bm: 'Templat E - Elegan',      descEn: 'Elegant minimalist style',          descBm: 'Gaya minimalis elegan' },
  { id: 'F', thumb: thumbF, full: imgF, en: 'Template F - Simple',       bm: 'Templat F - Ringkas',     descEn: 'Clean and simple layout',           descBm: 'Susun atur bersih dan ringkas' },
  { id: 'G', thumb: thumbG, full: imgG, en: 'Template G - Compact',      bm: 'Templat G - Padat',       descEn: 'Space-efficient design',            descBm: 'Reka bentuk cekap ruang' },
  { id: 'H', thumb: thumbH, full: imgH, en: 'Template H - Professional', bm: 'Templat H - Profesional', descEn: 'Clean professional design',         descBm: 'Reka bentuk profesional bersih' },
  { id: 'I', thumb: thumbI, full: imgI, en: 'Template I - Modern',       bm: 'Templat I - Moden',       descEn: 'Modern creative layout',            descBm: 'Susun atur kreatif moden' },
  { id: 'J', thumb: thumbJ, full: imgJ, en: 'Template J - Technical',    bm: 'Templat J - Teknikal',    descEn: 'Great for tech professionals',      descBm: 'Sesuai untuk profesional teknologi' },
  { id: 'K', thumb: thumbK, full: imgK, en: 'Template K - Minimal',      bm: 'Templat K - Minimal',     descEn: 'Ultra-minimal clean design',        descBm: 'Reka bentuk bersih ultra-minimal' },
  { id: 'L', thumb: thumbL, full: imgL, en: 'Template L - Stylish',      bm: 'Templat L - Bergaya',     descEn: 'Stylish modern design',             descBm: 'Reka bentuk moden bergaya' },
  { id: 'M', thumb: thumbM, full: imgM, en: 'Template M - ATS Friendly', bm: 'Templat M - Mesra ATS',   descEn: 'ATS-optimized clean format',        descBm: 'Format bersih dioptimumkan ATS' },
];

interface ResumeTemplateCarouselProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  language: Language;
}

const ResumeTemplateCarousel: React.FC<ResumeTemplateCarouselProps> = ({
  selectedTemplate,
  onTemplateSelect,
  language,
}) => {
  const t = translations[language].templateCarousel;
  const [previewId, setPreviewId] = useState<string | null>(null);

  const templates = useMemo(() =>
    TEMPLATE_DATA.map(d => ({
      ...d,
      name: language === 'English' ? d.en : d.bm,
      description: language === 'English' ? d.descEn : d.descBm,
    })),
    [language]
  );

  const previewTemplate = useMemo(
    () => previewId ? TEMPLATE_DATA.find(d => d.id === previewId) ?? null : null,
    [previewId]
  );

  const openPreview = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPreviewId(id);
  }, []);

  const closePreview = useCallback(() => setPreviewId(null), []);

  const selectAndClose = useCallback((id: string) => {
    onTemplateSelect(id);
    setPreviewId(null);
  }, [onTemplateSelect]);

  return (
    <>
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
                  className={`relative cursor-pointer rounded-xl overflow-hidden shadow-md group
                    ${isSelected
                      ? 'outline outline-4 outline-yellow-400 dark:outline-yellow-500'
                      : 'outline outline-2 outline-transparent hover:outline-yellow-300'
                    }`}
                >
                  {/* Thumbnail — tiny WebP, fast to composite */}
                  <div className="w-full h-40 overflow-hidden bg-gray-100 relative">
                    <img
                      src={template.thumb}
                      alt={template.name}
                      width={300}
                      height={424}
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Zoom button — CSS opacity only (GPU-composited) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/25">
                      <button
                        onClick={(e) => openPreview(e, template.id)}
                        className="bg-white/95 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
                        title="Preview full size"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="bg-white dark:bg-gray-800 p-2">
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{template.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 p-1 rounded-full shadow pointer-events-none">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal — full-size JPG only loaded here */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                {language === 'English' ? previewTemplate.en : previewTemplate.bm}
              </span>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <img
                src={previewTemplate.full}
                alt={language === 'English' ? previewTemplate.en : previewTemplate.bm}
                className="w-full h-auto"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {language === 'English' ? 'Close' : 'Tutup'}
              </button>
              <button
                onClick={() => selectAndClose(previewTemplate.id)}
                className="px-5 py-2 text-sm font-semibold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg transition-colors"
              >
                {language === 'English' ? 'Use This Template' : 'Guna Templat Ini'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(ResumeTemplateCarousel);

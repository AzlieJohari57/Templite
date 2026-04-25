import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Plus, Send, User, Briefcase, GraduationCap, Award, Target, Users, Code, Heart, Star, Calendar, ChevronDown, ChevronUp, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { uploadImage, submitResume, getResumeStatus, JobStatus } from '../services/api';
import { translations, Language as AppLanguage } from '../translations';
import { generateJobProfile } from '../services/gemini';

interface Experience {
  company: string;
  title: string;
  location: string;
  duration: string;
  details: string;
}

interface LanguageProficiency {
  language: string;
  proficiency: string;
}

interface Skill {
  skill: string;
  percentage: number;
}

interface ExtracurricularActivity {
  title: string;
  date: string;
  details: string;
}

interface FormData {
  name: string;
  address: string;
  email: string;
  telephone: string;
  linkedin: string;
  title: string;
  about: string;
  image: File | null;
  languages: LanguageProficiency[];
  experiences: Experience[];
  education: {
    degree: string;
    institution: string;
    cgpa: string;
    duration: string;
  };
  strength: string;
  reference: {
    name: string;
    position: string;
    company: string;
    contact: string;
  };
  technicalSkills: Skill[];
  softSkills: Skill[];
  certifications: string[];
  achievements: string[];
  extracurricularActivities: ExtracurricularActivity[];
  location: string;
  language: string;
}

interface ResumeFormProps {
  selectedTemplateRef: React.RefObject<string>;
  selectedLanguage: AppLanguage;
}

// Static data outside component — never recreated on render
const TEMPLATE_NAMES: Record<string, { en: string; bm: string }> = {
  A: { en: 'Template A - Classic', bm: 'Templat A - Klasik' },
  B: { en: 'Template B - ATS Friendly', bm: 'Templat B - Mesra ATS' },
  C: { en: 'Template C - Executive', bm: 'Templat C - Eksekutif' },
  D: { en: 'Template D - Creative', bm: 'Templat D - Kreatif' },
  E: { en: 'Template E - Elegant', bm: 'Templat E - Elegan' },
  F: { en: 'Template F - Simple', bm: 'Templat F - Ringkas' },
  G: { en: 'Template G - Compact', bm: 'Templat G - Padat' },
  H: { en: 'Template H - Professional', bm: 'Templat H - Profesional' },
  I: { en: 'Template I - Modern', bm: 'Templat I - Moden' },
  J: { en: 'Template J - Technical', bm: 'Templat J - Teknikal' },
  K: { en: 'Template K - Minimal', bm: 'Templat K - Minimal' },
  L: { en: 'Template L - Stylish', bm: 'Templat L - Bergaya' },
  M: { en: 'Template M - ATS Friendly', bm: 'Templat M - Mesra ATS' },
};

const COMMON_TECHNICAL_SKILLS = [
  { skill: 'JavaScript', percentage: 85 },
  { skill: 'React', percentage: 80 },
  { skill: 'Python', percentage: 75 },
  { skill: 'Node.js', percentage: 70 },
];

const COMMON_SOFT_SKILLS = [
  { skill: 'Communication', percentage: 90 },
  { skill: 'Teamwork', percentage: 85 },
  { skill: 'Problem Solving', percentage: 80 },
  { skill: 'Leadership', percentage: 75 },
];

const INITIAL_FORM_DATA = {
  name: '', address: '', email: '', telephone: '', linkedin: '', title: '',
  about: '', image: null as File | null,
  languages: [{ language: '', proficiency: 'beginner' }],
  experiences: [{ company: '', title: '', location: '', duration: '', details: '' }],
  education: { degree: '', institution: '', cgpa: '', duration: '' },
  strength: '',
  reference: { name: '', position: '', company: '', contact: '' },
  technicalSkills: [{ skill: '', percentage: 50 }],
  softSkills: [{ skill: '', percentage: 50 }],
  certifications: [''],
  achievements: [''],
  extracurricularActivities: [{ title: '', date: '', details: '' }],
  location: '', language: 'English',
};

const INITIAL_OPTIONAL_FIELDS = {
  linkedin: false, languages: false, certifications: false,
  achievements: false, extracurricular: false, reference: false,
};

const ResumeForm: React.FC<ResumeFormProps> = ({ selectedTemplateRef, selectedLanguage }) => {
  const t = useMemo(() => translations[selectedLanguage].form, [selectedLanguage]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(INITIAL_OPTIONAL_FIELDS);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNestedInputChange = useCallback((section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section as keyof FormData] as any), [field]: value },
    }));
  }, []);

  const handleArrayInputChange = useCallback((section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as any[]).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const handleSimpleArrayChange = useCallback((section: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as string[]).map((item, i) =>
        i === index ? value : item
      ),
    }));
  }, []);

  const addArrayItem = useCallback((section: string, defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section as keyof FormData] as any[]), defaultItem],
    }));
  }, []);

  const removeArrayItem = useCallback((section: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as any[]).filter((_, i) => i !== index),
    }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  }, []);

  const formatSubmissionData = (imageUrl: string) => {
    // Format languages as array of objects: [{"English": "professional"}, ...]
    const formatLanguages = () => {
      return formData.languages
        .filter(lang => lang.language.trim())
        .map(lang => ({ [lang.language]: lang.proficiency }));
    };

    // Format experiences as array of objects
    const formatExperiences = () => {
      return formData.experiences
        .filter(exp => exp.company.trim() || exp.title.trim())
        .map(exp => ({
          company: exp.company,
          title: exp.title,
          location: exp.location,
          duration: exp.duration,
          details: exp.details.split('\n').filter(d => d.trim())
        }));
    };

    // Format skills as nested object: { "technical skills": { "AutoCAD": 30 }, "soft skills": { "Leadership": 20 } }
    const formatSkills = () => {
      const technicalSkills: Record<string, number> = {};
      const softSkills: Record<string, number> = {};

      formData.technicalSkills
        .filter(skill => skill.skill.trim())
        .forEach(skill => {
          technicalSkills[skill.skill] = skill.percentage;
        });

      formData.softSkills
        .filter(skill => skill.skill.trim())
        .forEach(skill => {
          softSkills[skill.skill] = skill.percentage;
        });

      return {
        "technical skills": technicalSkills,
        "soft skills": softSkills
      };
    };

    // Format certifications as array of objects
    const formatCertifications = () => {
      return formData.certifications
        .filter(cert => cert.trim())
        .map(cert => ({
          title: cert,
          issuer: "",
          date: ""
        }));
    };

    // Format education as array of objects
    const formatEducation = () => {
      if (!formData.education.degree && !formData.education.institution) {
        return [];
      }
      return [{
        level: formData.education.degree,
        institution: formData.education.institution,
        duration: formData.education.duration,
        grade: formData.education.cgpa
      }];
    };

    // Format reference as array of objects
    const formatReference = () => {
      if (!formData.reference.name) {
        return [];
      }
      return [{
        name: formData.reference.name,
        position: formData.reference.position,
        company: formData.reference.company,
        email: "",
        telephone: formData.reference.contact
      }];
    };

    // Format extracurricular activities as array of objects
    const formatExtracurricular = () => {
      return formData.extracurricularActivities
        .filter(activity => activity.title.trim())
        .map(activity => ({
          title: activity.title,
          date: activity.date,
          details: activity.details
        }));
    };

    // Format strength as array of strings
    const formatStrength = () => {
      return formData.strength
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);
    };

    // Format achievements as array of strings
    const formatAchievements = () => {
      return formData.achievements.filter(a => a.trim());
    };

    // Count number of valid job experiences
    const numberOfJobs = formData.experiences.filter(
      exp => exp.company.trim() || exp.title.trim()
    ).length;

    // Build the final submission object matching the expected JSON structure
    return {
      language: selectedLanguage,
      template: selectedTemplateRef.current,
      resume: {
        id: String(Math.floor(Math.random() * 10000)),
        name: formData.name,
        title: formData.title,
        image: imageUrl,
        adress: formData.address, // Note: keeping the original typo from the spec
        email: formData.email,
        telephone: formData.telephone,
        linkedin: formData.linkedin,
        about: formData.about,
        language: formatLanguages(),
        experience: formatExperiences(),
        "number of jobs": numberOfJobs,
        education: formatEducation(),
        strength: formatStrength(),
        reference: formatReference(),
        skills: formatSkills(),
        certification: formatCertifications(),
        achievement: formatAchievements(),
        "extracurricular activities": formatExtracurricular()
      }
    };
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setShowReview(true);
  }, []);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    setJobStatus(null);

    try {
      let imageUrl = '';
      if (formData.image) {
        const uploadResponse = await uploadImage(formData.image, formData.telephone);
        imageUrl = uploadResponse.image_url;
      }

      // POST returns instantly with a job_id — no long wait here.
      const { job_id } = await submitResume(formatSubmissionData(imageUrl));
      setJobStatus('pending');

      // Poll every 3 s until the job finishes.
      const poll = async () => {
        try {
          const status = await getResumeStatus(job_id);
          setJobStatus(status.status);

          if (status.status === 'done') {
            setSubmitDone(true);
            setIsSubmitting(false);
          } else if (status.status === 'failed') {
            setSubmitError(status.error || 'Resume generation failed. Please try again.');
            setIsSubmitting(false);
          } else {
            setTimeout(poll, 3000);
          }
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Lost connection. Please try again.');
          setIsSubmitting(false);
        }
      };

      setTimeout(poll, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Unknown error');
      setIsSubmitting(false);
    }
  };

  const toggleOptionalField = useCallback((field: keyof typeof showOptionalFields) => {
    setShowOptionalFields(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const autofillWithAI = async () => {
    if (!formData.title.trim()) {
      alert(t.enterJobTitle);
      return;
    }

    setIsGeneratingAI(true);
    try {
      const profile = await generateJobProfile(formData.title, selectedLanguage);
      
      setFormData(prev => ({
        ...prev,
        about: profile.aboutMe,
        technicalSkills: profile.technicalSkills,
        softSkills: profile.softSkills,
        strength: profile.strengths
      }));
    } catch (error) {
      console.error('AI generation error:', error);
      alert(t.aiError);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const autofillSkills = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      technicalSkills: COMMON_TECHNICAL_SKILLS,
      softSkills: COMMON_SOFT_SKILLS,
    }));
  }, []);

  const autofillAboutMe = useCallback(() => {
    setFormData(prev => ({ ...prev, about: t.aboutMePlaceholder }));
  }, [t]);

  const getSkillLevel = useCallback((percentage: number): string => {
    if (percentage <= 25) return t.skillLevelBeginner;
    if (percentage <= 50) return t.skillLevelIntermediate;
    if (percentage <= 75) return t.skillLevelAdvanced;
    return t.skillLevelExpert;
  }, [t]);

  const getSkillLevelColor = useCallback((percentage: number): string => {
    if (percentage <= 25) return 'text-blue-600 dark:text-blue-400';
    if (percentage <= 50) return 'text-green-600 dark:text-green-400';
    if (percentage <= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-purple-600 dark:text-purple-400';
  }, []);

  const resetForm = useCallback(() => {
    if (window.confirm(t.resetConfirm)) {
      setFormData(INITIAL_FORM_DATA);
      setShowOptionalFields(INITIAL_OPTIONAL_FIELDS);
    }
  }, [t]);

  const getTemplateName = useMemo(() => {
    const id = selectedTemplateRef.current;
    const template = TEMPLATE_NAMES[id] || { en: `Template ${id}`, bm: `Templat ${id}` };
    return selectedLanguage === 'English' ? template.en : template.bm;
  }, [selectedLanguage, selectedTemplateRef]);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-yellow-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Selected Template Display */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-4">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">{selectedTemplateRef.current}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLanguage === 'English' ? 'Selected Template' : 'Templat Dipilih'}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getTemplateName}</h3>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
              ✓ {selectedLanguage === 'English' ? 'Selected' : 'Dipilih'}
            </div>
          </div>
        </section>

        {/* Basic Information */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.basicInformation}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.fullName} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobTitleOptional}
                <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                  ✨ {selectedLanguage === 'English' ? 'AI-powered autofill available' : 'Isi automatik dengan AI tersedia'}
                </span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t.jobTitleExample}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.phoneNumber} *</label>
              <input
                type="tel"
                required
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.address} *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.locationOptional}</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t.locationExample}
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => toggleOptionalField('linkedin')}
                className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between mb-2"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.addLinkedIn}</span>
                {showOptionalFields.linkedin ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              {showOptionalFields.linkedin && (
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t.linkedInPlaceholder}
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profileImage}</label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg transition-colors flex items-center border border-yellow-200">
                  <Upload className="w-4 h-4 mr-2" />
                  {t.chooseFile}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {formData.image && (
                  <span className="text-sm text-gray-600">{formData.image.name}</span>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.aboutMe}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={autofillWithAI}
                    disabled={isGeneratingAI}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                        {t.generatingWithAI}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        {t.autoFillWithAI}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={autofillAboutMe}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {t.autoFillExample}
                  </button>
                </div>
              </div>
              <textarea
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t.aboutMePlaceholder}
              />
            </div>
          </div>
        </section>

        {/* Work Experience */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Briefcase className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.workExperience}</h2>
            </div>
            {formData.experiences.length < 3 && (
              <button
                type="button"
                onClick={() => addArrayItem('experiences', { company: '', title: '', location: '', duration: '', details: '' })}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.addExperience}
              </button>
            )}
          </div>
          
          {formData.experiences.length === 0 || (formData.experiences.length === 1 && !formData.experiences[0].company.trim()) ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p>{t.noExperience}</p>
            </div>
          ) : null}
          
          {formData.experiences.map((exp, index) => (
            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.experience} {index + 1}</h3>
                {formData.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('experiences', index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder={t.companyName}
                  value={exp.company}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'company', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.jobTitlePlaceholder}
                  value={exp.title}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.locationPlaceholder}
                  value={exp.location}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.durationPlaceholder}
                  value={exp.duration}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'duration', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <textarea
                placeholder={t.jobDetails}
                value={exp.details}
                onChange={(e) => handleArrayInputChange('experiences', index, 'details', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center mb-6">
            <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.education}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder={t.degreePlaceholder}
              value={formData.education.degree}
              onChange={(e) => handleNestedInputChange('education', 'degree', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder={t.institutionPlaceholder}
              value={formData.education.institution}
              onChange={(e) => handleNestedInputChange('education', 'institution', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder={t.educationDurationPlaceholder}
              value={formData.education.duration}
              onChange={(e) => handleNestedInputChange('education', 'duration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder={t.cgpaPlaceholder}
              value={formData.education.cgpa}
              onChange={(e) => handleNestedInputChange('education', 'cgpa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </section>

        {/* Strength */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.strengths}</h2>
          </div>
          
          <textarea
            value={formData.strength}
            onChange={(e) => handleInputChange('strength', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.strengthsPlaceholder}
          />
        </section>

        {/* Technical Skills */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Code className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.technicalSkills}</h2>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={autofillWithAI}
                disabled={isGeneratingAI}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    {t.autoFillWithAI}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={autofillSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
              >
                {t.autoFillExamples}
              </button>
              {formData.technicalSkills.length < 5 && (
                <button
                  type="button"
                  onClick={() => addArrayItem('technicalSkills', { skill: '', percentage: 50 })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addSkill}
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
          {formData.technicalSkills.map((skill, index) => (
            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-4 mb-2">
                <input
                  type="text"
                  placeholder={t.technicalSkillsPlaceholder}
                  value={skill.skill}
                  onChange={(e) => handleArrayInputChange('technicalSkills', index, 'skill', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {formData.technicalSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('technicalSkills', index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.percentage}
                  onChange={(e) => handleArrayInputChange('technicalSkills', index, 'percentage', parseInt(e.target.value))}
                  className="flex-1 accent-yellow-500 cursor-pointer"
                />
                <div className="flex items-center space-x-2 min-w-[140px]">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{skill.percentage}%</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getSkillLevelColor(skill.percentage)} bg-opacity-10`}>
                    {getSkillLevel(skill.percentage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </section>

        {/* Soft Skills */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.softSkills}</h2>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={autofillWithAI}
                disabled={isGeneratingAI}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAI ? (
                  <>
                    <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    {t.autoFillWithAI}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={autofillSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
              >
                {t.autoFillExamples}
              </button>
              {formData.softSkills.length < 5 && (
                <button
                  type="button"
                  onClick={() => addArrayItem('softSkills', { skill: '', percentage: 50 })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addSkill}
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
          {formData.softSkills.map((skill, index) => (
            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-4 mb-2">
                <input
                  type="text"
                  placeholder={t.softSkillsPlaceholder}
                  value={skill.skill}
                  onChange={(e) => handleArrayInputChange('softSkills', index, 'skill', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {formData.softSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('softSkills', index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.percentage}
                  onChange={(e) => handleArrayInputChange('softSkills', index, 'percentage', parseInt(e.target.value))}
                  className="flex-1 accent-yellow-500 cursor-pointer"
                />
                <div className="flex items-center space-x-2 min-w-[140px]">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{skill.percentage}%</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getSkillLevelColor(skill.percentage)} bg-opacity-10`}>
                    {getSkillLevel(skill.percentage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </section>

        {/* Language Proficiency */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleOptionalField('languages')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.languageProficiency}</h2>
              </div>
              {showOptionalFields.languages ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {showOptionalFields.languages && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => addArrayItem('languages', { language: '', proficiency: 'beginner' })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addLanguage}
                </button>
              </div>
              
              {formData.languages.map((lang, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <input
                    type="text"
                    placeholder={t.languagePlaceholder}
                    value={lang.language}
                    onChange={(e) => handleArrayInputChange('languages', index, 'language', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <select
                    value={lang.proficiency}
                    onChange={(e) => handleArrayInputChange('languages', index, 'proficiency', e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="beginner">{t.beginner}</option>
                    <option value="intermediate">{t.intermediate}</option>
                    <option value="professional">{t.professional}</option>
                    <option value="native">{t.native}</option>
                  </select>
                  {formData.languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('languages', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {t.delete}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Certifications */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleOptionalField('certifications')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.certifications}</h2>
              </div>
              {showOptionalFields.certifications ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {showOptionalFields.certifications && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => addArrayItem('certifications', '')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addCertification}
                </button>
              </div>
              
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <input
                    type="text"
                    placeholder={t.certificationPlaceholder}
                    value={cert}
                    onChange={(e) => handleSimpleArrayChange('certifications', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('certifications', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {t.delete}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Achievements */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleOptionalField('achievements')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.achievements}</h2>
              </div>
              {showOptionalFields.achievements ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {showOptionalFields.achievements && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => addArrayItem('achievements', '')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addAchievement}
                </button>
              </div>
              
              {formData.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <input
                    type="text"
                    placeholder={t.achievementPlaceholder}
                    value={achievement}
                    onChange={(e) => handleSimpleArrayChange('achievements', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.achievements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('achievements', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {t.delete}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Extracurricular Activities */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleOptionalField('extracurricular')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.extracurricularActivities}</h2>
              </div>
              {showOptionalFields.extracurricular ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {showOptionalFields.extracurricular && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => addArrayItem('extracurricularActivities', { title: '', date: '', details: '' })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addActivity}
                </button>
              </div>
              
              {formData.extracurricularActivities.map((activity, index) => (
                <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.activity} {index + 1}</h3>
                    {formData.extracurricularActivities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('extracurricularActivities', index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        {t.delete}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder={t.activityTitlePlaceholder}
                      value={activity.title}
                      onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder={t.activityDatePlaceholder}
                      value={activity.date}
                      onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <textarea
                    placeholder={t.activityDetails}
                    value={activity.details}
                    onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'details', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </>
          )}
        </section>

        {/* Reference */}
        <section className="border-b border-gray-200 dark:border-gray-700 pb-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => toggleOptionalField('reference')}
              className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.reference}</h2>
              </div>
              {showOptionalFields.reference ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {showOptionalFields.reference && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {t.referenceExample}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder={t.referenceNamePlaceholder}
                  value={formData.reference.name}
                  onChange={(e) => handleNestedInputChange('reference', 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.referencePositionPlaceholder}
                  value={formData.reference.position}
                  onChange={(e) => handleNestedInputChange('reference', 'position', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.referenceCompanyPlaceholder}
                  value={formData.reference.company}
                  onChange={(e) => handleNestedInputChange('reference', 'company', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={t.referenceContactPlaceholder}
                  value={formData.reference.contact}
                  onChange={(e) => handleNestedInputChange('reference', 'contact', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
        </section>

        {/* Submit and Reset Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 flex items-center transform hover:scale-105 shadow-lg"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            {t.resetForm}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 flex items-center transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-3" />
                {t.submitResume}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Review Popup */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">

              {/* Processing overlay */}
              {isSubmitting && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {jobStatus === 'pending'
                        ? (selectedLanguage === 'English' ? 'Waiting in queue…' : 'Menunggu giliran…')
                        : (selectedLanguage === 'English' ? 'Building your resume…' : 'Sedang menyediakan resume anda…')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {jobStatus === 'pending'
                        ? (selectedLanguage === 'English'
                            ? 'Server is busy. You will be processed shortly.'
                            : 'Pelayan sedang sibuk. Anda akan diproses sebentar lagi.')
                        : (selectedLanguage === 'English'
                            ? 'AI is enhancing your content and generating the PDF. This takes 1–2 minutes.'
                            : 'AI sedang memperhalusi kandungan dan menjana PDF. Ini mengambil masa 1–2 minit.')}
                    </p>
                  </div>
                  <div className="w-full max-w-sm bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-yellow-400 rounded-full animate-progress-indeterminate"></div>
                  </div>
                  {jobStatus === 'processing' && (
                    <div className="flex flex-col items-center space-y-1 text-xs text-gray-400 dark:text-gray-500">
                      <span>{selectedLanguage === 'English' ? '✦ Enhancing experience & skills' : '✦ Memperhalusi pengalaman & kemahiran'}</span>
                      <span>{selectedLanguage === 'English' ? '✦ Generating PDF layout' : '✦ Menjana susun atur PDF'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Success screen */}
              {submitDone && !isSubmitting && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedLanguage === 'English' ? "We've Received Your Resume!" : 'Resume Anda Telah Diterima!'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md">
                      {selectedLanguage === 'English'
                        ? "Thank you for submitting your details. Your resume is being finalized and will be ready shortly. We'll get back to you as soon as it's complete!"
                        : 'Terima kasih kerana menghantar maklumat anda. Resume anda sedang disiapkan dan akan sedia tidak lama lagi. Kami akan menghubungi anda sebaik sahaja ia selesai!'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowReview(false); setSubmitDone(false); }}
                    className="mt-4 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {selectedLanguage === 'English' ? 'Submit Another Resume' : 'Hantar Resume Lain'}
                  </button>
                </div>
              )}

              {/* Error message */}
              {submitError && !isSubmitting && !submitDone && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {selectedLanguage === 'English' ? `Something went wrong: ${submitError}` : `Ralat berlaku: ${submitError}`}
                </div>
              )}

              {/* Normal review content — hidden while processing or done */}
              {!isSubmitting && !submitDone && (
              <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.reviewTitle}</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.basicInformation}</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
                    <div><strong>{t.name}:</strong> {formData.name || t.notProvided}</div>
                    <div><strong>{t.jobTitleReview}:</strong> {formData.title || t.notProvided}</div>
                    <div><strong>{t.email}:</strong> {formData.email || t.notProvided}</div>
                    <div><strong>{t.phone}:</strong> {formData.telephone || t.notProvided}</div>
                    <div><strong>{t.address}:</strong> {formData.address || t.notProvided}</div>
                    <div><strong>{t.location}:</strong> {formData.location || t.notProvided}</div>
                    {formData.linkedin && <div><strong>LinkedIn:</strong> {formData.linkedin}</div>}
                  </div>
                </div>

                {/* About Me */}
                {formData.about && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.aboutMeReview}</h3>
                    <p className="text-sm dark:text-gray-300">{formData.about}</p>
                  </div>
                )}

                {/* Education */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.educationReview}</h3>
                  <div className="text-sm space-y-1 dark:text-gray-300">
                    <div><strong>{t.degreeReview}:</strong> {formData.education.degree || t.notProvided}</div>
                    <div><strong>{t.institutionReview}:</strong> {formData.education.institution || t.notProvided}</div>
                    <div><strong>{t.durationReview}:</strong> {formData.education.duration || t.notProvided}</div>
                    <div><strong>{t.cgpa}:</strong> {formData.education.cgpa || t.notProvided}</div>
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.workExperienceReview}</h3>
                  {formData.experiences.filter(exp => exp.company.trim()).length > 0 ? (
                    formData.experiences.filter(exp => exp.company.trim()).map((exp, index) => (
                      <div key={index} className="mb-3 text-sm dark:text-gray-300">
                        <div><strong>{exp.title}</strong> {selectedLanguage === 'English' ? 'at' : 'di'} {exp.company}</div>
                        <div>{exp.location} • {exp.duration}</div>
                        <div>{exp.details}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.noWorkExperience}</p>
                  )}
                </div>

                {/* Skills */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.skillsReview}</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
                    <div>
                      <strong>{t.technicalSkillsReview}:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {formData.technicalSkills.filter(s => s.skill.trim()).map((skill, index) => (
                          <li key={index}>{skill.skill} ({skill.percentage}%)</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>{t.softSkillsReview}:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {formData.softSkills.filter(s => s.skill.trim()).map((skill, index) => (
                          <li key={index}>{skill.skill} ({skill.percentage}%)</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Other sections if they have content */}
                {formData.languages.filter(l => l.language.trim()).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.languagesReview}</h3>
                    <div className="text-sm dark:text-gray-300">
                      {formData.languages.filter(l => l.language.trim()).map((lang, index) => (
                        <div key={index}>{lang.language} ({lang.proficiency})</div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.certifications.filter(c => c.trim()).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.certificationsReview}</h3>
                    <ul className="list-disc list-inside text-sm dark:text-gray-300">
                      {formData.certifications.filter(c => c.trim()).map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.achievements.filter(a => a.trim()).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.achievementsReview}</h3>
                    <ul className="list-disc list-inside text-sm dark:text-gray-300">
                      {formData.achievements.filter(a => a.trim()).map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.extracurricularActivities.filter(a => a.title.trim()).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.extracurricularActivitiesReview}</h3>
                    <div className="text-sm space-y-2 dark:text-gray-300">
                      {formData.extracurricularActivities.filter(a => a.title.trim()).map((activity, index) => (
                        <div key={index}>
                          <div><strong>{activity.title}</strong> ({activity.date})</div>
                          <div>{activity.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference */}
                {(formData.reference.name || formData.reference.position) && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.referenceReview}</h3>
                    <div className="text-sm space-y-1 dark:text-gray-300">
                      <div><strong>{t.name}:</strong> {formData.reference.name}</div>
                      <div><strong>{t.positionReview}:</strong> {formData.reference.position}</div>
                      <div><strong>{t.companyReview}:</strong> {formData.reference.company}</div>
                      <div><strong>{t.contactReview}:</strong> {formData.reference.contact}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
                >
                  {t.backToEdit}
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t.submitResume}
                </button>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Loading Modal */}
      {isGeneratingAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-pulse">
            <div className="flex flex-col items-center space-y-6">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-200 dark:border-yellow-900 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-yellow-500 dark:border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Loader2 className="w-10 h-10 text-yellow-500 dark:text-yellow-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              
              {/* Loading Text */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {t.generatingWithAI}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedLanguage === 'English' 
                    ? 'Creating personalized content for your resume...' 
                    : 'Membuat kandungan diperibadikan untuk resume anda...'}
                </p>
              </div>
              
              {/* Animated Dots */}
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;
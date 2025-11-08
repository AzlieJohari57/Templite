import React, { useState } from 'react';
import { Upload, Plus, Minus, Send, User, Briefcase, GraduationCap, Award, Target, Users, Code, Heart, Star, Calendar } from 'lucide-react';
import { uploadImage, submitResume } from '../services/api';

interface Experience {
  company: string;
  title: string;
  location: string;
  duration: string;
  details: string;
}

interface Language {
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
  languages: Language[];
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

const ResumeForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'BM'>('English');
  const [showOptionalFields, setShowOptionalFields] = useState({
    linkedin: false,
    languages: false,
    certifications: false,
    achievements: false,
    extracurricular: false,
    reference: false
  });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    email: '',
    telephone: '',
    linkedin: '',
    title: '',
    about: '',
    image: null,
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
    location: '',
    language: 'English'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof FormData] as any,
        [field]: value
      }
    }));
  };

  const handleArrayInputChange = (section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as any[]).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSimpleArrayChange = (section: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as string[]).map((item, i) =>
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (section: string, defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section as keyof FormData] as any[]), defaultItem]
    }));
  };

  const removeArrayItem = (section: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof FormData] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const formatSubmissionData = (gdriveUrl: string) => {
    const formatLanguages = () => {
      return formData.languages
        .filter(lang => lang.language.trim())
        .map(lang => `${lang.language} ${lang.proficiency}`)
        .join(', ');
    };

    const formatExperiences = () => {
      const validExperiences = formData.experiences.filter(exp => 
        exp.company.trim() || exp.title.trim() || exp.details.trim()
      );
      
      if (validExperiences.length === 0) {
        return "No work experience";
      }
      
      return validExperiences.map(exp => 
        `${exp.title} at ${exp.company}, ${exp.location} (${exp.duration}): ${exp.details}`
      ).join('; ');
    };

    const formatSkills = (skills: Skill[]) => {
      return skills
        .filter(skill => skill.skill.trim())
        .map(skill => `${skill.skill} ${skill.percentage}%`)
        .join(', ');
    };

    const formatList = (items: string[]) => {
      return items.filter(item => item.trim()).join(', ');
    };

    const formatExtracurricular = () => {
      return formData.extracurricularActivities
        .filter(activity => activity.title.trim())
        .map(activity => `${activity.title} (${activity.date}): ${activity.details}`)
        .join(', ');
    };

    return {
      id: Math.floor(Math.random() * 10000),
      template: "A",
      gdrive_url: gdriveUrl,
      language_selected: selectedLanguage,
      user_image: "",
      name: formData.name,
      adress: formData.address, // Note: keeping the original typo from the spec
      email: formData.email,
      telephone: formData.telephone,
      linkedin: formData.linkedin,
      title: formData.title,
      about: formData.about,
      language: formatLanguages(),
      experience: formatExperiences(),
      education: `${formData.education.degree}, ${formData.education.institution}, CGPA: ${formData.education.cgpa}, Duration: ${formData.education.duration}`,
      strength: formData.strength,
      reference: formData.reference.name ? 
        `${formData.reference.name}, ${formData.reference.position}, ${formData.reference.company}, ${formData.reference.contact}` : '',
      technical_skills: formatSkills(formData.technicalSkills),
      soft_skills: formatSkills(formData.softSkills),
      certification: formatList(formData.certifications),
      Achivements: formatList(formData.achievements), // Note: keeping the original typo from the spec
      extracurricular_activities: formatExtracurricular(),
      location: formData.location
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowReview(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // First upload image
      let gdriveUrl = '';
      if (formData.image) {
        const uploadResponse = await uploadImage(formData.image);
        gdriveUrl = uploadResponse.gdrive_url;
      }

      // Then submit the full data
      const submissionData = formatSubmissionData(gdriveUrl);
      await submitResume(submissionData);
      
      alert('Resume submitted successfully!');
      setShowReview(false);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit resume. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOptionalField = (field: keyof typeof showOptionalFields) => {
    setShowOptionalFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const autofillSkills = () => {
    const commonTechnicalSkills = [
      { skill: 'JavaScript', percentage: 85 },
      { skill: 'React', percentage: 80 },
      { skill: 'Python', percentage: 75 },
      { skill: 'Node.js', percentage: 70 }
    ];
    const commonSoftSkills = [
      { skill: 'Communication', percentage: 90 },
      { skill: 'Teamwork', percentage: 85 },
      { skill: 'Problem Solving', percentage: 80 },
      { skill: 'Leadership', percentage: 75 }
    ];
    
    setFormData(prev => ({
      ...prev,
      technicalSkills: commonTechnicalSkills,
      softSkills: commonSoftSkills
    }));
  };

  const autofillAboutMe = () => {
    const aboutMeExample = selectedLanguage === 'English' 
      ? 'Experienced software developer with 3+ years of expertise in full-stack development. Passionate about creating innovative solutions and working in collaborative environments. Strong background in modern web technologies and agile methodologies.'
      : 'Pembangun perisian berpengalaman dengan 3+ tahun kepakaran dalam pembangunan full-stack. Berminat untuk mencipta penyelesaian inovatif dan bekerja dalam persekitaran kolaboratif. Latar belakang yang kukuh dalam teknologi web moden dan metodologi agile.';
    
    setFormData(prev => ({
      ...prev,
      about: aboutMeExample
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-yellow-200">
      {/* Language Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            type="button"
            onClick={() => setSelectedLanguage('English')}
            className={`px-6 py-2 rounded-md transition-colors ${
              selectedLanguage === 'English' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguage('BM')}
            className={`px-6 py-2 rounded-md transition-colors ${
              selectedLanguage === 'BM' 
                ? 'bg-yellow-500 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Bahasa Malaysia
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder="e.g., Kuala Lumpur, Malaysia"
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => toggleOptionalField('linkedin')}
                className="text-yellow-600 hover:text-yellow-700 font-medium mb-2 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add LinkedIn Profile (Optional)
              </button>
              {showOptionalFields.linkedin && (
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg transition-colors flex items-center border border-yellow-200">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
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
                <label className="block text-sm font-medium text-gray-700">About Me</label>
                <button
                  type="button"
                  onClick={autofillAboutMe}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors"
                >
                  Auto Fill Example
                </button>
              </div>
              <textarea
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                placeholder={selectedLanguage === 'English' 
                  ? "Brief description about yourself, your experience, and what makes you unique..." 
                  : "Penerangan ringkas tentang diri anda, pengalaman anda, dan apa yang membuatkan anda unik..."}
              />
            </div>
          </div>
        </section>

        {/* Language Proficiency */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Target className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Language Proficiency</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleOptionalField('languages')}
              className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Languages (Optional)
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
                  Add Language
                </button>
              </div>
              
              {formData.languages.map((lang, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <input
                    type="text"
                    placeholder="Language"
                    value={lang.language}
                    onChange={(e) => handleArrayInputChange('languages', index, 'language', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  <select
                    value={lang.proficiency}
                    onChange={(e) => handleArrayInputChange('languages', index, 'proficiency', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="professional">Professional</option>
                    <option value="native">Native</option>
                  </select>
                  {formData.languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('languages', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Work Experience */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Briefcase className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Work Experience</h2>
            </div>
            {formData.experiences.length < 3 && (
              <button
                type="button"
                onClick={() => addArrayItem('experiences', { company: '', title: '', location: '', duration: '', details: '' })}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </button>
            )}
          </div>
          
          {formData.experiences.length === 0 || (formData.experiences.length === 1 && !formData.experiences[0].company.trim()) ? (
            <div className="text-center py-8 text-gray-500 bg-yellow-50 rounded-lg border border-yellow-200">
              <p>No work experience yet? That's okay for fresh graduates!</p>
            </div>
          ) : null}
          
          {formData.experiences.map((exp, index) => (
            <div key={index} className="bg-yellow-50 p-6 rounded-lg mb-4 border border-yellow-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Experience {index + 1}</h3>
                {formData.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('experiences', index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={exp.company}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'company', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                  value={exp.duration}
                  onChange={(e) => handleArrayInputChange('experiences', index, 'duration', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>
              
              <textarea
                placeholder="Job details and responsibilities..."
                value={exp.details}
                onChange={(e) => handleArrayInputChange('experiences', index, 'details', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center mb-6">
            <GraduationCap className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Education</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="e.g., Bachelor of Computer Science"
              value={formData.education.degree}
              onChange={(e) => handleNestedInputChange('education', 'degree', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., University of Technology Malaysia"
              value={formData.education.institution}
              onChange={(e) => handleNestedInputChange('education', 'institution', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., 2020 - 2024"
              value={formData.education.duration}
              onChange={(e) => handleNestedInputChange('education', 'duration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., 3.75"
              value={formData.education.cgpa}
              onChange={(e) => handleNestedInputChange('education', 'cgpa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
          </div>
        </section>

        {/* Strength */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Strengths</h2>
          </div>
          
          <textarea
            value={formData.strength}
            onChange={(e) => handleInputChange('strength', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            placeholder="Describe your key strengths and what makes you unique..."
          />
        </section>

        {/* Technical Skills */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Code className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Technical Skills</h2>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={autofillSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
              >
                Auto Fill Examples
              </button>
              {formData.technicalSkills.length < 5 && (
                <button
                  type="button"
                  onClick={() => addArrayItem('technicalSkills', { skill: '', percentage: 50 })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
          {formData.technicalSkills.map((skill, index) => (
            <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="e.g., JavaScript, Python, React"
                value={skill.skill}
                onChange={(e) => handleArrayInputChange('technicalSkills', index, 'skill', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
              />
              <div className="flex items-center space-x-2 w-28">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.percentage}
                  onChange={(e) => handleArrayInputChange('technicalSkills', index, 'percentage', parseInt(e.target.value))}
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-xs font-medium w-8 text-gray-600">{skill.percentage}%</span>
              </div>
              {formData.technicalSkills.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('technicalSkills', index)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                >
                  Delete
                </button>
              )}
              </div>
            </div>
          ))}
          </div>
        </section>

        {/* Soft Skills */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Soft Skills</h2>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={autofillSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
              >
                Auto Fill Examples
              </button>
              {formData.softSkills.length < 5 && (
                <button
                  type="button"
                  onClick={() => addArrayItem('softSkills', { skill: '', percentage: 50 })}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
          {formData.softSkills.map((skill, index) => (
            <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="e.g., Communication, Leadership, Teamwork"
                value={skill.skill}
                onChange={(e) => handleArrayInputChange('softSkills', index, 'skill', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm"
              />
              <div className="flex items-center space-x-2 w-28">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.percentage}
                  onChange={(e) => handleArrayInputChange('softSkills', index, 'percentage', parseInt(e.target.value))}
                  className="flex-1 accent-yellow-500"
                />
                <span className="text-xs font-medium w-8 text-gray-600">{skill.percentage}%</span>
              </div>
              {formData.softSkills.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('softSkills', index)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                >
                  Delete
                </button>
              )}
              </div>
            </div>
          ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Award className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Certifications</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleOptionalField('certifications')}
              className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Certifications (Optional)
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
                  Add Certification
                </button>
              </div>
              
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <input
                    type="text"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={cert}
                    onChange={(e) => handleSimpleArrayChange('certifications', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  {formData.certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('certifications', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Achievements */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Star className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Achievements</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleOptionalField('achievements')}
              className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Achievements (Optional)
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
                  Add Achievement
                </button>
              </div>
              
              {formData.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <input
                    type="text"
                    placeholder="e.g., Employee of the Year 2023"
                    value={achievement}
                    onChange={(e) => handleSimpleArrayChange('achievements', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  {formData.achievements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('achievements', index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Extracurricular Activities */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Extracurricular Activities</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleOptionalField('extracurricular')}
              className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Activities (Optional)
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
                  Add Activity
                </button>
              </div>
              
              {formData.extracurricularActivities.map((activity, index) => (
                <div key={index} className="bg-yellow-50 p-6 rounded-lg mb-4 border border-yellow-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Activity {index + 1}</h3>
                    {formData.extracurricularActivities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('extracurricularActivities', index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="e.g., Student Council President"
                      value={activity.title}
                      onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="e.g., 2022 - 2023"
                      value={activity.date}
                      onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  
                  <textarea
                    placeholder="Activity details and achievements..."
                    value={activity.details}
                    onChange={(e) => handleArrayInputChange('extracurricularActivities', index, 'details', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              ))}
            </>
          )}
        </section>

        {/* Reference */}
        <section className="border-b border-gray-200 pb-8">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">Reference (Optional)</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="e.g., Dr. Sarah Johnson"
              value={formData.reference.name}
              onChange={(e) => handleNestedInputChange('reference', 'name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., Senior Manager"
              value={formData.reference.position}
              onChange={(e) => handleNestedInputChange('reference', 'position', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., Tech Solutions Sdn Bhd"
              value={formData.reference.company}
              onChange={(e) => handleNestedInputChange('reference', 'company', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
            <input
              type="text"
              placeholder="e.g., sarah.johnson@techsolutions.com, +60123456789"
              value={formData.reference.contact}
              onChange={(e) => handleNestedInputChange('reference', 'contact', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            />
          </div>
        </section>

        {/* Submit Button */}
        <div className="text-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 flex items-center mx-auto transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-3" />
                Submit Resume
              </>
            )}
          </button>
        </div>
      </form>

      {/* Review Popup */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Your Resume</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {formData.name || 'Not provided'}</div>
                    <div><strong>Job Title:</strong> {formData.title || 'Not provided'}</div>
                    <div><strong>Email:</strong> {formData.email || 'Not provided'}</div>
                    <div><strong>Phone:</strong> {formData.telephone || 'Not provided'}</div>
                    <div><strong>Address:</strong> {formData.address || 'Not provided'}</div>
                    <div><strong>Location:</strong> {formData.location || 'Not provided'}</div>
                    {formData.linkedin && <div><strong>LinkedIn:</strong> {formData.linkedin}</div>}
                  </div>
                </div>

                {/* About Me */}
                {formData.about && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">About Me</h3>
                    <p className="text-sm">{formData.about}</p>
                  </div>
                )}

                {/* Education */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Education</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Degree:</strong> {formData.education.degree || 'Not provided'}</div>
                    <div><strong>Institution:</strong> {formData.education.institution || 'Not provided'}</div>
                    <div><strong>Duration:</strong> {formData.education.duration || 'Not provided'}</div>
                    <div><strong>CGPA:</strong> {formData.education.cgpa || 'Not provided'}</div>
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Work Experience</h3>
                  {formData.experiences.filter(exp => exp.company.trim()).length > 0 ? (
                    formData.experiences.filter(exp => exp.company.trim()).map((exp, index) => (
                      <div key={index} className="mb-3 text-sm">
                        <div><strong>{exp.title}</strong> at {exp.company}</div>
                        <div>{exp.location} • {exp.duration}</div>
                        <div>{exp.details}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No work experience provided</p>
                  )}
                </div>

                {/* Skills */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Skills</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Technical Skills:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {formData.technicalSkills.filter(s => s.skill.trim()).map((skill, index) => (
                          <li key={index}>{skill.skill} ({skill.percentage}%)</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Soft Skills:</strong>
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Languages</h3>
                    <div className="text-sm">
                      {formData.languages.filter(l => l.language.trim()).map((lang, index) => (
                        <div key={index}>{lang.language} ({lang.proficiency})</div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.certifications.filter(c => c.trim()).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Certifications</h3>
                    <ul className="list-disc list-inside text-sm">
                      {formData.certifications.filter(c => c.trim()).map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.achievements.filter(a => a.trim()).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Achievements</h3>
                    <ul className="list-disc list-inside text-sm">
                      {formData.achievements.filter(a => a.trim()).map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.extracurricularActivities.filter(a => a.title.trim()).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Extracurricular Activities</h3>
                    <div className="text-sm space-y-2">
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Reference</h3>
                    <div className="text-sm space-y-1">
                      <div><strong>Name:</strong> {formData.reference.name}</div>
                      <div><strong>Position:</strong> {formData.reference.position}</div>
                      <div><strong>Company:</strong> {formData.reference.company}</div>
                      <div><strong>Contact:</strong> {formData.reference.contact}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Resume
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;
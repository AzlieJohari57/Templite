import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Upload, Plus, Send, User, Briefcase, GraduationCap, Award, Users,
  Code, Heart, Star, Calendar, ChevronDown, ChevronUp, RotateCcw,
  Sparkles, Loader2, Hash, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { uploadImage, submitResume, getResumeStatus, JobStatus } from '../services/api';
import { translations, Language as AppLanguage } from '../translations';
import { generateJobProfile } from '../services/gemini';
import logo from '../assets/logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Experience {
  company: string;
  title: string;
  duration: string;
  details: string;
}

interface EducationEntry {
  institution: string;
  qualification: string;
  duration: string;
  result: string;
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

interface ReferenceEntry {
  name: string;
  position: string;
  company: string;
  contact: string;
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
  hasExperience: boolean | null;
  experiences: Experience[];
  additionalExperience: string;
  strength: string;
  education: EducationEntry[];
  additionalEducation: string;
  technicalSkills: Skill[];
  softSkills: Skill[];
  references: ReferenceEntry[];
  additionalReference: string;
  languages: LanguageProficiency[];
  certifications: string[];
  achievements: string[];
  extracurricularActivities: ExtracurricularActivity[];
}

interface ResumeFormProps {
  selectedTemplate: string | null;
  selectedTemplateRef: React.MutableRefObject<string | null>;
  selectedLanguage: AppLanguage;
  resumeLanguage: AppLanguage | null;
  selectedPages: '1' | '2' | '3+';
  onPagesChange: (p: '1' | '2' | '3+') => void;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TEMPLATE_NAMES: Record<string, { en: string; bm: string }> = {
  A: { en: 'Template A - Best Overall',  bm: 'Templat A - Terbaik Keseluruhan' },
  B: { en: 'Template B - Coloured ATS',  bm: 'Templat B - ATS Berwarna' },
  C: { en: 'Template C - Finance',       bm: 'Templat C - Kewangan' },
  D: { en: 'Template D - Friendly ATS',  bm: 'Templat D - Mesra ATS' },
  E: { en: 'Template E - Business',      bm: 'Templat E - Perniagaan' },
  F: { en: 'Template F - Engineering',   bm: 'Templat F - Kejuruteraan' },
  G: { en: 'Template G - Designer',      bm: 'Templat G - Designer' },
  H: { en: 'Template H - Admin',         bm: 'Templat H - Pentadbiran' },
  I: { en: 'Template I - HR',            bm: 'Templat I - HR' },
  J: { en: 'Template J - Government',    bm: 'Templat J - Kerajaan' },
  K: { en: 'Template K - CV',            bm: 'Templat K - CV' },
  L: { en: 'Template L - Internship',    bm: 'Templat L - Latihan Industri' },
  M: { en: 'Template M - Fully ATS',     bm: 'Templat M - ATS Penuh' },
};

const TECH_SKILL_EXAMPLES: Skill[] = [
  { skill: 'Microsoft Word', percentage: 80 },
  { skill: 'Microsoft Excel', percentage: 75 },
  { skill: 'Microsoft PowerPoint', percentage: 70 },
  { skill: 'Microsoft Access', percentage: 65 },
];

const SOFT_SKILL_EXAMPLES_EN: Skill[] = [
  { skill: 'Communication', percentage: 90 },
  { skill: 'Teamwork', percentage: 85 },
  { skill: 'Problem Solving', percentage: 80 },
  { skill: 'Leadership', percentage: 75 },
];

const SOFT_SKILL_EXAMPLES_BM: Skill[] = [
  { skill: 'Rajin', percentage: 90 },
  { skill: 'Kerjasama', percentage: 85 },
  { skill: 'Berkomunikasi', percentage: 80 },
  { skill: 'Kepimpinan', percentage: 75 },
];

const TECH_SKILL_PLACEHOLDERS = [
  'Microsoft Word',
  'Microsoft Excel',
  'Microsoft PowerPoint',
  'Microsoft Access',
];

const SOFT_SKILL_PLACEHOLDERS = [
  'Hardworking / Rajin',
  'Teamwork / Kerjasama',
  'Communication / Berkomunikasi',
  'Leadership / Kepimpinan',
];

const ABOUT_ME_EXAMPLES_EN = [
  'Adaptable professional with strong cross-functional collaboration and structured planning skills. Comfortable in dynamic environments, communicating clearly and responding quickly. Focused on improving workflow efficiency, supporting team objectives, and maintaining reliable execution through practical solutions and consistent responsibility.',
  'Versatile individual experienced in coordination and team environments, ensuring smooth daily operations. Skilled in problem-solving, planning, and communication across departments. Adapts to changing needs while focusing on efficiency, teamwork, and continuous improvement to support workplace performance.',
  'Professional with strong interpersonal ability, working effectively in collaborative settings. Able to manage multiple tasks with accuracy and consistency. Supports clear communication between teams and adapts to changing priorities while maintaining focus on operational effectiveness and improvement.',
  'Motivated individual with experience in coordination, planning, and task execution. Strong communication supports smooth interaction across functions. Adapts to shifting priorities while maintaining productivity and contributing to efficient, stable, and cooperative workplace operations.',
  'Resourceful professional with a collaborative approach to work. Manages responsibilities with clarity while supporting team goals. Communicates effectively across departments, adapts to changing demands, and focuses on practical solutions that improve efficiency and workflow.',
  'Capable individual with strong coordination and planning skills in team settings. Maintains clear communication and adapts to evolving needs while staying productive. Focused on problem-solving, efficiency, and contributing positively to overall organizational performance.',
  'Dynamic professional experienced in structured environments requiring teamwork and coordination. Strong communication supports smooth collaboration. Adapts to change easily while maintaining efficiency and contributing to continuous improvement through practical and consistent performance.',
  'Reliable and adaptable individual focused on teamwork, planning, and communication. Handles multitasking environments effectively while maintaining efficiency and consistency. Open to growth and contributes to better processes through practical involvement and steady support.',
  'Experienced in collaborative environments with strong planning and communication skills. Adapts quickly to changing requirements while maintaining structured workflow support. Focused on improving efficiency and contributing to team and organizational success through proactive problem-solving.',
  'Well-rounded professional with a collaborative mindset and strong coordination ability. Communicates effectively and adapts to changing work demands. Focused on workflow efficiency, team support, and maintaining a stable, productive working environment through consistent execution.',
];

const ABOUT_ME_EXAMPLES_BM = [
  'Seorang yang mudah menyesuaikan diri dalam pelbagai situasi kerja, selesa bekerjasama dengan pasukan dan jabatan lain. Fokus kepada penyusunan kerja yang teratur, komunikasi jelas dan penyelesaian tugasan secara praktikal untuk memastikan aliran kerja lebih lancar.',
  'Berkebolehan bekerja dalam suasana kerja yang berubah-ubah dengan pendekatan tenang dan tersusun. Gemar bekerjasama dalam pasukan, membantu menyelesaikan masalah harian kerja serta memastikan tugasan disiapkan dengan baik dan mengikut keperluan semasa.',
  'Seorang individu yang senang bekerjasama dan boleh diharapkan dalam tugasan berkumpulan. Menitikberatkan komunikasi yang jelas, pengurusan kerja yang teratur dan sentiasa bersedia menyesuaikan diri dengan perubahan keutamaan kerja.',
  'Mempunyai pendekatan kerja yang praktikal dan mudah disesuaikan dalam persekitaran berpasukan. Selesa mengurus beberapa tugasan pada masa yang sama sambil memastikan kerja berjalan lancar dan tersusun.',
  'Berkebolehan menyelaras tugasan dengan baik dalam persekitaran kerja yang dinamik. Fokus kepada kerjasama pasukan, komunikasi yang mudah difahami dan penyelesaian masalah secara terus dan berkesan.',
  'Seorang yang stabil dan mudah dibentuk dalam persekitaran kerja berbeza. Selesa membantu pasukan, menyesuaikan diri dengan tugasan baru dan memastikan kerja harian disiapkan dengan teratur dan konsisten.',
  'Gemar bekerja dalam suasana yang memerlukan kerjasama dan koordinasi. Menjaga komunikasi yang baik antara rakan kerja serta memastikan setiap tugasan dilaksanakan dengan teratur dan efisien.',
  'Individu yang fokus kepada kerja berpasukan dan penyusunan tugasan yang kemas. Mudah menyesuaikan diri dengan perubahan dan sentiasa mencari cara untuk melancarkan proses kerja harian.',
  'Mempunyai sikap kerja yang fleksibel dan mudah bekerjasama dengan pelbagai pihak. Selesa dalam persekitaran kerja yang pantas dan berubah, sambil mengekalkan fokus pada hasil kerja yang tersusun.',
  'Seorang yang boleh menyesuaikan diri dengan cepat dalam pelbagai situasi kerja. Menyokong kerja berpasukan melalui komunikasi yang jelas, penyusunan kerja yang baik dan pendekatan yang praktikal dalam menyelesaikan tugasan.',
];

const INITIAL_FORM_DATA: FormData = {
  name: '', address: '', email: '', telephone: '', linkedin: '', title: '',
  about: '', image: null,
  hasExperience: null,
  experiences: [{ company: '', title: '', duration: '', details: '' }],
  additionalExperience: '',
  strength: '',
  education: [{ institution: '', qualification: '', duration: '', result: '' }],
  additionalEducation: '',
  technicalSkills: [{ skill: '', percentage: 50 }],
  softSkills: [{ skill: '', percentage: 50 }],
  references: [{ name: '', position: '', company: '', contact: '' }],
  additionalReference: '',
  languages: [{ language: '', proficiency: 'beginner' }],
  certifications: [''],
  achievements: [''],
  extracurricularActivities: [{ title: '', date: '', details: '' }],
};

// ─── Skill row (hoisted + memoized) ───────────────────────────────────────────
// Defined at module scope (not inside ResumeForm's render) so its identity is
// stable across parent re-renders. Otherwise React would remount the <input
// type="range"> on every slider change, breaking pointer capture mid-drag and
// making the thumb jump/reset while dragging on both touch and mouse.

type FormText = (typeof translations)['English']['form'];

interface SkillRowProps {
  section: 'technicalSkills' | 'softSkills';
  index: number;
  skill: Skill;
  count: number;
  t: FormText;
  cardCls: string;
  inputCls: string;
  deleteBtnCls: string;
  onChange: (section: 'technicalSkills' | 'softSkills', index: number, field: string, value: any) => void;
  onRemove: (section: 'technicalSkills' | 'softSkills', index: number) => void;
  getSkillLevel: (pct: number) => string;
  getSkillLevelColor: (pct: number) => string;
}

const SkillRow = React.memo(({
  section, index, skill, count, t, cardCls, inputCls, deleteBtnCls,
  onChange, onRemove, getSkillLevel, getSkillLevelColor,
}: SkillRowProps) => {
  const placeholderList = section === 'technicalSkills' ? TECH_SKILL_PLACEHOLDERS : SOFT_SKILL_PLACEHOLDERS;
  const fallback = section === 'technicalSkills'
    ? 'Technical Skill / Kemahiran Teknikal'
    : 'Soft Skill / Kemahiran Insaniah';
  const placeholder = placeholderList[index] ?? fallback;

  return (
    <div className={cardCls.replace('mb-4', '')}>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          placeholder={placeholder}
          value={skill.skill}
          onChange={e => onChange(section, index, 'skill', e.target.value)}
          className={inputCls + ' text-sm flex-1'}
        />
        {count > 1 && (
          <button type="button" onClick={() => onRemove(section, index)} className={deleteBtnCls}>
            {t.delete}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range" min="0" max="100"
          value={skill.percentage}
          onChange={e => onChange(section, index, 'percentage', parseInt(e.target.value))}
          className="flex-1 accent-yellow-500 cursor-pointer touch-none"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right">{skill.percentage}%</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSkillLevelColor(skill.percentage)}`}>
            {getSkillLevel(skill.percentage)}
          </span>
        </div>
      </div>
    </div>
  );
});
SkillRow.displayName = 'SkillRow';

// ─── Component ────────────────────────────────────────────────────────────────

const ResumeForm: React.FC<ResumeFormProps> = ({
  selectedTemplate,
  selectedTemplateRef,
  selectedLanguage,
  resumeLanguage,
  selectedPages,
  onPagesChange,
}) => {
  const t = useMemo(() => translations[selectedLanguage].form, [selectedLanguage]);
  const tc = useMemo(() => translations[selectedLanguage].templateCarousel, [selectedLanguage]);

  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [expandedAdditional, setExpandedAdditional] = useState({
    languages: false, certifications: false, achievements: false, activities: false,
  });

  // Additional section visibility states
  const [showAdditionalExperience, setShowAdditionalExperience] = useState(false);
  const [showAdditionalEducation, setShowAdditionalEducation] = useState(false);
  const [showAdditionalReference, setShowAdditionalReference] = useState(false);

  // Reference toggle: true = Reference Included, false = Available Upon Request
  const [referenceIncluded, setReferenceIncluded] = useState(true);

  // Post-submit upsell + processing screens
  const [showUpsell, setShowUpsell] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState(0);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aboutMeIndex = useRef(0);

  const LOADING_MESSAGES = [
    "Teaching AI to use a pen... it prefers keyboards 🤖",
    "Bribing the printer with virtual coffee ☕",
    "Alphabetizing your achievements... in Klingon 🖖",
    "Polishing your buzzwords until they shine ✨",
    "Convincing your skills they belong on paper 📄",
    "Hiring tiny elves to typeset your resume 🧝",
    "Running spell-check on your life choices 🔍",
    "Asking ChatGPT nicely to step aside 😤",
    "Sprinkling magic dust on your work history 🪄",
    "Negotiating with fonts for the best deal 🔤",
    "Making your experience sound fancier than it is 💼",
    "Adding 'proficient in MS Office' for the 100th time 😅",
    "Generating your future boss's first impression 👔",
    "Warming up the PDF machine 🖨️",
    "Your resume is almost ready to conquer the world 🌍",
  ];
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSubmitting) {
      setLoadingMsgIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (showProcessing) {
      setCheckedSteps(0);
      let step = 0;
      checkIntervalRef.current = setInterval(() => {
        step += 1;
        setCheckedSteps(step);
        if (step >= 6) {
          if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        }
      }, 800);
    } else {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    }
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [showProcessing]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleArrayChange = useCallback((section: keyof FormData, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const handleSimpleArrayChange = useCallback((section: keyof FormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as string[]).map((item, i) => i === index ? value : item),
    }));
  }, []);

  const addItem = useCallback((section: keyof FormData, defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), defaultItem],
    }));
  }, []);

  const removeItem = useCallback((section: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_, i) => i !== index),
    }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setField('image', e.target.files[0]);
  }, [setField]);

  const autofillAboutMe = useCallback(() => {
    const lang = resumeLanguage ?? selectedLanguage;
    const examples = lang === 'English' ? ABOUT_ME_EXAMPLES_EN : ABOUT_ME_EXAMPLES_BM;
    setField('about', examples[aboutMeIndex.current % examples.length]);
    aboutMeIndex.current = (aboutMeIndex.current + 1) % examples.length;
  }, [resumeLanguage, selectedLanguage, setField]);

  const autofillTechnicalSkills = useCallback(() => {
    setField('technicalSkills', TECH_SKILL_EXAMPLES);
  }, [setField]);

  const autofillSoftSkills = useCallback(() => {
    const lang = resumeLanguage ?? selectedLanguage;
    setField('softSkills', lang === 'English' ? SOFT_SKILL_EXAMPLES_EN : SOFT_SKILL_EXAMPLES_BM);
  }, [resumeLanguage, selectedLanguage, setField]);

  const autofillWithAI = async () => {
    if (!formData.title.trim()) { alert(t.enterJobTitle); return; }
    setIsGeneratingAI(true);
    try {
      const lang = resumeLanguage ?? selectedLanguage;
      const profile = await generateJobProfile(formData.title, lang);
      setFormData(prev => ({
        ...prev,
        about: profile.aboutMe,
        technicalSkills: profile.technicalSkills,
        softSkills: profile.softSkills,
        strength: profile.strengths,
      }));
    } catch (error) {
      console.error('AI generation error:', error);
      alert(t.aiError);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getSkillLevel = useCallback((pct: number) => {
    if (pct <= 25) return t.skillLevelBeginner;
    if (pct <= 50) return t.skillLevelIntermediate;
    if (pct <= 75) return t.skillLevelAdvanced;
    return t.skillLevelExpert;
  }, [t]);

  const getSkillLevelColor = useCallback((pct: number) => {
    if (pct <= 25) return 'text-blue-600 dark:text-blue-400';
    if (pct <= 50) return 'text-green-600 dark:text-green-400';
    if (pct <= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-purple-600 dark:text-purple-400';
  }, []);

  const resetForm = useCallback(() => {
    if (window.confirm(t.resetConfirm)) {
      setFormData({ ...INITIAL_FORM_DATA });
      setShowLinkedIn(false);
      setShowAdditionalDetails(false);
      setExpandedAdditional({ languages: false, certifications: false, achievements: false, activities: false });
      setShowAdditionalExperience(false);
      setShowAdditionalEducation(false);
      setShowAdditionalReference(false);
      setReferenceIncluded(true);
      setShowUpsell(false);
      setShowProcessing(false);
      setCheckedSteps(0);
    }
  }, [t]);

  const getTemplateName = useMemo(() => {
    const id = selectedTemplate;
    if (!id) return selectedLanguage === 'English' ? 'No template selected' : 'Tiada templat dipilih';
    const tmpl = TEMPLATE_NAMES[id] || { en: `Template ${id}`, bm: `Templat ${id}` };
    return selectedLanguage === 'English' ? tmpl.en : tmpl.bm;
  }, [selectedLanguage, selectedTemplate]);

  const resumeLanguageLabel = useMemo(() => {
    if (!resumeLanguage) return '';
    return resumeLanguage === 'English' ? '( English )' : '( Bahasa Malaysia )';
  }, [resumeLanguage]);

  // ── Add Experience handler ──────────────────────────────────────────────────
  const handleAddExperience = useCallback(() => {
    if (formData.experiences.length < 3) {
      addItem('experiences', { company: '', title: '', duration: '', details: '' });
    } else {
      setShowAdditionalExperience(true);
    }
  }, [formData.experiences.length, addItem]);

  const handleDeleteAdditionalExperience = useCallback(() => {
    setShowAdditionalExperience(false);
    setField('additionalExperience', '');
  }, [setField]);

  // ── Add Education handler ───────────────────────────────────────────────────
  const handleAddEducation = useCallback(() => {
    if (formData.education.length < 3) {
      addItem('education', { institution: '', qualification: '', duration: '', result: '' });
    } else {
      setShowAdditionalEducation(true);
    }
  }, [formData.education.length, addItem]);

  const handleDeleteAdditionalEducation = useCallback(() => {
    setShowAdditionalEducation(false);
    setField('additionalEducation', '');
  }, [setField]);

  // ── Add Reference handler ───────────────────────────────────────────────────
  const handleAddReference = useCallback(() => {
    if (formData.references.length < 2) {
      addItem('references', { name: '', position: '', company: '', contact: '' });
    } else {
      setShowAdditionalReference(true);
    }
  }, [formData.references.length, addItem]);

  const handleDeleteAdditionalReference = useCallback(() => {
    setShowAdditionalReference(false);
    setField('additionalReference', '');
  }, [setField]);

  // ── Submission ──────────────────────────────────────────────────────────────

  const formatSubmissionData = (imageUrl: string) => {
    const effectiveLang = resumeLanguage ?? selectedLanguage;

    const formatLanguages = () =>
      formData.languages.filter(l => l.language.trim()).map(l => ({ [l.language]: l.proficiency }));

    const formatExperiences = () => {
      if (formData.hasExperience === false) return [];
      const exps = formData.experiences
        .filter(e => e.company.trim() || e.title.trim())
        .map(e => ({
          company: e.company,
          title: e.title,
          location: '',
          duration: e.duration,
          details: e.details.split('\n').filter(d => d.trim()),
        }));
      if (formData.additionalExperience.trim()) {
        exps.push({
          company: effectiveLang === 'English' ? 'Additional Experience' : 'Pengalaman Tambahan',
          title: '',
          location: '',
          duration: '',
          details: [formData.additionalExperience.trim()],
        });
      }
      return exps;
    };

    const formatEducation = () => {
      const entries = formData.education
        .filter(e => e.institution.trim() || e.qualification.trim())
        .map(e => ({
          level: e.qualification,
          institution: e.institution,
          duration: e.duration,
          grade: e.result,
        }));
      if (formData.additionalEducation.trim()) {
        entries.push({
          level: effectiveLang === 'English' ? 'Additional Education' : 'Pendidikan Tambahan',
          institution: formData.additionalEducation.trim(),
          duration: '',
          grade: '',
        });
      }
      return entries;
    };

    const formatSkills = () => {
      const tech: Record<string, number> = {};
      const soft: Record<string, number> = {};
      formData.technicalSkills.filter(s => s.skill.trim()).forEach(s => { tech[s.skill] = s.percentage; });
      formData.softSkills.filter(s => s.skill.trim()).forEach(s => { soft[s.skill] = s.percentage; });
      return { 'technical skills': tech, 'soft skills': soft };
    };

    const formatCertifications = () =>
      formData.certifications.filter(c => c.trim()).map(c => ({ title: c, issuer: '', date: '' }));

    const formatAchievements = () => formData.achievements.filter(a => a.trim());

    const formatExtracurricular = () =>
      formData.extracurricularActivities.filter(a => a.title.trim()).map(a => ({
        title: a.title, date: a.date, details: a.details,
      }));

    const formatReference = () => {
      if (!referenceIncluded) {
        return [{ name: effectiveLang === 'English' ? 'References available upon request' : 'Rujukan disediakan atas permintaan', position: '', company: '', email: '', telephone: '' }];
      }
      const hasReferenceData = formData.references.some(r => r.name.trim());
      if (!hasReferenceData) return [];
      const refs = formData.references.filter(r => r.name.trim()).map(r => ({
        name: r.name, position: r.position, company: r.company, email: '', telephone: r.contact,
      }));
      if (formData.additionalReference.trim()) {
        refs.push({
          name: effectiveLang === 'English' ? 'Additional Reference' : 'Rujukan Tambahan',
          position: '', company: '', email: '', telephone: formData.additionalReference.trim(),
        });
      }
      return refs;
    };

    const formatStrength = () =>
      formData.strength.split('\n').map(s => s.trim()).filter(Boolean);

    const experiences = formatExperiences();

    return {
      language: effectiveLang,
      template: selectedTemplateRef.current,
      resume: {
        id: String(Math.floor(Math.random() * 10000)),
        name: formData.name,
        title: formData.title,
        image: imageUrl,
        adress: formData.address,
        email: formData.email,
        telephone: formData.telephone,
        linkedin: formData.linkedin,
        about: formData.about,
        language: formatLanguages(),
        experience: experiences,
        'number of jobs': experiences.length,
        education: formatEducation(),
        strength: formatStrength(),
        reference: formatReference(),
        skills: formatSkills(),
        certification: formatCertifications(),
        achievement: formatAchievements(),
        'extracurricular activities': formatExtracurricular(),
      },
    };
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateRef.current) {
      alert(t.pleaseChooseTemplate);
      return;
    }
    if (!resumeLanguage) {
      alert(t.pleaseChooseLanguage);
      return;
    }
    setShowReview(true);
  }, [selectedTemplateRef, resumeLanguage, t]);

  const logResumeToSheet = useCallback((resumeLink: string = '', imageLink: string = '') => {
    const sessionId = sessionStorage.getItem('templite_session_id');
    if (!sessionId) return;
    fetch('/api/log-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_resume',
        sessionId,
        name: formData.name,
        email: formData.email,
        jobTitle: formData.title,
        template: selectedTemplateRef.current,
        pages: selectedPages,
        resumeLink,
        imageLink,
      }),
    }).catch(() => {});
  }, [formData.name, formData.email, formData.title, selectedTemplateRef, selectedPages]);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    setJobStatus(null);
    setShowUpsell(true);
    setShowProcessing(false);
    setCheckedSteps(0);
    try {
      let imageUrl = '';
      let imageDriveUrl = '';
      if (formData.image) {
        const up = await uploadImage(formData.image, formData.telephone);
        imageUrl = up.image_url;
        imageDriveUrl = up.drive_image_url || '';
      }
      const { job_id } = await submitResume(formatSubmissionData(imageUrl));
      setJobStatus('pending');
      const poll = async () => {
        try {
          const status = await getResumeStatus(job_id);
          setJobStatus(status.status);
          if (status.status === 'done') {
            setSubmitDone(true);
            setIsSubmitting(false);
            logResumeToSheet(status.drive_url || '', imageDriveUrl);
          } else if (status.status === 'failed') {
            setSubmitError(status.error || 'Resume generation failed. Please try again.');
            setIsSubmitting(false);
            setShowUpsell(false);
            setShowProcessing(false);
          } else {
            setTimeout(poll, 3000);
          }
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : 'Lost connection. Please try again.');
          setIsSubmitting(false);
          setShowUpsell(false);
          setShowProcessing(false);
        }
      };
      setTimeout(poll, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unknown error');
      setIsSubmitting(false);
      setShowUpsell(false);
      setShowProcessing(false);
    }
  };

  // ── Shared UI helpers ────────────────────────────────────────────────────────

  const inputCls = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
  const cardCls = 'bg-yellow-50 dark:bg-yellow-900/20 p-4 sm:p-6 rounded-lg mb-4 border border-yellow-200 dark:border-yellow-800';
  const sectionBorderCls = 'border-b border-gray-200 dark:border-gray-700 pb-8';
  const sectionHeadingCls = 'text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white';
  const deleteBtnCls = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs font-medium shrink-0';
  const addBtnCls = 'bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center shadow-md text-sm shrink-0';

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasTemplate = !!selectedTemplate;
  const hasResumeLanguage = !!resumeLanguage;

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-8 border border-yellow-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Selected Template + Number of Pages ── */}
        <section className={sectionBorderCls}>
          {!hasTemplate || !hasResumeLanguage ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center text-sm text-yellow-800 dark:text-yellow-300">
              {selectedLanguage === 'English'
                ? '⚠ Please choose a template and resume language above to get started.'
                : '⚠ Sila pilih templat dan bahasa resume di atas untuk bermula.'}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-4 shrink-0">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">{selectedTemplate}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedLanguage === 'English' ? 'Selected Template' : 'Templat Dipilih'}
                  </p>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {getTemplateName}
                    {resumeLanguageLabel && (
                      <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">{resumeLanguageLabel}</span>
                    )}
                  </h3>
                </div>
              </div>
              <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                ✓ {selectedLanguage === 'English' ? 'Selected' : 'Dipilih'}
              </div>
            </div>
          )}

          {/* Number of Pages */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{tc.numberOfPages}</span>
            </div>
            <div className="flex gap-2">
              {(['1', '2', '3+'] as const).map(p => (
                <button
                  key={p} type="button" onClick={() => onPagesChange(p)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                    selectedPages === p
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Basic Information ── */}
        <section className={sectionBorderCls}>
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
            <h2 className={sectionHeadingCls}>{t.basicInformation}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.fullName} *</label>
              <input type="text" required value={formData.name}
                onChange={e => setField('name', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.jobTitleOptional}
                <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">✨ {selectedLanguage === 'English' ? 'AI autofill available' : 'Isi automatik AI tersedia'}</span>
              </label>
              <input type="text" value={formData.title}
                onChange={e => setField('title', e.target.value)}
                placeholder={t.jobTitleExample} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email} *</label>
              <input type="email" required value={formData.email}
                onChange={e => setField('email', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.phoneNumber} *</label>
              <input type="tel" required value={formData.telephone}
                onChange={e => setField('telephone', e.target.value)} className={inputCls} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.address} *</label>
              <input type="text" required value={formData.address}
                onChange={e => setField('address', e.target.value)} className={inputCls} />
            </div>

            {/* LinkedIn optional */}
            <div className="md:col-span-2">
              <button type="button" onClick={() => setShowLinkedIn(v => !v)}
                className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.addLinkedIn}</span>
                {showLinkedIn ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {showLinkedIn && (
                <input type="text" value={formData.linkedin}
                  onChange={e => setField('linkedin', e.target.value)}
                  placeholder={t.linkedInPlaceholder} className={inputCls} />
              )}
            </div>

            {/* Profile image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profileImage}</label>
              <label className="cursor-pointer bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg transition-colors flex items-center border border-yellow-200 w-fit">
                <Upload className="w-4 h-4 mr-2" />
                {t.chooseFile}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {formData.image && <p className="text-xs text-gray-500 mt-1">{formData.image.name}</p>}
            </div>

            {/* About Me */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.aboutMe}</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={autofillWithAI} disabled={isGeneratingAI}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50">
                    {isGeneratingAI ? <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isGeneratingAI ? t.generatingWithAI : t.autoFillWithAI}
                  </button>
                  <button type="button" onClick={autofillAboutMe}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full transition-colors">
                    {t.autoFill}
                  </button>
                </div>
              </div>
              <textarea value={formData.about} onChange={e => setField('about', e.target.value)}
                rows={4} placeholder={t.aboutMePlaceholder} className={inputCls} />
            </div>
          </div>
        </section>

        {/* ── Work Experience ── */}
        <section className={sectionBorderCls}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center">
              <Briefcase className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
              <h2 className={sectionHeadingCls}>{t.workExperience}</h2>
            </div>
          </div>

          {/* Toggle: No Experience / With Experience */}
          {formData.hasExperience === null && (
            <div className="flex justify-center gap-4">
              <button type="button" onClick={() => setField('hasExperience', false)}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors shadow-md">
                {t.noExperienceBtn}
              </button>
              <button type="button" onClick={() => setField('hasExperience', true)}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors shadow-md">
                {t.withExperienceBtn}
              </button>
            </div>
          )}

          {/* No Experience → Strengths */}
          {formData.hasExperience === false && (
            <div>
              <button type="button" onClick={() => setField('hasExperience', null)}
                className="mb-5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                {t.back}
              </button>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4 text-sm text-gray-600 dark:text-gray-300">
                {t.noExperienceMessage}
              </div>
              <div className="flex items-center mb-4">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 shrink-0" />
                <span className={sectionHeadingCls}>{t.strengths}</span>
              </div>
              <textarea value={formData.strength} onChange={e => setField('strength', e.target.value)}
                rows={4} placeholder={t.strengthsPlaceholder} className={inputCls} />
            </div>
          )}

          {/* With Experience */}
          {formData.hasExperience === true && (
            <div>
              <button type="button" onClick={() => setField('hasExperience', null)}
                className="mb-5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                {t.back}
              </button>

              {formData.experiences.map((exp, index) => (
                <div key={index} className={cardCls}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">{t.experience} {index + 1}</h3>
                    {formData.experiences.length > 1 && (
                      <button type="button" onClick={() => removeItem('experiences', index)} className={deleteBtnCls}>
                        {t.delete}
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder={t.companyName} value={exp.company}
                      onChange={e => handleArrayChange('experiences', index, 'company', e.target.value)} className={inputCls} />
                    <input type="text" placeholder={t.jobTitlePlaceholder} value={exp.title}
                      onChange={e => handleArrayChange('experiences', index, 'title', e.target.value)} className={inputCls} />
                  </div>
                  <input type="text" placeholder={t.durationPlaceholder} value={exp.duration}
                    onChange={e => handleArrayChange('experiences', index, 'duration', e.target.value)}
                    className={inputCls + ' mb-4'} />
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t.jobDetailsOptional}</label>
                  <textarea placeholder={t.jobDetails} value={exp.details}
                    onChange={e => handleArrayChange('experiences', index, 'details', e.target.value)}
                    rows={3} className={inputCls} />
                </div>
              ))}

              {/* Add Experience button — shown up to 3 entries, then one more click shows additional */}
              {(formData.experiences.length < 3 || (formData.experiences.length === 3 && !showAdditionalExperience)) && (
                <div className="flex justify-end mt-2 mb-4">
                  <button type="button" onClick={handleAddExperience} className={addBtnCls}>
                    <Plus className="w-4 h-4 mr-1.5" />{t.addExperience}
                  </button>
                </div>
              )}

              {/* Additional Work Experience textarea */}
              {showAdditionalExperience && (
                <div className={cardCls}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.additionalWorkExperience}</h3>
                    <button type="button" onClick={handleDeleteAdditionalExperience} className={deleteBtnCls}>
                      {t.delete}
                    </button>
                  </div>
                  <textarea value={formData.additionalExperience}
                    onChange={e => setField('additionalExperience', e.target.value)}
                    placeholder={t.additionalWorkExperiencePlaceholder} rows={4} className={inputCls} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Education ── */}
        <section className={sectionBorderCls}>
          <div className="flex items-center mb-6">
            <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
            <h2 className={sectionHeadingCls}>{t.education}</h2>
          </div>

          {formData.education.map((edu, index) => (
            <div key={index} className={cardCls}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedLanguage === 'English' ? `Education ${index + 1}` : `Pendidikan ${index + 1}`}
                </h3>
                {formData.education.length > 1 && (
                  <button type="button" onClick={() => removeItem('education', index)} className={deleteBtnCls}>
                    {t.delete}
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder={t.institutionPlaceholder} value={edu.institution}
                  onChange={e => handleArrayChange('education', index, 'institution', e.target.value)} className={inputCls} />
                <input type="text" placeholder={t.qualificationPlaceholder} value={edu.qualification}
                  onChange={e => handleArrayChange('education', index, 'qualification', e.target.value)} className={inputCls} />
                <input type="text" placeholder={t.durationEducationPlaceholder} value={edu.duration}
                  onChange={e => handleArrayChange('education', index, 'duration', e.target.value)} className={inputCls} />
                <input type="text" placeholder={t.resultPlaceholder} value={edu.result}
                  onChange={e => handleArrayChange('education', index, 'result', e.target.value)} className={inputCls} />
              </div>
            </div>
          ))}

          {/* Add Education button — up to 3, then one more click shows additional */}
          {(formData.education.length < 3 || (formData.education.length === 3 && !showAdditionalEducation)) && (
            <div className="flex justify-end mt-2 mb-4">
              <button type="button" onClick={handleAddEducation} className={addBtnCls}>
                <Plus className="w-4 h-4 mr-1.5" />{t.addEducation}
              </button>
            </div>
          )}

          {/* Additional Education textarea */}
          {showAdditionalEducation && (
            <div className={cardCls}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.additionalEducation}</h3>
                <button type="button" onClick={handleDeleteAdditionalEducation} className={deleteBtnCls}>
                  {t.delete}
                </button>
              </div>
              <textarea value={formData.additionalEducation}
                onChange={e => setField('additionalEducation', e.target.value)}
                placeholder={t.additionalEducationPlaceholder} rows={3} className={inputCls} />
            </div>
          )}
        </section>

        {/* ── Technical Skills ── */}
        <section className={sectionBorderCls}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center">
              <Code className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
              <h2 className={sectionHeadingCls}>{t.technicalSkills}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={autofillWithAI} disabled={isGeneratingAI}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50">
                {isGeneratingAI ? <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t.autoFillWithAI}
              </button>
              <button type="button" onClick={autofillTechnicalSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors">
                {t.autoFillExamples}
              </button>
              {formData.technicalSkills.length < 5 && (
                <button type="button"
                  onClick={() => addItem('technicalSkills', { skill: '', percentage: 50 })}
                  className={addBtnCls}>
                  <Plus className="w-4 h-4 mr-1.5" />{t.addSkill}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {formData.technicalSkills.map((skill, index) => (
              <SkillRow
                key={index}
                section="technicalSkills"
                index={index}
                skill={skill}
                count={formData.technicalSkills.length}
                t={t}
                cardCls={cardCls}
                inputCls={inputCls}
                deleteBtnCls={deleteBtnCls}
                onChange={handleArrayChange}
                onRemove={removeItem}
                getSkillLevel={getSkillLevel}
                getSkillLevelColor={getSkillLevelColor}
              />
            ))}
          </div>
        </section>

        {/* ── Soft Skills ── */}
        <section className={sectionBorderCls}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
              <h2 className={sectionHeadingCls}>{t.softSkills}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={autofillWithAI} disabled={isGeneratingAI}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50">
                {isGeneratingAI ? <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t.autoFillWithAI}
              </button>
              <button type="button" onClick={autofillSoftSkills}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors">
                {t.autoFillExamples}
              </button>
              {formData.softSkills.length < 5 && (
                <button type="button"
                  onClick={() => addItem('softSkills', { skill: '', percentage: 50 })}
                  className={addBtnCls}>
                  <Plus className="w-4 h-4 mr-1.5" />{t.addSkill}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {formData.softSkills.map((skill, index) => (
              <SkillRow
                key={index}
                section="softSkills"
                index={index}
                skill={skill}
                count={formData.softSkills.length}
                t={t}
                cardCls={cardCls}
                inputCls={inputCls}
                deleteBtnCls={deleteBtnCls}
                onChange={handleArrayChange}
                onRemove={removeItem}
                getSkillLevel={getSkillLevel}
                getSkillLevelColor={getSkillLevelColor}
              />
            ))}
          </div>
        </section>

        {/* ── Reference ── */}
        <section className={sectionBorderCls}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 shrink-0" />
              <h2 className={sectionHeadingCls}>{t.reference}</h2>
            </div>
            {/* Reference toggle */}
            <button
              type="button"
              onClick={() => setReferenceIncluded(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {referenceIncluded
                ? <ToggleRight className="w-8 h-8 text-yellow-500" />
                : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              <span className={referenceIncluded ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}>
                {referenceIncluded ? t.referenceIncluded : t.availableUponRequest}
              </span>
            </button>
          </div>

          {/* Soft hint */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 ml-9">
            {t.switchToAvailableUponRequest}
          </p>

          {referenceIncluded ? (
            <>
              {/* Example info box */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-5 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-1">{selectedLanguage === 'English' ? 'Example:' : 'Contoh:'} <span className="text-gray-500">{t.referenceExampleTypes}</span></p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs mt-2 text-gray-500 dark:text-gray-400">
                  <span>{t.referenceName} : Dr. Sarah Johnson</span>
                  <span>{t.referencePosition} : Senior Manager</span>
                  <span>{t.referenceCompany} : Tech Solutions Sdn Bhd</span>
                  <span>{t.referencePhone} : +60123456789</span>
                </div>
              </div>

              {formData.references.map((ref, index) => (
                <div key={index} className={cardCls}>
                  {formData.references.length > 1 && (
                    <div className="flex justify-end mb-3">
                      <button type="button" onClick={() => removeItem('references', index)} className={deleteBtnCls}>
                        {t.delete}
                      </button>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t.referenceName} value={ref.name}
                      onChange={e => handleArrayChange('references', index, 'name', e.target.value)} className={inputCls} />
                    <input type="text" placeholder={t.referenceCompany} value={ref.company}
                      onChange={e => handleArrayChange('references', index, 'company', e.target.value)} className={inputCls} />
                    <input type="text" placeholder={t.referencePosition} value={ref.position}
                      onChange={e => handleArrayChange('references', index, 'position', e.target.value)} className={inputCls} />
                    <input type="text" placeholder={t.referencePhone} value={ref.contact}
                      onChange={e => handleArrayChange('references', index, 'contact', e.target.value)} className={inputCls} />
                  </div>
                </div>
              ))}

              {/* Add Reference button — up to 2, then one more click shows additional */}
              {(formData.references.length < 2 || (formData.references.length === 2 && !showAdditionalReference)) && (
                <div className="flex justify-end mt-2 mb-4">
                  <button type="button" onClick={handleAddReference} className={addBtnCls}>
                    <Plus className="w-4 h-4 mr-1.5" />{t.addReference}
                  </button>
                </div>
              )}

              {/* Additional Reference textarea */}
              {showAdditionalReference && (
                <div className={cardCls}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.additionalReference}</h3>
                    <button type="button" onClick={handleDeleteAdditionalReference} className={deleteBtnCls}>
                      {t.delete}
                    </button>
                  </div>
                  <textarea value={formData.additionalReference}
                    onChange={e => setField('additionalReference', e.target.value)}
                    placeholder={t.additionalReferencePlaceholder} rows={3} className={inputCls} />
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center text-sm text-gray-600 dark:text-gray-300">
              {t.referencesAvailableUponRequest}
            </div>
          )}
        </section>

        {/* ── Additional Details (collapsed panel) ── */}
        <section className={sectionBorderCls}>
          {!showAdditionalDetails ? (
            <button type="button" onClick={() => setShowAdditionalDetails(true)}
              className="w-full px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
              {t.additionalDetails}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedLanguage === 'English' ? 'Additional Details' : 'Maklumat Tambahan'}
                </h2>
                <button type="button" onClick={() => setShowAdditionalDetails(false)}
                  className={deleteBtnCls + ' px-4 py-1.5 text-sm'}>
                  {t.closeAdditionalDetails}
                </button>
              </div>

              {/* Language (Optional) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedAdditional(p => ({ ...p, languages: !p.languages }))}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{t.languageProficiency}</span>
                  </div>
                  {expandedAdditional.languages ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {expandedAdditional.languages && (
                  <div className="p-4 space-y-3">
                    {formData.languages.map((lang, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input type="text" placeholder={t.languagePlaceholder} value={lang.language}
                          onChange={e => handleArrayChange('languages', index, 'language', e.target.value)}
                          className={inputCls + ' flex-1'} />
                        <select value={lang.proficiency}
                          onChange={e => handleArrayChange('languages', index, 'proficiency', e.target.value)}
                          className={'w-full sm:w-auto ' + inputCls}>
                          <option value="beginner">{t.beginner}</option>
                          <option value="intermediate">{t.intermediate}</option>
                          <option value="professional">{t.professional}</option>
                          <option value="native">{t.native}</option>
                        </select>
                        {formData.languages.length > 1 && (
                          <button type="button" onClick={() => removeItem('languages', index)} className={deleteBtnCls}>
                            {t.delete}
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addItem('languages', { language: '', proficiency: 'beginner' })}
                      className={addBtnCls}>
                      <Plus className="w-4 h-4 mr-1.5" />{t.addLanguage}
                    </button>
                  </div>
                )}
              </div>

              {/* Certifications (Optional) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedAdditional(p => ({ ...p, certifications: !p.certifications }))}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{t.certifications}</span>
                  </div>
                  {expandedAdditional.certifications ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {expandedAdditional.certifications && (
                  <div className="p-4 space-y-3">
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="text" placeholder={t.certificationPlaceholder} value={cert}
                          onChange={e => handleSimpleArrayChange('certifications', index, e.target.value)}
                          className={inputCls + ' flex-1'} />
                        {formData.certifications.length > 1 && (
                          <button type="button" onClick={() => removeItem('certifications', index)} className={deleteBtnCls}>
                            {t.delete}
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addItem('certifications', '')} className={addBtnCls}>
                      <Plus className="w-4 h-4 mr-1.5" />{t.addCertification}
                    </button>
                  </div>
                )}
              </div>

              {/* Achievements (Optional) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedAdditional(p => ({ ...p, achievements: !p.achievements }))}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{t.achievements}</span>
                  </div>
                  {expandedAdditional.achievements ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {expandedAdditional.achievements && (
                  <div className="p-4 space-y-3">
                    {formData.achievements.map((ach, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="text" placeholder={t.achievementPlaceholder} value={ach}
                          onChange={e => handleSimpleArrayChange('achievements', index, e.target.value)}
                          className={inputCls + ' flex-1'} />
                        {formData.achievements.length > 1 && (
                          <button type="button" onClick={() => removeItem('achievements', index)} className={deleteBtnCls}>
                            {t.delete}
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addItem('achievements', '')} className={addBtnCls}>
                      <Plus className="w-4 h-4 mr-1.5" />{t.addAchievement}
                    </button>
                  </div>
                )}
              </div>

              {/* Activities (Optional) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button type="button"
                  onClick={() => setExpandedAdditional(p => ({ ...p, activities: !p.activities }))}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{t.extracurricularActivities}</span>
                  </div>
                  {expandedAdditional.activities ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {expandedAdditional.activities && (
                  <div className="p-4 space-y-4">
                    {formData.extracurricularActivities.map((act, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.activity} {index + 1}</span>
                          {formData.extracurricularActivities.length > 1 && (
                            <button type="button" onClick={() => removeItem('extracurricularActivities', index)} className={deleteBtnCls}>
                              {t.delete}
                            </button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <input type="text" placeholder={t.activityTitlePlaceholder} value={act.title}
                            onChange={e => handleArrayChange('extracurricularActivities', index, 'title', e.target.value)} className={inputCls} />
                          <input type="text" placeholder={t.activityDatePlaceholder} value={act.date}
                            onChange={e => handleArrayChange('extracurricularActivities', index, 'date', e.target.value)} className={inputCls} />
                        </div>
                        <textarea placeholder={t.activityDetails} value={act.details}
                          onChange={e => handleArrayChange('extracurricularActivities', index, 'details', e.target.value)}
                          rows={2} className={inputCls} />
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => addItem('extracurricularActivities', { title: '', date: '', details: '' })}
                      className={addBtnCls}>
                      <Plus className="w-4 h-4 mr-1.5" />{t.addActivity}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Submit / Reset ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <button type="button" onClick={resetForm}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg transition-all flex items-center justify-center transform hover:scale-105 shadow-lg">
            <RotateCcw className="w-5 h-5 mr-3" />{t.resetForm}
          </button>
          <button type="submit" disabled={isSubmitting || !hasTemplate || !hasResumeLanguage}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-8 py-3 rounded-lg transition-all flex items-center justify-center transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg">
            {isSubmitting ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />{t.submitting}</>
            ) : (
              <><Send className="w-5 h-5 mr-3" />{t.submitResume}</>
            )}
          </button>
        </div>
        {(!hasTemplate || !hasResumeLanguage) && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 -mt-2">
            {!hasTemplate
              ? (selectedLanguage === 'English' ? 'Choose a template above to enable submission.' : 'Pilih templat di atas untuk mengaktifkan penghantaran.')
              : (selectedLanguage === 'English' ? 'Choose a resume language to enable submission.' : 'Pilih bahasa resume untuk mengaktifkan penghantaran.')}
          </p>
        )}
      </form>

      {/* ── Review Popup ── */}
      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">

              {/* Upsell Screen — shown immediately after submit while processing in background */}
              {showUpsell && !showProcessing && !submitDone && (
                <div className="flex flex-col items-center py-8 px-4 text-center">
                  <img src={logo} alt="Templite" className="h-10 w-auto mb-5 invert dark:invert-0" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.thankYouForChoosing}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.orderBeingProcessed}</p>
                  <div className="flex gap-1 mb-5">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <div className="w-full max-w-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-5 text-left">
                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">✨ {t.levelUpCareer}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">{t.availableAddons}</p>
                    <ul className="space-y-1.5">
                      {[t.addonCV, t.addonPassport, t.addonCoverLetter, t.addonResignation, t.addonFormal, t.addonPortfolio, t.addonCompany].map((addon, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-yellow-500 font-bold shrink-0">+</span> {addon}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-sm">
                    <a
                      href="https://wa.me/60172410612?text=Hi%20Templite%20!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-md text-center text-sm"
                    >
                      ✨ {t.addToMyOrder}
                    </a>
                    <button
                      type="button"
                      onClick={() => { setShowUpsell(false); setShowProcessing(true); }}
                      className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm"
                    >
                      👍 {t.imGoodForNow}
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Screen — shown after "I'm good for now" */}
              {showProcessing && !submitDone && (
                <div className="flex flex-col items-center py-8 px-4 text-center">
                  <img src={logo} alt="Templite" className="h-10 w-auto mb-5 invert dark:invert-0" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-8">{t.preparingDocument}</p>
                  <div className="w-full max-w-xs space-y-3 mb-8">
                    {[t.processingStep1, t.processingStep2, t.processingStep3, t.processingStep4, t.processingStep5, t.processingStep6].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          checkedSteps > i ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {checkedSteps > i && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm text-left transition-colors duration-300 ${
                          checkedSteps > i ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-500'
                        }`}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowProcessing(false); setShowUpsell(true); }}
                    className="px-6 py-2.5 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 font-semibold rounded-xl transition-colors text-sm"
                  >
                    {t.modifyAddons}
                  </button>
                </div>
              )}

              {/* Success */}
              {submitDone && !isSubmitting && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedLanguage === 'English' ? 'Completed! You can close the browser now.' : 'Selesai! Anda boleh tutup pelayar sekarang.'}
                  </h3>
                </div>
              )}

              {/* Error */}
              {submitError && !isSubmitting && !submitDone && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {selectedLanguage === 'English' ? `Something went wrong: ${submitError}` : `Ralat berlaku: ${submitError}`}
                </div>
              )}

              {/* Review content */}
              {!isSubmitting && !submitDone && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.reviewTitle}</h2>
                    <button onClick={() => setShowReview(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none">×</button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.basicInformation}</h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm dark:text-gray-300">
                        <div><strong>{t.name}:</strong> {formData.name || t.notProvided}</div>
                        <div><strong>{t.jobTitleReview}:</strong> {formData.title || t.notProvided}</div>
                        <div><strong>{t.email}:</strong> {formData.email || t.notProvided}</div>
                        <div><strong>{t.phone}:</strong> {formData.telephone || t.notProvided}</div>
                        <div className="md:col-span-2"><strong>{t.address}:</strong> {formData.address || t.notProvided}</div>
                        {formData.linkedin && <div className="md:col-span-2"><strong>LinkedIn:</strong> {formData.linkedin}</div>}
                      </div>
                    </div>

                    {formData.about && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2 dark:text-white">{t.aboutMeReview}</h3>
                        <p className="text-sm dark:text-gray-300">{formData.about}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.workExperienceReview}</h3>
                      {formData.hasExperience === false ? (
                        <div className="text-sm dark:text-gray-300">
                          <p className="italic text-gray-500 mb-2">{t.noExperienceBtn}</p>
                          {formData.strength && <p><strong>{t.strengthsReview}:</strong> {formData.strength}</p>}
                        </div>
                      ) : formData.experiences.filter(e => e.company.trim()).length > 0 ? (
                        formData.experiences.filter(e => e.company.trim()).map((exp, i) => (
                          <div key={i} className="mb-3 text-sm dark:text-gray-300">
                            <div><strong>{exp.title}</strong> {selectedLanguage === 'English' ? 'at' : 'di'} {exp.company}</div>
                            <div className="text-gray-500">{exp.duration}</div>
                            {exp.details && <div>{exp.details}</div>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.noWorkExperience}</p>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.educationReview}</h3>
                      {formData.education.filter(e => e.institution.trim()).map((edu, i) => (
                        <div key={i} className="text-sm dark:text-gray-300 mb-2">
                          <div><strong>{edu.qualification}</strong> — {edu.institution}</div>
                          <div className="text-gray-500">{edu.duration}{edu.result ? ` | ${edu.result}` : ''}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.skillsReview}</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-gray-300">
                        <div>
                          <strong>{t.technicalSkillsReview}:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {formData.technicalSkills.filter(s => s.skill).map((s, i) => (
                              <li key={i}>{s.skill} ({s.percentage}%)</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>{t.softSkillsReview}:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {formData.softSkills.filter(s => s.skill).map((s, i) => (
                              <li key={i}>{s.skill} ({s.percentage}%)</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {formData.references.filter(r => r.name.trim()).length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 dark:text-white">{t.referenceReview}</h3>
                        {formData.references.filter(r => r.name.trim()).map((ref, i) => (
                          <div key={i} className="text-sm dark:text-gray-300 mb-2">
                            <div><strong>{ref.name}</strong> — {ref.position}</div>
                            <div className="text-gray-500">{ref.company} | {ref.contact}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                    <button onClick={() => setShowReview(false)}
                      className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300 text-center">
                      {t.backToEdit}
                    </button>
                    <button onClick={handleFinalSubmit} disabled={isSubmitting}
                      className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center">
                      <Send className="w-4 h-4 mr-2" />{t.submitResume}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Loading Modal ── */}
      {isGeneratingAI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-200 dark:border-yellow-900 rounded-full" />
                <div className="w-20 h-20 border-4 border-yellow-500 dark:border-yellow-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                <Loader2 className="w-10 h-10 text-yellow-500 dark:text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.generatingWithAI}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedLanguage === 'English' ? 'Creating personalized content for your resume...' : 'Membuat kandungan diperibadikan untuk resume anda...'}
                </p>
              </div>
              <div className="flex space-x-2">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm;

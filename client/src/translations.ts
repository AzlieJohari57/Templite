export type Language = 'English' | 'BM';

export const translations = {
  English: {
    // Header
    header: {
      english: 'English',
      bahasaMelayu: 'Bahasa Melayu',
      toggleDarkMode: 'Toggle dark mode'
    },
    
    // Landing Banner
    landingBanner: {
      title: 'TEMPLITE',
      description: 'Create a professional resume that stands out. Choose from beautiful templates and let our smart form guide you through every step.',
      professionalTemplates: 'Professional Templates',
      quickEasy: 'Quick & Easy',
      atsFriendly: 'ATS-Friendly'
    },
    
    // Template Carousel
    templateCarousel: {
      chooseTemplate: 'Choose Your Template',
      selectDesign: 'Select a design that matches your style and industry',
      classicProfessional: 'Classic Professional',
      classicProfessionalDesc: 'Clean and traditional layout perfect for corporate roles',
      modernCreative: 'Modern Creative',
      modernCreativeDesc: 'Contemporary design with creative elements',
      minimalist: 'Minimalist',
      minimalistDesc: 'Simple and elegant with focus on content'
    },
    
    // Resume Form
    form: {
      basicInformation: 'Basic Information',
      fullName: 'Full Name',
      jobTitle: 'Job Title',
      jobTitleOptional: 'Job Title (Optional)',
      jobTitleExample: 'e.g., Software Engineer, Marketing Manager',
      email: 'Email',
      phoneNumber: 'Phone Number',
      address: 'Address',
      location: 'Location',
      locationOptional: 'Location (Optional)',
      locationExample: 'e.g., Kuala Lumpur, Malaysia',
      addLinkedIn: 'Add LinkedIn Profile (Optional)',
      linkedInPlaceholder: 'https://linkedin.com/in/yourprofile',
      profileImage: 'Profile Image',
      chooseFile: 'Choose File',
      aboutMe: 'About Me',
      autoFillExample: 'Auto Fill Example',
      autoFillWithAI: 'Auto Fill with AI',
      generatingWithAI: 'Generating with AI...',
      aiError: 'Failed to generate content. Please try again.',
      enterJobTitle: 'Please enter a job title first to use AI auto-fill.',
      aboutMePlaceholder: 'Example: Experienced software developer with 3+ years of expertise in full-stack development. Passionate about creating innovative solutions and working in collaborative environments. Strong background in modern web technologies and agile methodologies.',
      
      workExperience: 'Work Experience',
      addExperience: 'Add Experience',
      noExperience: "No work experience yet? That's okay for fresh graduates!",
      experience: 'Experience',
      companyName: 'Company Name',
      jobTitlePlaceholder: 'Job Title',
      locationPlaceholder: 'Location',
      duration: 'Duration',
      durationPlaceholder: 'Duration (e.g., Jan 2020 - Dec 2022)',
      jobDetails: 'Job details and responsibilities...',
      delete: 'Delete',
      
      education: 'Education',
      degree: 'Degree',
      degreePlaceholder: 'e.g., Bachelor of Computer Science',
      institution: 'Institution',
      institutionPlaceholder: 'e.g., University of Technology Malaysia',
      durationPlaceholder: 'Example: 2020 - 2024 or September 2020 - May 2024',
      cgpa: 'CGPA',
      cgpaPlaceholder: 'e.g., 3.75',
      
      strengths: 'Strengths',
      strengthsPlaceholder: 'Describe your key strengths and what makes you unique...',
      
      technicalSkills: 'Technical Skills',
      softSkills: 'Soft Skills',
      autoFillExamples: 'Auto Fill Examples',
      addSkill: 'Add Skill',
      technicalSkillsPlaceholder: 'Example: JavaScript, Python, React, Node.js',
      softSkillsPlaceholder: 'Example: Communication, Leadership, Teamwork, Problem Solving',
      skillLevelBeginner: 'Beginner',
      skillLevelIntermediate: 'Intermediate',
      skillLevelAdvanced: 'Advanced',
      skillLevelExpert: 'Expert',
      
      languageProficiency: 'Language Proficiency (Optional)',
      addLanguages: 'Add Languages',
      addLanguage: 'Add Language',
      languagePlaceholder: 'Example: English, Bahasa Malaysia, Mandarin',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      professional: 'Professional',
      native: 'Native',
      
      certifications: 'Certifications (Optional)',
      addCertifications: 'Add Certifications (Optional)',
      addCertification: 'Add Certification',
      certificationPlaceholder: 'e.g., AWS Certified Solutions Architect',
      
      achievements: 'Achievements (Optional)',
      addAchievements: 'Add Achievements (Optional)',
      addAchievement: 'Add Achievement',
      achievementPlaceholder: 'e.g., Employee of the Year 2023',
      
      extracurricularActivities: 'Extracurricular Activities (Optional)',
      addActivities: 'Add Activities (Optional)',
      addActivity: 'Add Activity',
      activity: 'Activity',
      activityTitlePlaceholder: 'e.g., Student Council President',
      activityDatePlaceholder: 'e.g., 2022 - 2023',
      activityDetails: 'Activity details and achievements...',
      
      reference: 'Reference (Optional)',
      referenceExample: 'Example: Dr. Sarah Johnson, Senior Manager at Tech Solutions Sdn Bhd, Email: sarah.johnson@techsolutions.com, Phone: +60123456789',
      referenceNamePlaceholder: 'Example: Dr. Sarah Johnson',
      referencePositionPlaceholder: 'Example: Senior Manager',
      referenceCompanyPlaceholder: 'Example: Tech Solutions Sdn Bhd',
      referenceContactPlaceholder: 'Example: sarah.johnson@techsolutions.com, +60123456789',
      
      submitResume: 'Submit Resume',
      submitting: 'Submitting...',
      resetForm: 'Reset Form',
      resetConfirm: 'Are you sure you want to reset the form? All data will be lost.',
      addReference: 'Add Reference (Optional)',
      
      // Review Popup
      reviewTitle: 'Review Your Resume',
      backToEdit: 'Back to Edit',
      notProvided: 'Not provided',
      name: 'Name',
      jobTitleReview: 'Job Title',
      phone: 'Phone',
      aboutMeReview: 'About Me',
      educationReview: 'Education',
      degreeReview: 'Degree',
      institutionReview: 'Institution',
      durationReview: 'Duration',
      workExperienceReview: 'Work Experience',
      noWorkExperience: 'No work experience provided',
      skillsReview: 'Skills',
      technicalSkillsReview: 'Technical Skills',
      softSkillsReview: 'Soft Skills',
      languagesReview: 'Languages',
      certificationsReview: 'Certifications',
      achievementsReview: 'Achievements',
      extracurricularActivitiesReview: 'Extracurricular Activities',
      referenceReview: 'Reference',
      positionReview: 'Position',
      companyReview: 'Company',
      contactReview: 'Contact'
    }
  },
  
  BM: {
    // Header
    header: {
      english: 'English',
      bahasaMelayu: 'Bahasa Melayu',
      toggleDarkMode: 'Tukar mod gelap'
    },
    
    // Landing Banner
    landingBanner: {
      title: 'TEMPLITE',
      description: 'Cipta resume profesional yang menonjol. Pilih daripada templat yang cantik dan biarkan borang pintar kami membimbing anda melalui setiap langkah.',
      professionalTemplates: 'Templat Profesional',
      quickEasy: 'Cepat & Mudah',
      atsFriendly: 'Mesra ATS'
    },
    
    // Template Carousel
    templateCarousel: {
      chooseTemplate: 'Pilih Templat Anda',
      selectDesign: 'Pilih reka bentuk yang sesuai dengan gaya dan industri anda',
      classicProfessional: 'Klasik Profesional',
      classicProfessionalDesc: 'Susun atur bersih dan tradisional sesuai untuk peranan korporat',
      modernCreative: 'Moden Kreatif',
      modernCreativeDesc: 'Reka bentuk kontemporari dengan elemen kreatif',
      minimalist: 'Minimalis',
      minimalistDesc: 'Mudah dan elegan dengan fokus pada kandungan'
    },
    
    // Resume Form
    form: {
      basicInformation: 'Maklumat Asas',
      fullName: 'Nama Penuh',
      jobTitle: 'Jawatan',
      jobTitleOptional: 'Jawatan (Pilihan)',
      jobTitleExample: 'cth., Jurutera Perisian, Pengurus Pemasaran',
      email: 'E-mel',
      phoneNumber: 'Nombor Telefon',
      address: 'Alamat',
      location: 'Lokasi',
      locationOptional: 'Lokasi (Pilihan)',
      locationExample: 'cth., Kuala Lumpur, Malaysia',
      addLinkedIn: 'Tambah Profil LinkedIn (Pilihan)',
      linkedInPlaceholder: 'https://linkedin.com/in/profilanda',
      profileImage: 'Imej Profil',
      chooseFile: 'Pilih Fail',
      aboutMe: 'Tentang Saya',
      autoFillExample: 'Isi Contoh Automatik',
      autoFillWithAI: 'Isi Automatik dengan AI',
      generatingWithAI: 'Menjana dengan AI...',
      aiError: 'Gagal menjana kandungan. Sila cuba lagi.',
      enterJobTitle: 'Sila masukkan jawatan terlebih dahulu untuk menggunakan isi automatik AI.',
      aboutMePlaceholder: 'Contoh: Pembangun perisian berpengalaman dengan 3+ tahun kepakaran dalam pembangunan full-stack. Berminat untuk mencipta penyelesaian inovatif dan bekerja dalam persekitaran kolaboratif. Latar belakang yang kukuh dalam teknologi web moden dan metodologi agile.',
      
      workExperience: 'Pengalaman Kerja',
      addExperience: 'Tambah Pengalaman',
      noExperience: 'Tiada pengalaman kerja lagi? Tidak mengapa untuk graduan baharu!',
      experience: 'Pengalaman',
      companyName: 'Nama Syarikat',
      jobTitlePlaceholder: 'Jawatan',
      locationPlaceholder: 'Lokasi',
      duration: 'Tempoh',
      durationPlaceholder: 'Tempoh (cth., Jan 2020 - Dis 2022)',
      jobDetails: 'Butiran kerja dan tanggungjawab...',
      delete: 'Padam',
      
      education: 'Pendidikan',
      degree: 'Ijazah',
      degreePlaceholder: 'cth., Ijazah Sarjana Muda Sains Komputer',
      institution: 'Institusi',
      institutionPlaceholder: 'cth., Universiti Teknologi Malaysia',
      durationPlaceholder: 'Contoh: 2020 - 2024 atau September 2020 - Mei 2024',
      cgpa: 'CGPA',
      cgpaPlaceholder: 'cth., 3.75',
      
      strengths: 'Kekuatan',
      strengthsPlaceholder: 'Terangkan kekuatan utama anda dan apa yang membuatkan anda unik...',
      
      technicalSkills: 'Kemahiran Teknikal',
      softSkills: 'Kemahiran Insaniah',
      autoFillExamples: 'Isi Contoh Automatik',
      addSkill: 'Tambah Kemahiran',
      technicalSkillsPlaceholder: 'Contoh: JavaScript, Python, React, Node.js',
      softSkillsPlaceholder: 'Contoh: Komunikasi, Kepimpinan, Kerja Berpasukan, Penyelesaian Masalah',
      skillLevelBeginner: 'Pemula',
      skillLevelIntermediate: 'Pertengahan',
      skillLevelAdvanced: 'Mahir',
      skillLevelExpert: 'Pakar',
      
      languageProficiency: 'Kemahiran Bahasa (Pilihan)',
      addLanguages: 'Tambah Bahasa',
      addLanguage: 'Tambah Bahasa',
      languagePlaceholder: 'Contoh: Bahasa Inggeris, Bahasa Malaysia, Mandarin',
      beginner: 'Pemula',
      intermediate: 'Pertengahan',
      professional: 'Profesional',
      native: 'Ibunda',
      
      certifications: 'Pensijilan (Pilihan)',
      addCertifications: 'Tambah Pensijilan (Pilihan)',
      addCertification: 'Tambah Pensijilan',
      certificationPlaceholder: 'cth., AWS Certified Solutions Architect',
      
      achievements: 'Pencapaian (Pilihan)',
      addAchievements: 'Tambah Pencapaian (Pilihan)',
      addAchievement: 'Tambah Pencapaian',
      achievementPlaceholder: 'cth., Pekerja Tahunan 2023',
      
      extracurricularActivities: 'Aktiviti Kokurikulum (Pilihan)',
      addActivities: 'Tambah Aktiviti (Pilihan)',
      addActivity: 'Tambah Aktiviti',
      activity: 'Aktiviti',
      activityTitlePlaceholder: 'cth., Presiden Majlis Pelajar',
      activityDatePlaceholder: 'cth., 2022 - 2023',
      activityDetails: 'Butiran aktiviti dan pencapaian...',
      
      reference: 'Rujukan (Pilihan)',
      referenceExample: 'Contoh: Dr. Sarah Johnson, Pengurus Kanan di Tech Solutions Sdn Bhd, E-mel: sarah.johnson@techsolutions.com, Telefon: +60123456789',
      referenceNamePlaceholder: 'Contoh: Dr. Sarah Johnson',
      referencePositionPlaceholder: 'Contoh: Pengurus Kanan',
      referenceCompanyPlaceholder: 'Contoh: Tech Solutions Sdn Bhd',
      referenceContactPlaceholder: 'Contoh: sarah.johnson@techsolutions.com, +60123456789',
      
      submitResume: 'Hantar Resume',
      submitting: 'Menghantar...',
      resetForm: 'Set Semula Borang',
      resetConfirm: 'Adakah anda pasti untuk set semula borang? Semua data akan hilang.',
      addReference: 'Tambah Rujukan (Pilihan)',
      
      // Review Popup
      reviewTitle: 'Semak Resume Anda',
      backToEdit: 'Kembali ke Edit',
      notProvided: 'Tidak disediakan',
      name: 'Nama',
      jobTitleReview: 'Jawatan',
      phone: 'Telefon',
      aboutMeReview: 'Tentang Saya',
      educationReview: 'Pendidikan',
      degreeReview: 'Ijazah',
      institutionReview: 'Institusi',
      durationReview: 'Tempoh',
      workExperienceReview: 'Pengalaman Kerja',
      noWorkExperience: 'Tiada pengalaman kerja disediakan',
      skillsReview: 'Kemahiran',
      technicalSkillsReview: 'Kemahiran Teknikal',
      softSkillsReview: 'Kemahiran Insaniah',
      languagesReview: 'Bahasa',
      certificationsReview: 'Pensijilan',
      achievementsReview: 'Pencapaian',
      extracurricularActivitiesReview: 'Aktiviti Kokurikulum',
      referenceReview: 'Rujukan',
      positionReview: 'Jawatan',
      companyReview: 'Syarikat',
      contactReview: 'Hubungan'
    }
  }
};


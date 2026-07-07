export interface JobProfileData {
  aboutMe: string;
  technicalSkills: Array<{ skill: string; percentage: number }>;
  softSkills: Array<{ skill: string; percentage: number }>;
  strengths: string;
}

export async function generateJobProfile(jobTitle: string, language: 'English' | 'BM'): Promise<JobProfileData> {
  const response = await fetch('/api/generate-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_title: jobTitle, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate profile. Please try again.');
  }

  const data = await response.json();

  if (!data.aboutMe || !data.technicalSkills || !data.softSkills || !data.strengths) {
    throw new Error('Incomplete profile data returned from server.');
  }

  return {
    aboutMe: data.aboutMe,
    technicalSkills: Array.isArray(data.technicalSkills) ? data.technicalSkills.slice(0, 4) : [],
    softSkills: Array.isArray(data.softSkills) ? data.softSkills.slice(0, 4) : [],
    strengths: data.strengths,
  };
}

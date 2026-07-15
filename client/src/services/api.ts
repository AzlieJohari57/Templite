const API_BASE_URL = '';

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ResumeJobResponse {
  job_id: string;
}

export interface ResumeStatusResponse {
  status: JobStatus;
  pdf_url?: string;   // time-limited OSS download URL
  pdf_path?: string;  // legacy field, kept for compatibility
  drive_url?: string;
  error?: string;
}

export const uploadImage = async (imageFile: File, phone: string): Promise<{ image_url: string; drive_image_url?: string }> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('phone', phone);

  const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) throw new Error('Image upload failed');
  return response.json();
};

// Submit resume data — returns a job_id immediately (non-blocking).
export const submitResume = async (resumeData: any): Promise<ResumeJobResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/create-resume`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resumeData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to start resume generation');
  }

  return response.json();
};

// Poll for job progress. Call every 3 s until status is "done" or "failed".
export const getResumeStatus = async (jobId: string): Promise<ResumeStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/resume-status/${jobId}`, {
    mode: 'cors',
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to get job status');
  }

  return response.json();
};

// API base URL - adjust this based on your backend server
const API_BASE_URL = 'http://127.0.0.1:8000';

// Response type from create-resume endpoint
export interface CreateResumeResponse {
  success: boolean;
  message: string;
  pdf_path: string;
  html_path: string;
}

// Upload image and return URL (mock for now - implement actual upload if needed)
export const uploadImage = async (imageFile: File): Promise<{ image_url: string }> => {
  // For now, return a placeholder path
  // In production, you'd upload to a server or cloud storage
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return { image_url: data.image_url };
  } catch (error) {
    console.error('Image upload error:', error);
    // Return placeholder path if upload fails
    return { image_url: `../images/${Date.now()}.png` };
  }
};

// Submit resume data to create-resume endpoint
export const submitResume = async (resumeData: any): Promise<CreateResumeResponse> => {
  try {
    console.log('Submitting resume data:', JSON.stringify(resumeData, null, 2));

    const response = await fetch(`${API_BASE_URL}/create-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resumeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Resume creation failed');
    }

    const result: CreateResumeResponse = await response.json();
    console.log('Resume created successfully:', result);
    return result;
  } catch (error) {
    console.error('Resume submission error:', error);
    throw error;
  }
};
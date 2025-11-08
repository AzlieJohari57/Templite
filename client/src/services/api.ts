// Mock API service for resume submission
export const uploadImage = async (imageFile: File): Promise<{ gdrive_url: string }> => {
  // Simulate image upload to Google Drive
  const formData = new FormData();
  formData.append('image', imageFile);
  
  try {
    // Mock API call - in real implementation, this would upload to your backend
    // which then uploads to Google Drive
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Image upload failed');
    }
    
    // Mock response - in real implementation, your backend would return the actual Google Drive URL
    return {
      gdrive_url: `https://drive.google.com/open?id=${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    console.error('Image upload error:', error);
    // Return mock URL for demo purposes
    return {
      gdrive_url: `https://drive.google.com/open?id=mock_${Date.now()}`
    };
  }
};

export const submitResume = async (resumeData: any): Promise<void> => {
  try {
    const response = await fetch('/api/submit-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resumeData),
    });
    
    if (!response.ok) {
      throw new Error('Resume submission failed');
    }
    
    console.log('Resume submitted successfully:', resumeData);
  } catch (error) {
    console.error('Resume submission error:', error);
    // For demo purposes, we'll log the data that would be submitted
    console.log('Mock submission data:', resumeData);
    throw error;
  }
};
import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: Make sure this API key is created from Google AI Studio
// Visit: https://aistudio.google.com/app/apikey
const API_KEY = 'AIzaSyB58rtIMEK10k3lC6iREK3ZIQgSM4lkc5M';

if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
  console.error('❌ No valid API key configured!');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface JobProfileData {
  aboutMe: string;
  technicalSkills: Array<{ skill: string; percentage: number }>;
  softSkills: Array<{ skill: string; percentage: number }>;
  strengths: string;
}

// Cache for working model name
let workingModelName: string | null = null;

async function findWorkingModel(): Promise<string> {
  // Return cached model if we already found one
  if (workingModelName) {
    return workingModelName;
  }

  console.log('🔍 Testing available models with your API key...');
  console.log('📍 API Key (first 20 chars):', API_KEY.substring(0, 20) + '...');

  // First, test if API key works at all by listing models
  try {
    console.log('📋 Step 1: Checking if API key is valid...');
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    console.log('🔗 Testing URL:', testUrl.replace(API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(testUrl);
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid! Found models:', data.models?.length || 0);
      console.log('📋 Available models:', data.models?.map((m: any) => m.name) || []);
      
      // Try to use the first generateContent capable model
      const generativeModels = data.models?.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      ) || [];
      
      console.log('🎯 Models that support generateContent:', generativeModels.map((m: any) => m.name));
      
      if (generativeModels.length > 0) {
        // Prioritize free, fast models (in order of preference)
        const preferredModels = [
          'models/gemini-2.5-flash',
          'models/gemini-2.0-flash',
          'models/gemma-3-4b-it',  // User's requested model
          'models/gemma-3-1b-it',
          'models/gemini-flash-latest',
        ];
        
        // Try preferred models first
        for (const preferredModel of preferredModels) {
          const modelExists = generativeModels.find((m: any) => m.name === preferredModel);
          if (modelExists) {
            const modelId = preferredModel.replace('models/', '');
            console.log(`🧪 Testing preferred model: ${modelId}`);
            
            try {
              const model = genAI.getGenerativeModel({ model: modelId });
              const result = await model.generateContent('Test');
              const testResponse = await result.response;
              const testText = testResponse.text();
              
              if (testText) {
                workingModelName = modelId;
                console.log(`✅ SUCCESS! Model ${modelId} is working!`);
                return modelId;
              }
            } catch (testError: any) {
              const errorMsg = testError.message || '';
              if (errorMsg.includes('429') || errorMsg.includes('quota')) {
                console.log(`⚠️ ${modelId}: Quota exceeded, trying next model...`);
              } else {
                console.log(`⚠️ ${modelId} test failed:`, errorMsg.substring(0, 100));
              }
              continue; // Try next model
            }
          }
        }
        
        // If none of the preferred models worked, try all available models
        console.log('🔄 Trying all available models...');
        for (const genModel of generativeModels.slice(0, 10)) {  // Limit to first 10 to avoid too many requests
          const modelId = genModel.name.replace('models/', '');
          console.log(`🧪 Testing: ${modelId}`);
          
          try {
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent('Test');
            const testResponse = await result.response;
            const testText = testResponse.text();
            
            if (testText) {
              workingModelName = modelId;
              console.log(`✅ SUCCESS! Model ${modelId} is working!`);
              return modelId;
            }
          } catch (testError: any) {
            const errorMsg = testError.message || '';
            if (errorMsg.includes('429') || errorMsg.includes('quota')) {
              console.log(`⚠️ ${modelId}: Quota exceeded, skipping...`);
              continue;
            } else {
              console.log(`⚠️ ${modelId} failed:`, errorMsg.substring(0, 80));
            }
          }
        }
      } else {
        console.error('❌ No models support generateContent method!');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API key validation failed!');
      console.error('Status:', response.status, response.statusText);
      console.error('Error response:', errorText);
      
      // Parse error details
      try {
        const errorData = JSON.parse(errorText);
        console.error('📋 Error details:', errorData);
      } catch (e) {
        // Not JSON
      }
    }
  } catch (listError: any) {
    console.error('❌ Network error while checking API:', listError.message);
    console.error('Full error:', listError);
  }

  // Final fallback: Try common model names with correct format
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash', 
    'gemma-3-4b-it',
    'gemma-3-1b-it',
    'gemini-flash-latest',
  ];

  console.log('🔄 Final attempt: Trying fallback models...');

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      if (response && response.text()) {
        console.log(`✅ Success! Using model: ${modelName}`);
        workingModelName = modelName;
        return modelName;
      }
    } catch (error: any) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.log(`⚠️ ${modelName}: Quota exceeded`);
      } else {
        console.log(`❌ ${modelName} failed:`, errorMsg.substring(0, 80));
      }
      continue;
    }
  }

  throw new Error(
    '❌ No working AI models found!\n\n' +
    '🔧 Please check:\n' +
    '1. API key is created from Google AI Studio (https://aistudio.google.com/app/apikey)\n' +
    '2. API key is valid and not restricted\n' +
    '3. Generative Language API is enabled\n' +
    '4. You have available quota\n\n' +
    'Current API key starts with: ' + API_KEY.substring(0, 20) + '...'
  );
}

export async function generateJobProfile(jobTitle: string, language: 'English' | 'BM'): Promise<JobProfileData> {
  try {
    // Find a working model first
    const modelName = await findWorkingModel();
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,  // Increased to allow complete responses
        responseMimeType: 'application/json',  // Request JSON format
      },
    });

    const prompt = language === 'English' 
      ? `You are a professional resume writer. Generate a resume profile for a ${jobTitle} position.

Respond with ONLY a JSON object (no markdown, no code blocks, just the JSON):

{
  "aboutMe": "A compelling 2-3 sentence About Me section highlighting relevant experience and passion for the role",
  "technicalSkills": [
    {"skill": "Relevant technical skill 1", "percentage": 75},
    {"skill": "Relevant technical skill 2", "percentage": 80},
    {"skill": "Relevant technical skill 3", "percentage": 70},
    {"skill": "Relevant technical skill 4", "percentage": 85}
  ],
  "softSkills": [
    {"skill": "Communication", "percentage": 85},
    {"skill": "Teamwork", "percentage": 80},
    {"skill": "Problem Solving", "percentage": 75},
    {"skill": "Leadership", "percentage": 70}
  ],
  "strengths": "A 2-3 sentence paragraph describing key strengths for this role"
}

Make the skills specific and relevant to ${jobTitle}.`
      : `Anda adalah penulis resume profesional. Jana profil resume untuk jawatan ${jobTitle}.

Balas dengan HANYA objek JSON (tiada markdown, tiada blok kod, hanya JSON):

{
  "aboutMe": "2-3 ayat Tentang Saya yang menonjolkan pengalaman dan minat yang berkaitan",
  "technicalSkills": [
    {"skill": "Kemahiran teknikal berkaitan 1", "percentage": 75},
    {"skill": "Kemahiran teknikal berkaitan 2", "percentage": 80},
    {"skill": "Kemahiran teknikal berkaitan 3", "percentage": 70},
    {"skill": "Kemahiran teknikal berkaitan 4", "percentage": 85}
  ],
  "softSkills": [
    {"skill": "Komunikasi", "percentage": 85},
    {"skill": "Kerja Berpasukan", "percentage": 80},
    {"skill": "Penyelesaian Masalah", "percentage": 75},
    {"skill": "Kepimpinan", "percentage": 70}
  ],
  "strengths": "2-3 ayat perenggan yang menerangkan kekuatan utama untuk peranan ini"
}

Buat kemahiran khusus dan berkaitan dengan ${jobTitle}.`;

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Get the full response text
    let text = '';
    try {
      text = response.text();
    } catch (e) {
      // If text() fails, try to get it from candidates
      if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Could not extract text from AI response');
      }
    }
    
    console.log('Gemini response (full):', text);
    console.log('Response length:', text.length);
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();
    
    // Try to find complete JSON object
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    
    // If no match or incomplete, try to repair the JSON
    if (!jsonMatch || !jsonMatch[0].endsWith('}')) {
      console.warn('Incomplete JSON detected, attempting to repair...');
      
      // Find the start of JSON
      const startIdx = cleanedText.indexOf('{');
      if (startIdx === -1) {
        console.error('No JSON found in response:', cleanedText);
        throw new Error('Invalid response format from AI - no JSON object found');
      }
      
      // Try to construct valid JSON from incomplete response
      let jsonStr = cleanedText.substring(startIdx);
      
      // Count braces to see if we need to close
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      
      // Add missing closing braces
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        jsonStr += '}';
      }
      
      // Remove any trailing incomplete text
      try {
        JSON.parse(jsonStr);
        cleanedText = jsonStr;
        jsonMatch = [jsonStr];
      } catch (parseErr) {
        console.error('Could not repair JSON:', jsonStr);
        throw new Error('AI response was incomplete. Please try again.');
      }
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!data.aboutMe || !data.technicalSkills || !data.softSkills || !data.strengths) {
      throw new Error('Incomplete data from AI');
    }
    
    // Validate and return the data
    return {
      aboutMe: data.aboutMe || '',
      technicalSkills: Array.isArray(data.technicalSkills) ? data.technicalSkills.slice(0, 4) : [],
      softSkills: Array.isArray(data.softSkills) ? data.softSkills.slice(0, 4) : [],
      strengths: data.strengths || ''
    };
  } catch (error: any) {
    console.error('Detailed error generating profile:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('API key error. Please check your Gemini API configuration.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Failed to generate profile: ${error.message || 'Unknown error'}`);
    }
  }
}


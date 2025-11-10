import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyA5fphM-KGBPL9k8v58_PXeZP-vDZJktrE';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function listAvailableModels() {
  try {
    console.log('Fetching available models...');
    
    // Try to use a working model first
    const workingModels = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro', 
      'models/gemini-1.5-flash',
      'gemma-2-2b-it',
      'gemma-2-9b-it',
      'gemma-2-27b-it',
      'models/gemma-2-2b-it',
      'models/gemma-2-9b-it',
      'models/gemma-2-27b-it',
    ];
    
    for (const modelName of workingModels) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`✅ ${modelName} - WORKS!`);
        return modelName;
      } catch (error: any) {
        console.log(`❌ ${modelName} - ${error.message}`);
      }
    }
    
    throw new Error('No working models found');
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
}


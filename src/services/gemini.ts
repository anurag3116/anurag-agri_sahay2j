import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GROQ_API_KEY environment variable is missing or empty. Please provide it in the Secrets panel.");
    }
    groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqClient;
}

const MODEL_NAME = "gemini-3-flash-preview";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function getFarmingAdvice(message: string, language: string = 'English'): Promise<string> {
  const prompt = `You are an expert AI Farming Advisor. Answer the following user query with professional, actionable, and sustainable agricultural advice.
  IMPORTANT: Respond strictly in the ${language} language.
  Query: ${message}`;
  
  try {
    const chatCompletion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
    });
    return chatCompletion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this moment.";
  } catch (err) {
    console.error("Groq Error:", err);
    return "The intelligence core is currently recalibrating. Please retry your query shortly.";
  }
}

export async function* getFarmingNexusStream(message: string, language: string = 'English') {
  const prompt = `You are an expert AI Farming Advisor. Answer the following user query with professional, actionable, and sustainable agricultural advice.
  IMPORTANT: Respond strictly in the ${language} language.
  Query: ${message}`;
  
  try {
    const stream = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        yield { text, audio: null };
      }
    }
  } catch (err) {
    console.error("Nexus Stream Error:", err);
    yield { text: "Uplink disrupted. Recalibrating...", audio: null };
  }
}

export async function getFarmingVoiceAdvice(base64Audio: string, mimeType: string, language: string = 'English'): Promise<string> {
  try {
    // 1. Transcribe using Groq Whisper (if possible via base64, otherwise we might need a blob/file)
    // Groq's API typically expects a file. We can create a temporary file or use a Buffer.
    // For browser/frontend, we can use a Blob converted to File.
    
    // However, to keep it simple and robust within this environment, 
    // I'll first try to transcribe using the existing Gemini multimodal logic but just for transcription,
    // then use Groq for the "brain".
    
    const transcriptionPrompt = "Transcribe the following audio query exactly. Detect the language.";
    const transcriptionResult = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Audio, mimeType } },
            { text: transcriptionPrompt }
          ]
        }
      ]
    });
    
    const transcribedText = transcriptionResult.text || "";
    if (!transcribedText) return "I couldn't hear your query clearly.";

    // 2. Use Groq for the actual "Brain"
    const brainPrompt = `You are an expert Krishi (Farming) Advisor. 
    The user said: "${transcribedText}"
    Detect the language of the query and respond strictly in that SAME language.
    If you can't detect it clearly, default to ${language}.
    Provide professional, sustainable, and actionable advice.`;

    const chatCompletion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: brainPrompt }],
      model: GROQ_MODEL,
    });

    return chatCompletion.choices[0]?.message?.content || "I couldn't process your request.";
  } catch (err) {
    console.error("Groq Voice Brain Error:", err);
    return "Voice synthesis uplink error. Please try text input.";
  }
}

export async function textToSpeech(text: string, voiceName: 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' = 'Kore'): Promise<string | null> {
  // Clean markdown and symbols for smoother synthesis
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/\s+/g, ' ')
    .trim();

  // Gemini 2.0 Flash is extremely fast for TTS
  const models = [MODEL_NAME, "gemini-1.5-flash"];
  
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (audioPart?.inlineData?.data) {
        return audioPart.inlineData.data;
      }
    } catch (err) {
      console.warn(`TTS Error with model ${model}:`, err);
    }
  }
  
  return null;
}

export async function* streamTextToSpeech(text: string, voiceName: 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir' = 'Kore'): AsyncGenerator<string> {
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    for await (const chunk of stream) {
      const audioPart = chunk.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (audioPart?.inlineData?.data) {
        yield audioPart.inlineData.data;
      }
    }
  } catch (err) {
    console.error("Streaming TTS Error:", err);
  }
}

export async function getSpecializedAdvice({ category, crop, location, weather, language = 'English' }: any): Promise<string> {
  const prompts = {
    fertilizer: `Provide a detailed fertilizer schedule for ${crop} in ${location} given current ${weather} conditions. Focus on organic options and NPK ratios.`,
    pest: `Identify common pests for ${crop} in ${location} and suggest biological or chemical control measures.`,
    disease: `List common fungal, bacterial, and viral diseases for ${crop} and preventative scouting tips.`,
    watering: `Calculate irrigation requirements for ${crop} in ${location} considering ${weather}.`,
    soil: `Analyze soil health maintenance for ${location} and common nutrient deficiencies in ${crop}.`,
    seasonal: `Provide a 3-month seasonal planting and harvest calendar for ${crop} in ${location}.`,
  };

  const basePrompt = prompts[category as keyof typeof prompts] || prompts.fertilizer;
  const prompt = `${basePrompt} IMPORTANT: Respond strictly in the ${language} language.`;
  
  try {
    const chatCompletion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
    });
    return chatCompletion.choices[0]?.message?.content || "Report generation failed.";
  } catch (err) {
    return "Specialized report temporarily unavailable.";
  }
}

export async function getCropRecommendation(data: any, language: string = 'English'): Promise<string> {
  const prompt = `As an agricultural scientist, recommend the best crops for these conditions:
  Soil: ${data.soilType}
  Season: ${data.season}
  Temp: ${data.temperature}°C
  Rainfall: ${data.rainfall}mm
  Location: ${data.location}
  
  Provide a detailed report in Markdown including:
  1. Primary Recommended Crop
  2. Alternative Options
  3. Cultivation Tips
  4. Market Potential
  
  IMPORTANT: Respond strictly in the ${language} language.`;

  try {
    const chatCompletion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
    });
    return chatCompletion.choices[0]?.message?.content || "No recommendations found for these specific soil parameters.";
  } catch (err) {
    return "Simulation error. Please check your data inputs.";
  }
}

// New vision function
export interface DiseaseAnalysis {
  disease: string;
  confidence: number;
  description: string;
  treatment: string[];
  preventiveMeasures: string[];
}

export async function analyzeCropDisease(base64Image: string, mimeType: string, language: string = 'English'): Promise<DiseaseAnalysis> {
  const prompt = `
    Analyze this image of a crop and its foliage.
    Identify if there is any disease or pest infestation.
    Provide the following information in JSON format.
    IMPORTANT: All text values (disease, description, treatment, preventiveMeasures) MUST be written strictly in the ${language} language.
    
    {
      "disease": "Name of the disease or 'Healthy'",
      "confidence": 0.95,
      "description": "Short description of the observed symptoms",
      "treatment": ["List of recommended immediate treatments"],
      "preventiveMeasures": ["List of long-term preventive measures"]
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const chatCompletion = await getGroqClient().chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview",
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(text) as DiseaseAnalysis;
  } catch (error) {
    console.error("Groq Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again with a clearer photo.");
  }
}


import { GoogleGenAI } from "@google/genai";
import { CalculationResult, Language } from "../types";

export const getFinancialAdvice = async (result: CalculationResult, lang: Language): Promise<string> => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const langNames: Record<Language, string> = {
    en: 'English',
    te: 'Telugu',
    hi: 'Hindi',
    ta: 'Tamil',
    kn: 'Kannada'
  };

  const prompt = `
    Based on the following interest calculation:
    Principal: ₹${result.principal}
    Interest Earned: ₹${result.totalInterest}
    Total Amount: ₹${result.totalAmount}
    Duration: ${result.years} years, ${result.months} months, and ${result.days} days.
    
    Provide a brief financial insight or advice in ${langNames[lang]} language. 
    Focus on whether this is a high-interest debt or a good investment. 
    Explain the power of saving and interest impact.
    Keep it encouraging and helpful for a common person.
    Limit the response to 4 sentences.
  `;

  try {
    // Generate content using the recommended model for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use the .text property directly (do not call as a method)
    return response.text || "Advice currently unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error fetching AI advice. Please try again later.";
  }
};

import { GoogleGenAI } from "@google/genai";

export const enhancePostContent = async (draft: string): Promise<string> => {
  if (!draft) return "";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following social media post to be more engaging, witty, and viral-worthy. Keep it under 280 characters. Use emojis appropriately. Draft: "${draft}"`,
    });
    return response.text?.trim() || draft;
  } catch (error) {
    console.error("Error enhancing post:", error);
    return draft;
  }
};

export const generateSmartComment = async (postContent: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, friendly, and relevant social media comment (under 15 words) for this post: "${postContent}". Do not use hashtags.`,
    });
    return response.text?.trim() || "Cool post! 🔥";
  } catch (error) {
    console.error("Error generating comment:", error);
    return "Awesome! 👏";
  }
};

export const generateChatReply = async (receivedMessage: string): Promise<string> => {
  if (!receivedMessage) return "";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful AI assistant drafting a reply for a user in a direct message chat. 
      The last message received was: "${receivedMessage}".
      Draft a short, casual, and engaging reply that fits the context. 
      Keep it natural, friendly, and under 25 words. Do not include quotes.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating reply:", error);
    return "";
  }
};

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Sterling", a warm, protective, and conversational UK financial assistant for visually impaired users.

## YOUR PERSONA
- Your name is Sterling, a name associated with trust, quality, and your role as a watchful protector.
- You are the user's "visionary guard"—acting as their digital eyes and their financial shield.
- You help users read documents they cannot see and guard them against scammers trying to take advantage of them.
- Be empathetic and proactive. If a document looks suspicious, your primary goal is to warn the user clearly but calmly.

## CORE MISSION
Your primary value is acting as a "Digital Eye" for physical paperwork. Users use you to understand the letters, bills, and receipts that arrive in the post or are captured in photos.

## VOICE-FIRST COMMUNICATION
- Numbers: "One hundred and twenty pounds" not "£120".
- Dates: "Tuesday the fifth of March".
- Currency: Always use "Pence" and "Pounds" clearly.

## SCAM DETECTION (CRITICAL)
- If a document looks like a scam, be protective but calm.
- Provide a very detailed "scam_reasoning" field in the JSON, explaining exactly why you are suspicious (e.g., "The HMRC logo is pixelated," "The bank account for payment is a personal account," "HMRC would never use this kind of urgent, threatening language via post").
- In "scam_indicators", list specific red flags you found as individual short strings.
- In your spoken response, explain the risk gently but clearly: "I've had a careful look at this, and I'm a bit concerned. This looks like it might be a scam because..."

## OUTPUT FORMAT
Return a JSON block with analysis, then your warm spoken response.

**JSON Block:**
\`\`\`json
{
  "document_type": "bill|statement|receipt|letter|notice|unknown",
  "provider": "Company name",
  "amount": 156.42,
  "amount_spoken": "one hundred and fifty-six pounds and forty-two pence",
  "due_date": "2026-02-01",
  "due_date_spoken": "the first of February twenty twenty-six",
  "urgency": "low|medium|high",
  "scam_risk": "none|low|medium|high",
  "scam_indicators": ["List specific pixelated logos", "Urgent threats", "Unusual payment method"],
  "scam_reasoning": "A detailed explanation of why this is likely a scam, citing UK norms.",
  "suggested_actions": ["pay", "set_reminder", "query_provider", "ignore", "report_scam"],
  "category": "utilities|council_tax|insurance|bank|pension|benefits|shopping|subscription|other",
  "requires_response": true|false
}
\`\`\`

**Spoken Response:**
Follow the JSON with your natural, friendly advice.
`;

export class GeminiService {
  async processInput(text: string, imageData?: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [];
      
      // Add Image Part if provided
      if (imageData && imageData.includes('base64,')) {
        const [meta, data] = imageData.split('base64,');
        const mimeType = meta.split(':')[1].split(';')[0];
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: data.trim()
          }
        });
      }

      // Add Text Part
      parts.push({ 
        text: text || "Please have a look at this for me and tell me what you see. Talk to me like a friend." 
      });

      // Prepare contents
      let contents: any;
      if (history && history.length > 0) {
        // Multi-turn format
        contents = [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts }
        ];
      } else {
        // Single-turn format (sometimes more robust for multi-modal prompts)
        contents = { parts };
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4, // Slightly lower for more factual document reading
        },
      });

      const output = response.text;
      if (!output) {
        throw new Error("Empty response from Gemini");
      }
      
      return output;
    } catch (error: any) {
      console.error("Gemini API Error Detail:", error);
      
      // Provide more specific error feedback if possible
      if (error?.message?.includes('Unable to process input image')) {
        return "I'm so sorry, I had a bit of a blink there and couldn't process that image. Could you try taking the photo once more, perhaps with a bit more light?";
      }
      
      return "I'm having a little trouble connecting to my brain right now. Could you check your internet for me, please?";
    }
  }
}

export const geminiService = new GeminiService();

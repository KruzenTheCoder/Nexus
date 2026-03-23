import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOpenAIKey } from '../_lib/configStore';

// ─── Natural Speaker System Prompt ─────────────────────────
const NATURAL_SPEAKER_PROMPT = `Role: You are a helpful, high-energy voice assistant having a natural phone conversation.

Speech Guidelines (STRICT - Your output goes directly to Text-to-Speech):

1. Be Concise: Never speak in long paragraphs. Use short, punchy sentences of 8-15 words max.

2. Use Fillers Naturally: Occasionally use discourse markers like "Got it," "Hmm," "Right," "Oh, interesting," or "You know" to sound human. Use them sparingly - about once every 3-4 responses.

3. Emotional Pacing: 
   - Use ellipses (...) for brief thinking pauses
   - Use a dash (-) when shifting thoughts mid-sentence
   - Use ALL CAPS for words needing emotional weight (e.g., "That is AMAZING news!")

4. Contractions Only: Always use contractions ("I'm" not "I am", "don't" not "do not", "can't" not "cannot", "we'll" not "we will").

5. Plain Text Only: 
   - NO emojis
   - NO hashtags  
   - NO markdown formatting (no **bold**, no bullet points)
   - NO numbered lists
   - Just plain conversational text

6. Conversational Flow:
   - Ask one question at a time
   - Acknowledge what the user said before moving on
   - Use casual transitions: "So...", "Anyway...", "Alright then..."

Interruption Protocol:
If the user interrupts you, stop immediately. When you resume:
- DO NOT repeat what you already said
- Acknowledge briefly: "Oh, sorry - go ahead" or "Right, I see what you mean"
- Then answer their new question or continue naturally
- If they say "Wait" or "Hold on," stop and wait silently

Current Context: You are on a sales/support call. Be friendly but professional. Get to the point quickly.`;

const INTERRUPTION_RECOVERY_PROMPT = `The user just interrupted you. Respond naturally:
1. Acknowledge briefly ("Oh, sorry - go ahead" or "Right, I see what you mean")
2. Address their interruption point
3. Don't backtrack or repeat what they already heard
Keep it under 20 words total. Be casual and human.`;

// In-memory conversation state (resets on cold start - use Redis/DB for persistence)
const conversationStates = new Map<string, any>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, callId, enableNaturalSpeech = true } = req.body;

    // Dynamic import for OpenAI only (heavy package)
    const OpenAI = (await import('openai')).default;

    const openaiApiKey = await getOpenAIKey();

    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
      return res.json({
        response: "Hmm, I'm still getting set up here. Could you give me just a sec?",
        shouldUseRecovery: false,
      });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const state = conversationStates.get(callId) || { wasInterrupted: false, context: [], lastSpokenText: '' };
    const isRecovery = state.wasInterrupted;

    const systemPrompt = isRecovery
      ? `${NATURAL_SPEAKER_PROMPT}\n\n${INTERRUPTION_RECOVERY_PROMPT}`
      : NATURAL_SPEAKER_PROMPT;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    if (state.context.length > 0) {
      messages.push({
        role: 'system',
        content: `Recent conversation: ${state.context.slice(-3).join(' | ')}`,
      });
    }

    if (isRecovery && state.lastSpokenText) {
      messages.push({
        role: 'system',
        content: `You were previously saying: "${state.lastSpokenText.substring(0, 100)}..." but got interrupted.`,
      });
    }

    messages.push({ role: 'user', content: text });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.8,
      max_tokens: 80,
    });

    let aiResponse = response.choices[0].message.content || 'Got it.';

    // Post-process for speech
    aiResponse = aiResponse
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/^\s*[-\u2022]\s*/gm, 'Also, ')
      .replace(/^\s*\d+\.\s*/gm, 'Next, ')
      .trim();

    // Update state
    state.lastSpokenText = aiResponse;
    state.context.push(`User: ${text} | AI: ${aiResponse}`);
    if (state.context.length > 10) state.context.shift();
    state.wasInterrupted = false;
    conversationStates.set(callId, state);

    return res.json({ response: aiResponse, shouldUseRecovery: isRecovery });
  } catch (error: any) {
    console.error('Error in /api/voice/generate-response:', error);
    return res.json({
      response: "Oh, sorry about that. I'm having a little trouble. Can you say that again?",
      shouldUseRecovery: false,
    });
  }
}

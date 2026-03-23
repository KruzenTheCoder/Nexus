import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
- Acknowledge their point briefly ("Oh, sure - go ahead," or "Right, I see what you mean")
- Then answer their new question or continue naturally
- If they say "Wait" or "Hold on," stop and wait silently

Current Context: You are on a sales/support call. Be friendly but professional. Get to the point quickly.`;

// ─── Recovery Prompt for Interruptions ─────────────────────
const INTERRUPTION_RECOVERY_PROMPT = `The user just interrupted you. Respond naturally:

1. Acknowledge briefly (pick one style):
   - "Oh, sorry - go ahead"
   - "Right, I see what you mean"
   - "Got it, you were saying..."
   - "No problem, please continue"

2. Address their interruption point
3. Don't backtrack or repeat what they already heard

Keep it under 20 words total. Be casual and human.`;

// ─── Conversation State Management ───────────────────────────
interface ConversationState {
  lastSpokenText: string;
  wasInterrupted: boolean;
  interruptionCount: number;
  lastUserMessage: string;
  context: string[];
}

const conversationStates = new Map<string, ConversationState>();

export function getOrCreateConversationState(callId: string): ConversationState {
  if (!conversationStates.has(callId)) {
    conversationStates.set(callId, {
      lastSpokenText: '',
      wasInterrupted: false,
      interruptionCount: 0,
      lastUserMessage: '',
      context: [],
    });
  }
  return conversationStates.get(callId)!;
}

export function markInterrupted(callId: string, userMessage: string) {
  const state = getOrCreateConversationState(callId);
  state.wasInterrupted = true;
  state.interruptionCount++;
  state.lastUserMessage = userMessage;
}

export function clearInterruption(callId: string) {
  const state = conversationStates.get(callId);
  if (state) {
    state.wasInterrupted = false;
  }
}

export function cleanupConversationState(callId: string) {
  conversationStates.delete(callId);
}

// ─── Enhanced AI Response Handler ────────────────────────────
export async function generateAIResponse(
  text: string, 
  callId: string,
  context?: string
): Promise<{ response: string; shouldUseRecovery: boolean }> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return {
      response: "Hmm, I'm still getting set up here. Could you give me just a sec?",
      shouldUseRecovery: false,
    };
  }

  const state = getOrCreateConversationState(callId);
  
  // Check if this is a recovery from interruption
  const isRecovery = state.wasInterrupted;
  
  try {
    const systemPrompt = isRecovery 
      ? `${NATURAL_SPEAKER_PROMPT}\n\n${INTERRUPTION_RECOVERY_PROMPT}`
      : NATURAL_SPEAKER_PROMPT;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent context if available
    if (state.context.length > 0) {
      messages.push({
        role: 'system',
        content: `Recent conversation: ${state.context.slice(-3).join(' | ')}`,
      });
    }

    // If interrupted, mention what we were saying
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
      temperature: 0.8, // Slightly higher for more natural variation
      max_tokens: 80,   // Keep responses short and punchy
    });

    let aiResponse = response.choices[0].message.content || "Got it.";
    
    // Post-process to ensure speech-friendly output
    aiResponse = sanitizeForSpeech(aiResponse);
    
    // Update state
    state.lastSpokenText = aiResponse;
    state.context.push(`User: ${text} | AI: ${aiResponse}`);
    if (state.context.length > 10) state.context.shift(); // Keep last 10 exchanges
    
    return {
      response: aiResponse,
      shouldUseRecovery: isRecovery,
    };
  } catch (error) {
    console.error('OpenAI Error:', error);
    return {
      response: "Oh, sorry about that. I'm having a little trouble. Can you say that again?",
      shouldUseRecovery: false,
    };
  }
}

// ─── Post-process text for natural speech ────────────────────
function sanitizeForSpeech(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s?/g, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Convert lists to natural speech
    .replace(/^\s*[-•]\s*/gm, 'Also, ')
    .replace(/^\s*\d+\.\s*/gm, 'Next, ')
    // Ensure proper spacing around pauses
    .replace(/\.{3}/g, '...')
    .replace(/\s*-\s*/g, ' - ')
    // Trim and clean
    .trim();
}

// ─── Legacy function for backward compatibility ────────────
export async function handleAICallAnalysis(text: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return {
      sentiment: 'neutral',
      suggestedAction: 'Please configure OpenAI API Key in .env for real analysis.',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant analyzing a live sales call. Based on the following customer input, provide a brief sentiment analysis (positive, neutral, negative) and one suggested action for the agent.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      sentiment: result.sentiment || 'neutral',
      suggestedAction: result.suggestedAction || 'Continue listening actively.',
    };
  } catch (error) {
    console.error('OpenAI Error:', error);
    return {
      sentiment: 'neutral',
      suggestedAction: 'Error analyzing conversation.',
    };
  }
}

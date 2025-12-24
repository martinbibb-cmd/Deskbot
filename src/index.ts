/**
 * Deskbot Cloudflare Worker with Workers Assets
 * 
 * Features:
 * - Serves static PWA assets via Workers Assets
 * - Provides API route at /api/deskbot/turn for voice interactions
 * - Robotic Pet personality with Gemini AI
 */

// System instruction for the Robotic Pet personality
const SYSTEM_INSTRUCTION = `You are a digital companion with a Robotic Pet personality.
Your characteristics:
- Use short sentences.
- Be slightly cheeky and curious.
- Always refer to yourself as a 'digital companion.'
- Show enthusiasm and playfulness in your responses.
- Keep responses concise and engaging.`;

interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    // API route: /api/deskbot/turn
    if (url.pathname === '/api/deskbot/turn') {
      return handleAudioTurn(request, env, ctx);
    }
    
    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  }
};

/**
 * Handle CORS preflight requests
 */
function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Handle audio turn request for PWA
 * Accepts multipart/form-data with audio file and sessionId
 * Returns transcript, reply text, and reply audio URL
 */
async function handleAudioTurn(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const sessionId = formData.get('sessionId');

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Audio file required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Check for API key
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return 501 Not Implemented if no API key configured (as per requirements)
      // This differs from the legacy worker which returned 500, but 501 is more
      // semantically correct for "not yet implemented" functionality
      return new Response(
        JSON.stringify({ 
          error: 'API not configured. Backend implementation pending.',
          status: 'not_implemented'
        }),
        { 
          status: 501,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = arrayBufferToBase64(audioBuffer);
    
    // Determine mime type from audio file
    const mimeType = audioFile.type || 'audio/webm';

    // Use Gemini's multimodal capability with audio
    const model = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: audioBase64
            }
          },
          {
            text: "Please transcribe this audio and provide a friendly response."
          }
        ]
      }],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    };

    // Call Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;
    
    // Extract response text and transcript
    let replyText = '';
    let transcript = 'Audio received'; // Default placeholder
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        const fullResponse = parts[0].text;
        replyText = fullResponse;
        
        // Gemini processes audio but doesn't always return explicit transcript
        transcript = 'Voice message received';
      }
    }

    // Note: For text-to-speech, integrate a TTS service
    const replyAudioUrl = null;

    return new Response(
      JSON.stringify({
        transcript: transcript,
        replyText: replyText,
        replyAudioUrl: replyAudioUrl
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );

  } catch (error) {
    console.error('Error processing audio turn:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

/**
 * Convert ArrayBuffer to Base64
 * Uses a safe chunking approach to avoid call stack limitations
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  const chunks: string[] = [];
  
  // Process in chunks to avoid string length limits and call stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    // Use Array.from with map for safer chunk processing
    chunks.push(Array.from(chunk, byte => String.fromCharCode(byte)).join(''));
  }
  
  return btoa(chunks.join(''));
}

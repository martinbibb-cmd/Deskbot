/**
 * Gemini Assistant Chatbot - Cloudflare Worker
 * 
 * Features:
 * - Robotic Pet personality with system instructions
 * - Error handling for busy Gemini API
 * - Multimodal capability (Base64 images + text)
 * - Streaming responses for real-time frontend updates
 */

// System instruction for the Robotic Pet personality
// This is used in the Gemini API's systemInstruction field
const SYSTEM_INSTRUCTION = `You are a digital companion with a Robotic Pet personality.
Your characteristics:
- Use short sentences.
- Be slightly cheeky and curious.
- Always refer to yourself as a 'digital companion.'
- Show enthusiasm and playfulness in your responses.
- Keep responses concise and engaging.`;

/**
 * Handle incoming requests
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Check if this is an audio turn request
    const url = new URL(request.url);
    if (url.pathname === '/api/deskbot/turn') {
      return handleAudioTurn(request, env, ctx);
    }

    try {
      // Parse request body
      const body = await request.json();
      const { messages, image } = body;

      // Validate input
      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request: messages array required' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check for API key
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Prepare the request payload for Gemini
      const geminiPayload = {
        contents: buildContents(messages, image),
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Make streaming request to Gemini API with retry logic
      const response = await fetchGeminiWithRetry(apiKey, geminiPayload);

      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });

    } catch (error) {
      console.error('Error processing request:', error);
      
      // Handle specific error cases
      if (error.message.includes('API busy')) {
        return new Response(
          JSON.stringify({ 
            error: 'The AI is currently busy. Please try again in a moment.',
            retryAfter: 5 
          }),
          { 
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '5'
            }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Build contents array for Gemini API, supporting multimodal input
 */
function buildContents(messages, image) {
  const contents = [];

  for (const message of messages) {
    if (message.role === 'system') {
      // System instructions are handled separately in Gemini
      continue;
    }

    const parts = [];

    // Add text part
    if (message.content) {
      parts.push({ text: message.content });
    }

    // Add image part if present (multimodal support)
    if (message.image) {
      parts.push({
        inline_data: {
          mime_type: message.image.mimeType || "image/jpeg",
          data: message.image.data // Base64 encoded image data
        }
      });
    }

    // Only add to contents if parts array is not empty
    if (parts.length > 0) {
      contents.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: parts
      });
    }
  }

  // Add image from top-level if provided (for single image with latest message)
  if (image && contents.length > 0) {
    const lastContent = contents[contents.length - 1];
    if (lastContent.role === 'user') {
      lastContent.parts.push({
        inline_data: {
          mime_type: image.mimeType || "image/jpeg",
          data: image.data
        }
      });
    }
  }

  return contents;
}

/**
 * Fetch from Gemini API with retry logic for handling busy API
 */
async function fetchGeminiWithRetry(apiKey, payload, maxRetries = 3) {
  const model = "gemini-1.5-flash"; // Fast model for streaming
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`;
  const url = `${baseUrl}?key=${apiKey}&alt=sse`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle rate limiting or busy API
      if (response.status === 429 || response.status === 503) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff: wait 1s, 2s, 4s...
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          throw new Error('API busy - maximum retry attempts reached');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      return response;

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Failed to fetch from Gemini API after retries');
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
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
async function handleAudioTurn(request, env, ctx) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');
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
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
    const response = await fetch(url, {
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

    const data = await response.json();
    
    // Extract response text
    let replyText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        replyText = parts[0].text;
      }
    }

    // For transcript, we'll extract it from the response or use placeholder
    // (Gemini processes audio but doesn't always return explicit transcript)
    const transcript = "Audio received";

    // Note: For text-to-speech, you would need to integrate a TTS service
    // For now, we return null for replyAudioUrl
    // You could integrate Google Cloud TTS or another service here
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
        details: error.message
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
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

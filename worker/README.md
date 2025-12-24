# Gemini Assistant Chatbot - Cloudflare Worker

A Cloudflare Worker that provides a Gemini-powered chatbot API with a "Robotic Pet" personality, multimodal support, and streaming responses.

## Features

✨ **Robotic Pet Personality**: The assistant has a unique personality with these characteristics:
- Uses short sentences
- Slightly cheeky and curious
- Refers to itself as a 'digital companion'
- Enthusiastic and playful responses

🔄 **Streaming Responses**: Real-time response streaming using Server-Sent Events (SSE) for a smooth user experience

🖼️ **Multimodal Capability**: Supports both text and Base64-encoded images as input

🛡️ **Error Handling**: Robust error handling with automatic retry logic for busy API scenarios

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Cloudflare account
- A Google Gemini API key

### Installation

1. **Install dependencies**:
   ```bash
   cd worker
   npm install
   ```

2. **Configure your Gemini API key**:
   
   Option A: Update `wrangler.toml`:
   ```toml
   [vars]
   GEMINI_API_KEY = "your-api-key-here"
   ```

   Option B: Use Wrangler secrets (recommended for production):
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```

4. **Deploy to Cloudflare**:
   ```bash
   npm run deploy
   ```

## API Usage

### Endpoint
```
POST https://your-worker.workers.dev/
```

### Request Format

#### Text-only request:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello! What are you?"
    }
  ]
}
```

#### Multimodal request (text + image):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's in this image?"
    }
  ],
  "image": {
    "mimeType": "image/jpeg",
    "data": "base64-encoded-image-data-here"
  }
}
```

#### Conversation with history:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    },
    {
      "role": "assistant",
      "content": "Hi there! I'm your digital companion. What brings you here today?"
    },
    {
      "role": "user",
      "content": "Tell me a fun fact"
    }
  ]
}
```

### Response Format

The worker returns a streaming response using Server-Sent Events (SSE). Each event contains a chunk of the generated text.

Example stream:
```
data: {"text": "Hi"}

data: {"text": " there"}

data: {"text": "!"}

data: [DONE]
```

### Error Responses

#### API Busy (503):
```json
{
  "error": "The AI is currently busy. Please try again in a moment.",
  "retryAfter": 5
}
```

#### Invalid Request (400):
```json
{
  "error": "Invalid request: messages array required"
}
```

#### Internal Error (500):
```json
{
  "error": "Internal server error",
  "details": "Error details here"
}
```

## Architecture

### Key Components

1. **System Instruction**: Defines the "Robotic Pet" personality for consistent behavior
2. **Content Builder**: Converts messages and images into Gemini API format
3. **Retry Logic**: Handles busy API with exponential backoff (1s, 2s, 4s)
4. **Streaming Handler**: Passes through SSE responses from Gemini API
5. **CORS Handler**: Enables cross-origin requests from frontend applications

### Error Handling

- **Rate Limiting (429)**: Automatic retry with exponential backoff
- **Service Unavailable (503)**: Retry logic with user-friendly error message
- **Invalid Input**: Clear error messages for debugging
- **API Errors**: Detailed error logging and graceful failure

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

### Generation Config

The worker uses these settings for text generation:
- **Temperature**: 0.7 (balanced creativity)
- **Top K**: 40
- **Top P**: 0.95
- **Max Output Tokens**: 150 (keeps responses concise)

### Safety Settings

All safety categories are set to `BLOCK_MEDIUM_AND_ABOVE`:
- Harassment
- Hate Speech
- Sexually Explicit
- Dangerous Content

## Development

### Local Testing
```bash
npm run dev
```

This starts the worker locally at `http://localhost:8787`

### Testing with curl

```bash
# Text-only request
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'

# With image
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is in this image?"}
    ],
    "image": {
      "mimeType": "image/jpeg",
      "data": "'"$(base64 -w 0 image.jpg)"'"
    }
  }'
```

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Your worker will be available at:
```
https://gemini-chatbot-worker.<your-subdomain>.workers.dev
```

## Frontend Integration Example

```javascript
async function chatWithBot(message, imageBase64 = null) {
  const payload = {
    messages: [
      { role: "user", content: message }
    ]
  };

  if (imageBase64) {
    payload.image = {
      mimeType: "image/jpeg",
      data: imageBase64
    };
  }

  const response = await fetch('https://your-worker.workers.dev/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          // Display parsed.text in your UI
          console.log(parsed.text);
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

## License

MIT License - feel free to use and modify!

## Acknowledgments

Built with Google Gemini API and Cloudflare Workers for a fast, scalable chatbot experience.

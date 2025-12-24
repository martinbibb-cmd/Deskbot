# Gemini Chatbot Worker Integration Guide

## Overview

This directory contains a Cloudflare Worker that provides a Gemini-powered chatbot API for the Deskbot project. The worker complements the existing Python-based desktop application by offering a cloud-based AI service with enhanced capabilities.

## What's New

### Key Features Added

1. **Robotic Pet Personality** 🤖
   - The Gemini assistant now has a unique "digital companion" personality
   - Uses short, cheeky sentences
   - Curious and playful interactions
   - Consistent with Deskbot's friendly nature

2. **Multimodal Support** 🖼️
   - Accepts both text and Base64-encoded images
   - Can analyze images and provide contextual responses
   - Perfect for visual interactions with Deskbot

3. **Streaming Responses** ⚡
   - Real-time response streaming using Server-Sent Events (SSE)
   - Responses appear bit-by-bit on the frontend
   - Smoother, more engaging user experience

4. **Robust Error Handling** 🛡️
   - Automatic retry logic for busy API scenarios
   - Exponential backoff (1s, 2s, 4s)
   - User-friendly error messages

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deskbot Desktop App                      │
│                   (Python - Local)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP Request
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (Edge)                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  1. Request Validation                              │  │
│  │  2. System Instruction (Robotic Pet Personality)    │  │
│  │  3. Content Builder (Text + Images)                 │  │
│  │  4. Retry Logic                                     │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API Call
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                Google Gemini API                            │
│              (gemini-1.5-flash)                             │
└─────────────────────────────────────────────────────────────┘
```

## Comparison: OpenAI vs Gemini Integration

| Feature | OpenAI (Existing) | Gemini Worker (New) |
|---------|------------------|-------------------|
| Location | Desktop App | Cloud (Cloudflare Edge) |
| Model | GPT-3.5-turbo | Gemini 1.5 Flash |
| Personality | Friendly companion | Robotic Pet |
| Multimodal | ❌ Text only | ✅ Text + Images |
| Streaming | ❌ No | ✅ Yes (SSE) |
| Response Style | 1-3 sentences | Short, cheeky sentences |
| Error Handling | Basic try/catch | Retry with backoff |
| Scalability | Limited to local | Edge deployment |

## Use Cases

### When to Use the Gemini Worker

1. **Visual Interactions**: When Deskbot needs to analyze images from the webcam
2. **Cloud Deployment**: For web-based Deskbot interfaces
3. **Real-time Streaming**: When smooth, progressive responses are needed
4. **High Availability**: Leverage Cloudflare's global edge network

### When to Use OpenAI Integration

1. **Privacy-First**: When data should not leave the local machine
2. **Offline Capability**: When internet connectivity is limited
3. **Existing Workflows**: For current Deskbot desktop users

## Getting Started

### Prerequisites

- Cloudflare account (free tier works)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Node.js v18+ (for deployment)

### Quick Setup

1. **Navigate to the worker directory**:
   ```bash
   cd worker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your Gemini API key**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # For production, use Wrangler secrets:
   wrangler secret put GEMINI_API_KEY
   # Then enter your API key when prompted
   ```

4. **Test locally**:
   ```bash
   npm run dev
   ```
   The worker will be available at `http://localhost:8787`

5. **Deploy to Cloudflare**:
   ```bash
   npm run deploy
   ```
   You'll receive a URL like: `https://gemini-chatbot-worker.your-subdomain.workers.dev`

### Integration with Deskbot

To integrate this worker with your Deskbot application:

```python
# Add to your Python code
import requests
import json

class GeminiIntegration:
    def __init__(self, worker_url):
        self.worker_url = worker_url
    
    def get_response(self, user_input, image_base64=None):
        """Get response from Gemini worker"""
        payload = {
            "messages": [
                {"role": "user", "content": user_input}
            ]
        }
        
        if image_base64:
            payload["image"] = {
                "mimeType": "image/jpeg",
                "data": image_base64
            }
        
        response = requests.post(
            self.worker_url,
            json=payload,
            stream=True
        )
        
        # Handle streaming response
        for line in response.iter_lines():
            if line.startswith(b'data: '):
                data = line[6:].decode('utf-8')
                if data != '[DONE]':
                    try:
                        chunk = json.loads(data)
                        yield chunk.get('text', '')
                    except json.JSONDecodeError:
                        continue

# Usage
gemini = GeminiIntegration("https://your-worker.workers.dev")

# Text only
for chunk in gemini.get_response("Hello!"):
    print(chunk, end='', flush=True)

# With image
import base64
with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()
    
for chunk in gemini.get_response("What's in this image?", image_data):
    print(chunk, end='', flush=True)
```

## Testing

### Run Test Scenarios

```bash
cd worker
node test.js
```

This displays test cases and provides curl commands for manual testing.

### Manual API Testing

1. **Simple text request**:
   ```bash
   curl -X POST https://your-worker.workers.dev/ \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {"role": "user", "content": "Hello! What are you?"}
       ]
     }'
   ```

2. **Multimodal request** (with image):
   ```bash
   curl -X POST https://your-worker.workers.dev/ \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {"role": "user", "content": "What is in this image?"}
       ],
       "image": {
         "mimeType": "image/jpeg",
         "data": "'$(base64 -w 0 test-image.jpg)'"
       }
     }'
   ```

3. **Test error handling**:
   ```bash
   curl -X POST https://your-worker.workers.dev/ \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

### Generation Parameters

Configured in `src/index.js`:
- **Temperature**: 0.7 (balanced creativity)
- **Top K**: 40
- **Top P**: 0.95
- **Max Output Tokens**: 150 (keeps responses concise)

### Safety Settings

All categories set to `BLOCK_MEDIUM_AND_ABOVE`:
- Harassment
- Hate Speech
- Sexually Explicit
- Dangerous Content

## Monitoring and Debugging

### Cloudflare Dashboard

View logs and metrics:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Select your worker
4. View Real-time Logs and Analytics

### Local Development

```bash
npm run dev
# Worker runs at http://localhost:8787
# Logs appear in terminal
```

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure you've set `GEMINI_API_KEY` using `wrangler secret put GEMINI_API_KEY`

2. **503 errors (API busy)**
   - Normal during high load
   - Worker automatically retries with exponential backoff
   - Wait a few seconds and try again

3. **CORS errors**
   - Worker includes CORS headers for all origins (`*`)
   - For production, update CORS settings in `src/index.js`

4. **Empty responses**
   - Check Gemini API key is valid
   - Verify you have API quota remaining
   - Check Cloudflare logs for detailed error messages

## Cost Considerations

### Cloudflare Workers
- **Free Tier**: 100,000 requests/day
- **Paid Plan**: $5/month for 10 million requests

### Google Gemini API
- **Free Tier**: 15 requests/minute, 1500 requests/day
- **Paid Tier**: $0.00025 per 1000 characters input, $0.0005 per 1000 characters output

For typical Deskbot usage (personal desktop companion), the free tiers should be sufficient.

## Security

✅ **Security Features**:
- API keys stored securely using Wrangler secrets
- Input validation on all requests
- Safety settings enabled
- CORS configured
- No security vulnerabilities (verified with CodeQL)

⚠️ **Best Practices**:
- Never commit API keys to version control
- Use Wrangler secrets for production deployments
- Monitor API usage to prevent quota exhaustion
- Restrict CORS origins in production

## Future Enhancements

Potential improvements for the worker:

1. **Rate Limiting**: Add per-user rate limiting
2. **Authentication**: Implement API key authentication
3. **Conversation History**: Store conversation state
4. **Multiple Models**: Support model selection
5. **Analytics**: Track usage patterns
6. **Custom Personalities**: Allow personality configuration
7. **Caching**: Cache common responses

## Support

For issues or questions:
- Check the [README.md](README.md) in this directory
- Review Cloudflare Workers [documentation](https://developers.cloudflare.com/workers/)
- Consult Google Gemini [API docs](https://ai.google.dev/docs)

## License

MIT License - Same as the main Deskbot project

---

**Happy chatting with your Gemini-powered digital companion!** 🤖✨

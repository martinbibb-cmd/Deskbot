# Deskbot

A Progressive Web App (PWA) voice assistant inspired by the LOOI robot. Deskbot works on any device with a modern browser and features push-to-talk voice interaction powered by AI.

📱 **Works on iOS Safari, Android Chrome, and Desktop browsers!**

## Features

- 🎤 **Push-to-Talk Voice Recording**: Hold button to record, release to send
- 💬 **Bubble-style Chat Interface**: Clean, modern messaging UI
- 🤖 **AI Personality**: Powered by Google Gemini AI with natural conversations
- ☁️ **Cloudflare Worker Backend**: Fast, globally distributed API (see `worker/` directory)
- 📱 **Installable PWA**: Add to home screen on iOS/Android for app-like experience
- 🔒 **Offline-capable**: Service worker caches static assets
- ⚡ **No Installation Required**: Just visit the URL and start talking

## Quick Start

**Option 1: Use the deployed version** (if available)
- Visit your deployed URL
- Allow microphone access
- Hold the button and speak!

**Option 2: Run locally for development**
```bash
# Start development server
node dev-server.js

# Open http://localhost:3000 in your browser
# For iOS: use your local network IP (e.g., http://192.168.1.100:3000)
```

## PWA Installation

### iOS Safari
1. Visit the app URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Open from your home screen

### Android Chrome
1. Visit the app URL in Chrome
2. Tap "Install app" when prompted
3. Open from your app drawer

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for complete deployment instructions to:
- Cloudflare Pages (recommended)
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

**No Python installation required for deployment!** Just serve the static files in `/web/` directory.


## Project Structure

```
Deskbot/
├── web/                    # PWA static files (deploy this directory)
│   ├── index.html         # Main app interface
│   ├── app.js            # Push-to-talk voice recording logic
│   ├── style.css         # Styling
│   ├── manifest.webmanifest  # PWA manifest
│   ├── service-worker.js     # Offline caching
│   └── icon-*.png            # App icons
├── worker/                # Cloudflare Worker backend
│   ├── src/              # Worker source code
│   └── README.md         # Worker documentation
└── requirements.txt      # Optional Python tooling dependencies

**Desktop Python app (legacy)**:
- main.py, gui.py, voice_recognition.py, etc. are legacy files
- Use the PWA in `/web/` directory instead
```

## Backend: Cloudflare Worker

The backend API is a Cloudflare Worker with Google Gemini AI. It provides:
- Robotic Pet personality
- Multimodal support (audio transcription + text responses)
- Fast, globally distributed edge computing
- Robust error handling

See [`worker/README.md`](worker/README.md) for setup and deployment instructions.

## Troubleshooting

### Microphone Access
- **Browser permissions**: Click "Allow" when prompted
- **HTTPS required**: getUserMedia requires HTTPS (or localhost)
- **iOS Safari**: Must be installed as PWA for best experience

### Audio Not Recording
- Check browser console for errors
- Verify microphone is working in other apps
- Try a different browser
- Ensure HTTPS is being used

### PWA Not Installing
**On iOS:**
- Must use HTTPS or localhost
- Use Safari (not Chrome)
- Follow: Share → Add to Home Screen

**On Android:**
- Must use HTTPS
- Use Chrome for best support
- Look for install prompt in address bar

### API Connection Issues
- Verify worker is deployed and accessible
- Check `API_ENDPOINT` in `/web/app.js`
- Check browser console for CORS errors
- Verify Gemini API key is set in worker

## Development

### Local Development
```bash
# Start local dev server
node dev-server.js

# Server runs at http://localhost:3000
# Includes CORS headers for local testing
```

### Deploy Worker
```bash
cd worker
npm install
wrangler secret put GEMINI_API_KEY
npm run deploy
```

### Deploy Static Files
Simply deploy the `/web/` directory to any static hosting service:
- Cloudflare Pages
- Netlify  
- Vercel
- GitHub Pages
- Any CDN or static host

**No build step required!** Just serve the files.

## Legacy Desktop App

The original Python desktop app files (main.py, gui.py, etc.) are kept for reference but are no longer the primary interface. The PWA in `/web/` is now the recommended way to use Deskbot.

To run the legacy desktop app (not recommended):
1. Install Python 3.8+
2. Install system dependencies (portaudio, opencv, etc.)
3. Run `pip install -r requirements.txt` (optional tooling deps only)
4. Note: Desktop dependencies have been removed from requirements.txt

## License

MIT License - feel free to use and modify!

## Acknowledgments

Inspired by the LOOI robot - bringing companionship to your devices!

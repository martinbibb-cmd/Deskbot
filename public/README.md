# Deskbot PWA - Progressive Web App

A Progressive Web App (PWA) implementation of Deskbot that provides voice interaction capabilities through a push-to-talk interface. Works seamlessly on iOS Safari and other modern browsers.

## Features

- 🎤 **Push-to-Talk Audio Recording**: Hold a button to record audio using `MediaRecorder` API (with WebAudio WAV fallback)
- 💬 **Chat Interface**: Bubble-style chat transcript showing conversation history
- 🤖 **AI-Powered Responses**: Powered by Google Gemini AI through Cloudflare Worker backend
- 📱 **PWA Support**: Install on iOS Home Screen for app-like experience
- 🔒 **Offline Capability**: Service worker caches static assets for offline use
- 🎨 **Visual Feedback**: Recording indicator and smooth animations
- ⚡ **iOS Safari Optimized**: Handles iOS autoplay restrictions and touch events

## Quick Start

### Development Mode

1. **Start the development server**:
   ```bash
   node dev-server.js
   ```

2. **Open in browser**:
   - Navigate to `http://localhost:3000`
   - For iOS testing, use your local network IP (e.g., `http://192.168.1.100:3000`)

3. **Grant microphone permission** when prompted

4. **Hold the "Hold to Talk" button** to record your voice

### Production Deployment

#### Deploy to Cloudflare Workers

1. **Configure Wrangler** (if not already done):
   ```bash
   cd worker
   npm install
   ```

2. **Set your Gemini API key**:
   ```bash
   wrangler secret put GEMINI_API_KEY
   # Enter your Google Gemini API key when prompted
   ```

3. **Deploy the worker**:
   ```bash
   npm run deploy
   ```

4. **Host static files**: Deploy the `public/` directory to:
   - Cloudflare Pages
   - Netlify
   - Vercel
   - Any static hosting service
   - Or use Cloudflare Workers Sites

5. **Update API endpoint**: In `public/app.js`, update the `API_ENDPOINT` constant to point to your deployed worker URL.

## File Structure

```
public/
├── index.html           # Main HTML structure with chat UI
├── style.css           # Styles including bubble chat and animations
├── app.js              # Core application logic
├── manifest.webmanifest # PWA manifest for installation
├── service-worker.js   # Service worker for offline caching
├── icon-192.png        # App icon (192x192)
└── icon-512.png        # App icon (512x512)

worker/
└── src/
    └── index.js        # Cloudflare Worker with audio endpoint

dev-server.js           # Development server for local testing
```

## How It Works

### Audio Recording Flow

1. **User presses** the "Hold to Talk" button (`touchstart` or `pointerdown`)
2. **Microphone permission** is requested (if not already granted)
3. **Recording starts** using `MediaRecorder` API (or WebAudio fallback)
4. **User releases** the button (`touchend` or `pointerup`)
5. **Recording stops** and audio is packaged as a Blob
6. **Audio is uploaded** to `/api/deskbot/turn` via multipart/form-data
7. **Backend processes** audio using Gemini AI multimodal API
8. **Response is received** with transcript and reply text
9. **Chat updates** with user transcript and assistant response
10. **Audio playback** (if TTS URL provided)

### API Endpoint

**Endpoint**: `POST /api/deskbot/turn`

**Request Format**: `multipart/form-data`
- `audio`: Audio file blob (webm, wav, or mp4)
- `sessionId`: Session identifier from localStorage

**Response Format**: JSON
```json
{
  "transcript": "User's transcribed speech",
  "replyText": "Assistant's text response",
  "replyAudioUrl": "https://..." // Optional TTS audio URL
}
```

### Session Management

- Session ID is generated on first visit and stored in `localStorage`
- Used to maintain conversation continuity across page reloads
- Format: `session_<timestamp>_<random>`

## PWA Installation

### iOS Safari

1. Open the app in Safari
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app icon will appear on your Home Screen

### Android Chrome

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Follow the prompts

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| MediaRecorder | ✅ | ✅* | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ⚠️ | ✅ |

*Safari uses WebAudio fallback for WAV encoding

## Limitations

- **No background recording**: Recording only works while the app is active
- **No wake word detection**: Requires manual button press to start recording
- **TTS not implemented**: Audio responses require external TTS service integration
- **Network required**: API calls need internet connectivity (static assets cached offline)

## Troubleshooting

### Microphone Permission Denied

**Solution**: 
1. Open browser settings
2. Navigate to site permissions
3. Enable microphone access for the app domain

### Recording Not Working on iOS

**Possible causes**:
- Safari requires user interaction to start recording (ensure you're pressing the button)
- Microphone permission not granted
- App not loaded via HTTPS (required for `getUserMedia` in production)

**Solution**: Use HTTPS in production, and ensure permission is granted.

### PWA Not Installing on iOS

**Requirements**:
- Must be served over HTTPS (or localhost for testing)
- Must have valid `manifest.webmanifest`
- Must have icons in correct sizes
- Must be standalone display mode

### Service Worker Not Updating

**Solution**:
1. Increment `CACHE_VERSION` in `service-worker.js`
2. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
3. Clear cache if needed

## Development

### Running Tests

Currently, tests can be run manually:

1. Start the dev server: `node dev-server.js`
2. Open `http://localhost:3000` in a browser
3. Test recording, playback, and UI interactions

### Modifying the UI

- **Colors**: Edit CSS variables in `style.css` `:root` section
- **Layout**: Modify structure in `index.html`
- **Behavior**: Update logic in `app.js`

### Adding Features

To add new features:

1. Update `index.html` for new UI elements
2. Add styles in `style.css`
3. Implement logic in `app.js`
4. Update `service-worker.js` if new assets need caching
5. Test thoroughly on target devices

## Security Considerations

- Microphone access requires user permission
- HTTPS required in production for `getUserMedia`
- Session IDs are client-side only (not authenticated)
- API calls should be rate-limited in production
- Consider adding authentication for production use

## Future Enhancements

- [ ] Text-to-Speech integration for audio responses
- [ ] Better transcript extraction from Gemini
- [ ] Conversation history persistence
- [ ] Multi-language support
- [ ] Voice activity detection
- [ ] Offline mode with local transcription
- [ ] Background audio playback
- [ ] User authentication

## License

MIT License - Same as the main Deskbot project

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review [worker documentation](../worker/INTEGRATION.md)
- Open an issue on GitHub

---

**Made with ❤️ for voice interaction enthusiasts**

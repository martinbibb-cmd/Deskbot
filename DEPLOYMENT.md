# Deskbot PWA - Deployment Guide

This guide walks you through deploying the Deskbot PWA to production.

**No Python installation required!** The PWA is pure static HTML/CSS/JavaScript.

## Prerequisites

- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Cloudflare account (free tier works)
- Node.js v18+ installed locally (for worker deployment only)
- Git installed

## Step 1: Deploy the Cloudflare Worker

The worker handles audio processing and AI responses.

### 1.1 Install Dependencies

```bash
cd worker
npm install
```

### 1.2 Configure API Key

Set your Gemini API key as a secret:

```bash
wrangler secret put GEMINI_API_KEY
# Enter your API key when prompted
```

### 1.3 Deploy to Cloudflare

```bash
npm run deploy
```

You'll receive a URL like: `https://gemini-chatbot-worker.your-subdomain.workers.dev`

**Save this URL** - you'll need it in the next step.

## Step 2: Deploy Static Frontend

The `/web/` directory contains the PWA static files. No build step required!

Choose one of the following hosting options:

### Option A: Cloudflare Pages (Recommended)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Deploy PWA"
   git push
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: (leave empty - no build needed!)
     - Build output directory: `web`
   - Click "Save and Deploy"

3. **Get your Pages URL**: `https://your-project.pages.dev`

### Option B: Netlify

1. **Deploy via Netlify UI**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Configure:
     - Base directory: `web`
     - Build command: (leave empty)
     - Publish directory: `web`
   - Click "Deploy site"

2. **Or use Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   cd web
   netlify deploy --prod
   ```

### Option C: Vercel

1. **Deploy via Vercel UI**:
   - Go to [Vercel](https://vercel.com/)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - Root Directory: `web`
     - Build Command: (leave empty)
     - Output Directory: (leave empty)
   - Click "Deploy"

2. **Or use Vercel CLI**:
   ```bash
   npm install -g vercel
   cd web
   vercel --prod
   ```

### Option D: GitHub Pages

1. **Create gh-pages branch with web directory**:
   ```bash
   git checkout -b gh-pages
   # Copy web contents to root for GitHub Pages
   cp -r web/* .
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select `gh-pages` branch and `/` (root)
   - Save

3. **Access at**: `https://username.github.io/Deskbot/`

## Step 3: Configure API Endpoint

Update the frontend to use your deployed worker URL.

### 3.1 Edit app.js

In `web/app.js`, update line 19:

```javascript
// Change from:
const API_ENDPOINT = '/api/deskbot/turn';

// To your deployed worker URL:
const API_ENDPOINT = 'https://gemini-chatbot-worker.your-subdomain.workers.dev/api/deskbot/turn';
```

### 3.2 Redeploy

After updating, redeploy the static files:
- **Cloudflare Pages/Netlify/Vercel**: Just push to GitHub (auto-deploys)
- **GitHub Pages**: Commit and push to gh-pages branch
- **Manual**: Re-upload files to your hosting

## Step 4: Test Your PWA

### 4.1 Desktop Testing

1. Open your deployed URL in Chrome/Edge/Firefox
2. Click the "Hold to Talk" button
3. Grant microphone permission
4. Hold the button and speak
5. Release and wait for response

### 4.2 iOS Safari Testing

1. Open your deployed URL in Safari on iOS
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. Open the app from your Home Screen
6. Test voice interaction

### 4.3 Android Testing

1. Open your deployed URL in Chrome on Android
2. Tap the menu (three dots)
3. Tap "Install app"
4. Test voice interaction

## Step 5: Configure Custom Domain (Optional)

### For Cloudflare Pages/Workers

1. Go to your project in Cloudflare Dashboard
2. Navigate to Custom domains
3. Add your domain (e.g., `deskbot.yourdomain.com`)
4. Update DNS records as instructed
5. Wait for SSL certificate to provision (usually < 5 minutes)

### For Other Platforms

Follow your hosting provider's instructions for custom domains.

## Troubleshooting

### Worker Deployment Issues

**Error: "API key not configured"**
- Ensure you ran `wrangler secret put GEMINI_API_KEY`
- Verify the secret with `wrangler secret list`

**Error: "Authentication error"**
- Run `wrangler login` to authenticate with Cloudflare

### CORS Issues

If you see CORS errors:

1. Verify the worker URL is correct in `app.js`
2. Check that the worker is deployed and accessible
3. Ensure the worker includes CORS headers (already configured)

### PWA Not Installing

**On iOS:**
- Must use HTTPS (or localhost for testing)
- Manifest must be valid JSON
- Icons must be accessible
- Display mode must be "standalone"

**On Android:**
- Must use HTTPS
- Service worker must register successfully
- Manifest must include required fields

### Microphone Not Working

**Permission denied:**
- Check browser settings for site permissions
- Ensure HTTPS is used (required for getUserMedia)

**No audio recorded:**
- Check console for errors
- Verify microphone is working in other apps
- Try a different browser

## Monitoring and Maintenance

### Cloudflare Analytics

View worker metrics:
1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. View Analytics tab

### Updating the PWA

1. Make changes to files
2. Increment `CACHE_VERSION` in `service-worker.js`
3. Commit and push changes
4. Redeploy (automatic for Pages, manual for others)
5. Users will receive updates on next visit

### Cost Management

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- More than enough for personal use

**Gemini API Free Tier:**
- 15 requests/minute
- 1,500 requests/day

For production with high traffic, consider upgrading to paid tiers.

## Security Recommendations

1. **Rate Limiting**: Add rate limiting to prevent abuse
   ```javascript
   // In worker, track requests per IP
   ```

2. **Authentication**: Implement user authentication for production
   ```javascript
   // Add API key or OAuth
   ```

3. **Input Validation**: Already implemented, but verify thoroughly

4. **HTTPS Only**: Ensure all traffic uses HTTPS

5. **Monitor Usage**: Set up alerts for unusual activity

## Next Steps

After deployment:

1. ✅ Test on multiple devices
2. ✅ Share with beta testers
3. ✅ Monitor error logs
4. ✅ Collect user feedback
5. ✅ Iterate and improve

## Support

For issues or questions:
- Check [web/README.md](web/README.md) for troubleshooting
- Review [worker/INTEGRATION.md](worker/INTEGRATION.md)
- Open an issue on GitHub

---

**Congratulations!** 🎉 Your Deskbot PWA is now deployed and ready to use!

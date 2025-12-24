/**
 * Simple development server for testing the Deskbot PWA
 * This serves the static files from the public directory
 * and proxies API calls to avoid CORS issues
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'web');

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API requests (mock for development)
  if (req.url.startsWith('/api/deskbot/turn')) {
    handleApiRequest(req, res);
    return;
  }

  // Serve static files
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Get file extension and MIME type
  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
      return;
    }

    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

/**
 * Handle API requests - mock response for development
 */
function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  // Check content type to determine response type
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    let mockResponse;

    // Handle text messages (JSON)
    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(body);
        console.log('Text message:', data.text);

        mockResponse = {
          replyText: "Hi there! I'm Deskbot, your digital companion. How can I help you today?",
          replyAudioUrl: null // Browser will use TTS
        };
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
    }
    // Handle audio messages (multipart/form-data)
    else {
      mockResponse = {
        transcript: "Voice message received",
        replyText: "Hey! I heard you! I'm your digital companion, ready to chat!",
        replyAudioUrl: null // Browser will use TTS
      };
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(mockResponse));
  });
}

server.listen(PORT, () => {
  console.log(`\n🤖 Deskbot PWA Development Server`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📱 Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving files from: ${PUBLIC_DIR}`);
  console.log(`\n💡 Open http://localhost:${PORT} in your browser`);
  console.log(`   (For iOS testing, use your local network IP)\n`);
});

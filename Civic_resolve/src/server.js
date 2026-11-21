/**
 * CivicResolve: Full-Stack Node.js Application Server
 * Serves modern REST APIs and reactive Single-Page Application UI
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as db from './lib/db.js';
import { analyzeComplaintWithGemini } from './lib/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const UPLOADS_DIR = path.resolve(PUBLIC_DIR, 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Load .env file from project root if present
const ENV_FILE = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(ENV_FILE)) {
  try {
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          process.env[k] = v;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

// In-memory runtime settings (custom Gemini API key set from UI)
let runtimeGeminiKey = process.env.GEMINI_API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Cap at 15MB for base64 photo uploads
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function handleStaticFile(req, res, pathname) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  // Prevent directory traversal
  safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // ----------------- API ENDPOINTS -----------------

    // GET /api/issues
    if (method === 'GET' && pathname === '/api/issues') {
      const filters = {
        category: parsedUrl.searchParams.get('category') || undefined,
        urgency: parsedUrl.searchParams.get('urgency') || undefined,
        status: parsedUrl.searchParams.get('status') || undefined,
        department: parsedUrl.searchParams.get('department') || undefined,
        search: parsedUrl.searchParams.get('search') || undefined
      };
      const issues = db.getAllIssues(filters);
      return sendJson(res, 200, { success: true, count: issues.length, data: issues });
    }

    // GET /api/issues/:id
    if (method === 'GET' && pathname.startsWith('/api/issues/')) {
      const id = pathname.replace('/api/issues/', '');
      const issue = db.getIssueById(id);
      if (!issue) return sendJson(res, 404, { success: false, error: 'Issue not found' });
      return sendJson(res, 200, { success: true, data: issue });
    }

    // POST /api/triage: Real-time Gemini AI Triage
    if (method === 'POST' && pathname === '/api/triage') {
      const body = await parseJsonBody(req);
      const { title, description, imageBase64, mimeType, sampleHint } = body;

      const triageResult = await analyzeComplaintWithGemini({
        title,
        description,
        imageBase64,
        mimeType,
        sampleHint,
        apiKey: runtimeGeminiKey
      });

      return sendJson(res, 200, { success: true, data: triageResult });
    }

    // POST /api/issues: Submit new grievance
    if (method === 'POST' && pathname === '/api/issues') {
      const body = await parseJsonBody(req);
      if (!body.title || !body.description) {
        return sendJson(res, 400, { success: false, error: 'Title and description are required.' });
      }

      // Handle image if sent as base64
      let imageUrl = body.imageUrl || '';
      if (body.imageBase64) {
        const matches = body.imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const filename = `issue-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
          imageUrl = `/uploads/${filename}`;
        }
      }

      // Perform AI Triage if not provided
      let aiTriage = body.aiTriage;
      if (!aiTriage) {
        aiTriage = await analyzeComplaintWithGemini({
          title: body.title,
          description: body.description,
          imageBase64: body.imageBase64,
          mimeType: body.mimeType,
          apiKey: runtimeGeminiKey
        });
      }

      const newIssue = db.createIssue({
        title: body.title,
        description: body.description,
        category: body.category || aiTriage.category,
        urgency: body.urgency || aiTriage.urgency,
        department: body.department || aiTriage.department,
        location: body.location,
        imageUrl,
        reportedBy: body.reportedBy,
        aiTriage
      });

      return sendJson(res, 201, { success: true, data: newIssue });
    }

    // POST /api/issues/:id/status
    if (method === 'POST' && pathname.match(/^\/api\/issues\/[^\/]+\/status$/)) {
      const id = pathname.split('/')[3];
      const body = await parseJsonBody(req);

      let afterImageUrl = body.afterImageUrl || '';
      if (body.afterImageBase64) {
        const matches = body.afterImageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const filename = `resolved-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
          afterImageUrl = `/uploads/${filename}`;
        }
      }

      const updated = db.updateIssueStatus(id, {
        newStatus: body.newStatus,
        actorName: body.actorName,
        actorRole: body.actorRole,
        notes: body.notes,
        afterImageUrl,
        assignedOfficer: body.assignedOfficer,
        overrideCategory: body.overrideCategory,
        overrideUrgency: body.overrideUrgency,
        overrideDepartment: body.overrideDepartment
      });

      if (!updated) return sendJson(res, 404, { success: false, error: 'Issue not found' });
      return sendJson(res, 200, { success: true, data: updated });
    }

    // POST /api/issues/:id/upvote
    if (method === 'POST' && pathname.match(/^\/api\/issues\/[^\/]+\/upvote$/)) {
      const id = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const result = db.toggleUpvote(id, body.userId || 'alex-user');
      if (!result) return sendJson(res, 404, { success: false, error: 'Issue not found' });
      return sendJson(res, 200, { success: true, data: result });
    }

    // POST /api/issues/:id/rate
    if (method === 'POST' && pathname.match(/^\/api\/issues\/[^\/]+\/rate$/)) {
      const id = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const updated = db.submitSatisfactionRating(id, {
        rating: body.rating,
        feedback: body.feedback
      });
      if (!updated) return sendJson(res, 404, { success: false, error: 'Issue not found' });
      return sendJson(res, 200, { success: true, data: updated });
    }

    // GET /api/stats
    if (method === 'GET' && pathname === '/api/stats') {
      const stats = db.getStats();
      return sendJson(res, 200, { success: true, data: stats });
    }

    // POST /api/admin/reset
    if (method === 'POST' && pathname === '/api/admin/reset') {
      const seed = db.resetToSeedData();
      return sendJson(res, 200, { success: true, message: 'Reset to initial seed dataset.', count: seed.length });
    }

    // POST /api/settings/key
    if (method === 'POST' && pathname === '/api/settings/key') {
      const body = await parseJsonBody(req);
      if (body.apiKey !== undefined) {
        runtimeGeminiKey = body.apiKey.trim();
        process.env.GEMINI_API_KEY = runtimeGeminiKey;
        // Persist to .env file for permanent storage
        try {
          fs.writeFileSync(ENV_FILE, `GEMINI_API_KEY=${runtimeGeminiKey}\nPORT=3000\n`);
        } catch (e) {
          console.warn('Could not persist to .env:', e.message);
        }
      }
      return sendJson(res, 200, {
        success: true,
        isConfigured: Boolean(runtimeGeminiKey),
        keyPreview: runtimeGeminiKey ? `${runtimeGeminiKey.substring(0, 6)}...${runtimeGeminiKey.slice(-4)}` : 'None (Using Heuristic Simulation)'
      });
    }

    // GET /api/settings/status
    if (method === 'GET' && pathname === '/api/settings/status') {
      return sendJson(res, 200, {
        success: true,
        isConfigured: Boolean(runtimeGeminiKey),
        model: 'gemini-2.5-flash',
        keyPreview: runtimeGeminiKey ? `${runtimeGeminiKey.substring(0, 6)}...${runtimeGeminiKey.slice(-4)}` : 'None (Using Heuristic Simulation)'
      });
    }

    // Static File Serving
    handleStaticFile(req, res, pathname);
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏛️ CivicResolve Server running at: http://localhost:${PORT}`);
  console.log(`📡 AI Model: Google Gemini 2.5 Flash / Semantic Fallback`);
  console.log(`⚡ Dual Config: Environment Key + In-App AI Settings`);
  console.log(`=======================================================`);
});

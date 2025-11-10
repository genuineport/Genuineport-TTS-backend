// server.js
// Usage:
// 1) set env vars: ELEVENLABS_API_KEY and ELEVEN_VOICE_ID
// 2) npm init -y
// 3) npm install express node-fetch dotenv
// 4) node server.js

const express = require('express');
const fetch = require('node-fetch'); // Node 18+ has global fetch; use node-fetch if older
const path = require('path');
const { Buffer } = require('buffer');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // frontend files in /public

// Environment config
const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID || 'your_voice_id_here'; // replace with real voice id

if (!ELEVEN_API_KEY) {
  console.warn('Warning: ELEVENLABS_API_KEY not set. Set it in .env for real TTS.');
}

// Helper: optional chunking (here we keep whole text simple)
function chunkTextSimple(text, maxChars = 3500) {
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  // naive split by sentences
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  const parts = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > maxChars) {
      parts.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// Map emotion to ElevenLabs parameters (stability/similarity are ElevenLabs params)
function mapEmotionToParams(emotion) {
  // tune these numbers as you like
  if (emotion === 'joy') return { stability: 0.25, similarity_boost: 0.2 };
  if (emotion === 'sad') return { stability: 0.6, similarity_boost: 0.0 };
  if (emotion === 'angry') return { stability: 0.15, similarity_boost: 0.1 };
  return { stability: 0.4, similarity_boost: 0.0 }; // neutral
}

// Endpoint: simple REST convert (single request -> audio)
app.post('/api/speak', async (req, res) => {
  try {
    const { text, voice, emotion } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text required' });
    }

    // If you want chunking for very long text, uncomment below and synth chunks then concat.
    const parts = chunkTextSimple(text, 3500); // ElevenLabs recommends limited size per request

    // For simplicity: handle single-part only (concatenate otherwise)
    // Here we will call ElevenLabs convert endpoint for the whole text (or first chunk)
    const inputText = parts.join(' ');

    // Build ElevenLabs request
    // Docs: Use Text-to-Speech endpoint as per ElevenLabs API.
    // Replace {voice_id} with ELEVEN_VOICE_ID or voice param if provided.
    const voiceId = (voice && voice !== 'default') ? voice : ELEVEN_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/convert`;
    // Alternatively some docs show /v1/text-to-speech/convert — check your account docs if error.
    const params = mapEmotionToParams(emotion);

    const bodyJson = {
      text: inputText,
      model_id: 'eleven_multilingual_v2', // optional: change if you want different model
      voice_settings: {
        stability: params.stability,
        similarity_boost: params.similarity_boost
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_API_KEY
      },
      body: JSON.stringify(bodyJson)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('ElevenLabs error', resp.status, txt);
      return res.status(502).json({ error: 'TTS provider error', details: txt });
    }

    // Response is audio (binary). Some endpoints may return audio/mpeg or application/octet-stream.
    const arrayBuffer = await resp.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString('base64');
    // Decide mime based on your response; assume mp3 if using convert
    const mime = resp.headers.get('content-type') || 'audio/mpeg';

    return res.json({ audio_base64: b64, mime });
  } catch (err) {
    console.error('server error', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
});

// Optional health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve frontend default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Genuineport TTS backend running on http://localhost:${port}`));

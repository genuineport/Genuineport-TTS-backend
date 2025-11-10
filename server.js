// 1️⃣ Import required packages
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // for making requests to TTS API
require('dotenv').config();

// 2️⃣ Create Express app
const app = express();

// 3️⃣ Middleware
app.use(cors());
app.use(express.json());

// 4️⃣ Test route to verify server is live
app.get('/', (req, res) => {
    res.send('Genuineport TTS backend is running!');
});

// 5️⃣ POST /api/speak route for AI TTS
app.post('/api/speak', async (req, res) => {
    try {
        const { text, voice, emotion } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // ⚠️ Replace the URL and request body with your actual TTS API logic
        // Example: ElevenLabs API call
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                voice: voice || 'default',
                emotion: emotion || 'neutral'
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`TTS API error: ${errText}`);
        }

        // Assume API returns audio as base64
        const data = await response.json();
        res.json({ audio_base64: data.audio_base64 });

    } catch (error) {
        console.error('Error generating voice:', error);
        res.status(500).json({ error: 'Failed to generate voice' });
    }
});

// 6️⃣ Start server with Render-assigned PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Genuineport TTS server running on port ${PORT}`));

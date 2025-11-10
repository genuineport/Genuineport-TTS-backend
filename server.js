// 1️⃣ Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 2️⃣ Create Express app
const app = express();

// 3️⃣ Middleware
app.use(cors());
app.use(express.json());

// 4️⃣ Test route to verify server is running
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// 5️⃣ TTS API route
app.post('/api/speak', async (req, res) => {
  try {
    const { text, voice, emotion } = req.body;

    // ⚠️ Replace this with your actual TTS logic / ElevenLabs API call
    // For now, returning dummy base64 audio string
    const dummyAudioBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEA..."; 
    res.json({ audio_base64: dummyAudioBase64 });

  } catch (error) {
    console.error('Error generating voice:', error);
    res.status(500).json({ error: 'Failed to generate voice' });
  }
});

// 6️⃣ Start server on Render-assigned PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

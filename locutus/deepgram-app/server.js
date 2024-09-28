import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
const upload = multer({ dest: 'uploads/' });
const API_KEY = 'bd7fd2c535bf7c4aa886142f2a406df3a6693e96'; // Replace with your Deepgram API key

// CORS setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/upload', upload.single('audio'), async (req, res) => {
  const audioFilePath = path.join(path.resolve(), req.file.path);

  try {
    const audioData = fs.readFileSync(audioFilePath); // Read file into buffer

    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'audio/wav' // Ensure this is the correct MIME type for your file
      },
      body: audioData // Send file buffer
    });

    const result = await response.json();
    
    fs.unlinkSync(audioFilePath); // Clean up the uploaded file

    // Check if result contains valid transcription data
    if (result.results && result.results.channels) {
      const transcript = result.results.channels[0].alternatives[0].transcript;
      res.json({ transcript });
    } else {
      res.status(500).json({ error: 'No transcription data available' });
    }
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing the file' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

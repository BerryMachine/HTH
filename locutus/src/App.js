const DG_ENDPOINT = 'wss://api.deepgram.com/v1/listen'; // live transcription endpoint
const API_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // Your Deepgram API key (do not expose it in production)

const recordButton = document.getElementById('recordButton');
const audioFileInput = document.getElementById('audioFile');
const transcriptionText = document.getElementById('transcriptionText');

let mediaRecorder, audioChunks = [];

// Start recording when record button is clicked
recordButton.addEventListener('click', () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
      sendAudioToDeepgram(event.data);
    };
    mediaRecorder.start(250); // Record in intervals
  });
});

// Handle file upload
// Modify the file upload section in app.js to use the Express backend

audioFileInput.addEventListener('change', async (event) => {
  const audioFile = event.target.files[0];
  if (audioFile) {
    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      // Send the file to your Express server
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.transcript) {
        transcriptionText.textContent = result.transcript;
      } else {
        transcriptionText.textContent = result.error || 'Error: Unable to process the file';
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      transcriptionText.textContent = 'Error: Unable to process the file';
    }
  }
});


// WebSocket for real-time transcription
function sendAudioToDeepgram(audioData) {
  const socket = new WebSocket(`${DG_ENDPOINT}`, ['token', API_KEY]);

  socket.onopen = () => {
    socket.send(audioData); // Send recorded audio to Deepgram
  };

  socket.onmessage = message => {
    const data = JSON.parse(message.data);
    const transcript = data.channel.alternatives[0].transcript;

    if (transcript && data.is_final) {
      transcriptionText.textContent += ' ' + transcript;
    }
  };

  socket.onerror = error => {
    console.error('WebSocket error: ', error);
  };
}

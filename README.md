# Deskbot

A Python-based desktop companion app inspired by the LOOI robot. Deskbot runs on your computer and features an animated face that tracks your movements, listens to your voice, and has conversations powered by AI.

## Features

- 🎨 **Animated GUI**: Modern interface with animated eyes using CustomTkinter
- 🎤 **Voice Recognition**: Listens for wake word and voice commands
- 🤖 **AI Personality**: Integration with OpenAI API for natural conversations
- 🔊 **Text-to-Speech**: Speaks responses using pyttsx3
- 👁️ **Face Tracking**: Uses OpenCV to track your face and make eye contact
- ☁️ **Gemini Chatbot Worker**: NEW! Cloudflare Worker with Gemini AI, multimodal support, and streaming responses (see `worker/` directory)

## Requirements

- Python 3.8 or higher
- Webcam (for face tracking)
- Microphone (for voice recognition)
- OpenAI API key (or Gemini API key for the worker)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/martinbibb-cmd/Deskbot.git
   cd Deskbot
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

Run the application:
```bash
python main.py
```

### Controls

- **Start Listening**: Click to enable voice recognition
- **Quit**: Close the application

### Voice Interaction

1. Click "Start Listening" to enable voice recognition
2. Speak naturally - Deskbot will hear you and respond
3. The eyes will track your face automatically if face tracking is enabled

## Configuration

Edit the `.env` file to customize settings:

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI features)
- `WAKE_WORD`: Wake word for activation (default: "hey deskbot")
- `VOICE_ENABLED`: Enable/disable voice recognition (default: true)
- `FACE_TRACKING_ENABLED`: Enable/disable face tracking (default: true)

## Project Structure

```
Deskbot/
├── main.py                 # Main application loop
├── gui.py                  # GUI with animated eyes
├── voice_recognition.py    # Voice recognition module
├── openai_integration.py   # OpenAI API integration
├── text_to_speech.py       # Text-to-speech module
├── face_tracking.py        # Face tracking module
├── requirements.txt        # Python dependencies
├── .env.example           # Example environment variables
└── README.md              # This file
```

## Modules

### main.py
Main application entry point that coordinates all modules and manages the main loop.

### gui.py
Creates the graphical interface with:
- Animated eyes that smoothly track face position
- Automatic blinking
- Expression changes (normal, happy, talking)
- Status updates and control buttons

### voice_recognition.py
Handles voice input using the speech_recognition library:
- Microphone calibration
- Wake word detection
- Speech-to-text conversion

### openai_integration.py
Manages conversations with OpenAI:
- Maintains conversation history
- Configurable personality
- Context-aware responses

### text_to_speech.py
Converts text responses to speech:
- Offline text-to-speech using pyttsx3
- Configurable voice properties
- Cross-platform support

### face_tracking.py
Tracks user's face position:
- OpenCV face detection
- Normalized position output
- Smooth tracking with fallback to center

## Troubleshooting

### Microphone Issues
If voice recognition isn't working:
- Check that your microphone is connected and working
- Adjust the `energy_threshold` in `voice_recognition.py`
- Try running the microphone calibration again

### Camera Issues
If face tracking isn't working:
- Check that your webcam is connected
- Make sure no other application is using the camera
- Set `FACE_TRACKING_ENABLED=false` in `.env` to disable face tracking

### OpenAI API Issues
If AI responses aren't working:
- Verify your API key in `.env`
- Check your OpenAI account has available credits
- Check your internet connection

### Audio/TTS Issues
If text-to-speech isn't working:
- On Linux, install: `sudo apt-get install espeak`
- On macOS, TTS should work out of the box
- On Windows, TTS should work out of the box

## Gemini Chatbot Worker

NEW! A Cloudflare Worker implementation with Google Gemini AI is available in the `worker/` directory. This provides:
- Robotic Pet personality
- Multimodal support (text + images)
- Streaming responses
- Robust error handling

See [`worker/README.md`](worker/README.md) and [`worker/INTEGRATION.md`](worker/INTEGRATION.md) for setup and integration instructions.

## License

MIT License - feel free to use and modify!

## Acknowledgments

Inspired by the LOOI robot - bringing companionship to your desktop!

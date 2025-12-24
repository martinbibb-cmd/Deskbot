# Deskbot Project Outline

## Overview
Deskbot is a Python-based desktop companion application inspired by the LOOI robot. It provides an interactive, animated interface with AI-powered conversations and face tracking capabilities.

## Architecture

### Core Components

1. **main.py** - Application Entry Point
   - Initializes all modules
   - Manages threading for voice recognition and face tracking
   - Coordinates communication between modules
   - Handles application lifecycle

2. **gui.py** - Graphical User Interface
   - Built with CustomTkinter for modern appearance
   - Animated eyes with smooth movement
   - Automatic blinking simulation
   - Expression changes (normal, happy, talking)
   - Status updates and control buttons

3. **voice_recognition.py** - Speech Input
   - Uses speech_recognition library
   - Microphone calibration for ambient noise
   - Wake word detection
   - Speech-to-text conversion via Google Speech Recognition

4. **openai_integration.py** - AI Conversation
   - OpenAI API integration
   - Conversation history management
   - Configurable personality
   - Response generation with context awareness

5. **text_to_speech.py** - Voice Output
   - Uses pyttsx3 for offline TTS
   - Configurable voice properties (rate, volume)
   - Cross-platform support

6. **face_tracking.py** - Computer Vision
   - OpenCV-based face detection
   - Haar Cascade classifier
   - Normalized position output (-1 to 1 range)
   - Smooth tracking with fallback to center

## Data Flow

```
User speaks → Voice Recognition → Text
                                   ↓
                              OpenAI API
                                   ↓
                              Response Text
                                   ↓
                           Text-to-Speech → Audio Output

Camera → Face Tracking → Eye Position → GUI Animation
```

## Threading Model

The application uses multiple threads for responsiveness:

1. **Main Thread**: GUI event loop (Tkinter)
2. **Voice Thread**: Continuous listening for voice input
3. **Face Tracking Thread**: Continuous camera monitoring and face detection

All threads communicate through the main Deskbot class, which acts as a coordinator.

## Configuration

Environment variables (stored in `.env`):
- `OPENAI_API_KEY`: Required for AI conversation features
- `WAKE_WORD`: Phrase to activate voice listening (default: "hey deskbot")
- `VOICE_ENABLED`: Toggle voice recognition (true/false)
- `FACE_TRACKING_ENABLED`: Toggle face tracking (true/false)

## Dependencies

### GUI
- customtkinter==5.2.2 - Modern Tkinter wrapper
- Pillow==10.3.0 - Image processing

### Voice
- SpeechRecognition==3.10.4 - Speech recognition
- pyaudio==0.2.14 - Audio input/output

### AI
- openai==1.30.1 - OpenAI API client

### TTS
- pyttsx3==2.90 - Text-to-speech engine
- gTTS==2.5.1 - Google Text-to-Speech (alternative)

### Computer Vision
- opencv-python==4.9.0.80 - Computer vision library
- numpy==1.26.4 - Numerical operations

### Utilities
- python-dotenv==1.0.1 - Environment variable management

## Key Features

### 1. Animated Eyes
- Smooth interpolation between positions
- Automatic blinking every 3 seconds
- Following face position in real-time

### 2. Voice Interaction
- Continuous listening when enabled
- Real-time speech recognition
- Natural conversation flow

### 3. AI Personality
- Friendly and helpful character
- Context-aware responses
- Conversation history for coherent dialogue

### 4. Face Tracking
- Real-time face detection
- Normalized position calculation
- Graceful degradation when no face detected

### 5. Modular Design
- Each component is independent
- Easy to extend or replace modules
- Clear separation of concerns

## Future Enhancements

Potential improvements:
- Wake word detection using Porcupine or similar
- Emotion detection from voice tone
- More expressive animations
- Plugin system for additional features
- Cloud-based speech recognition alternatives
- Mobile companion app
- Task automation capabilities
- Calendar and reminder integration
- Weather and news updates

## Error Handling

The application includes graceful error handling:
- API key validation with user-friendly warnings
- Fallback when camera is unavailable
- Fallback when microphone is unavailable
- TTS fallback to console output
- Network error handling for API calls

## Platform Support

- **Windows**: Full support for all features
- **macOS**: Full support for all features
- **Linux**: Full support (may require additional packages for TTS)

## Getting Started

See README.md for complete installation and usage instructions.

"""
Text-to-Speech Module for Deskbot
Uses pyttsx3 for offline text-to-speech
"""

import pyttsx3


class TextToSpeech:
    """Text-to-speech class for Deskbot"""
    
    def __init__(self):
        """Initialize text-to-speech engine"""
        try:
            self.engine = pyttsx3.init()
            
            # Configure voice properties
            self.engine.setProperty('rate', 150)  # Speed of speech
            self.engine.setProperty('volume', 0.9)  # Volume (0-1)
            
            # Try to set a friendly voice
            voices = self.engine.getProperty('voices')
            if voices:
                # Try to find a female voice (typically more friendly sounding)
                for voice in voices:
                    try:
                        voice_name = voice.name.lower() if hasattr(voice, 'name') else ''
                        if 'female' in voice_name or 'zira' in voice_name:
                            self.engine.setProperty('voice', voice.id)
                            break
                    except Exception:
                        # If voice selection fails, continue with default
                        continue
            
            print("Text-to-speech initialized successfully")
            
        except Exception as e:
            print(f"Error initializing text-to-speech: {e}")
            self.engine = None
    
    def speak(self, text):
        """Speak the given text
        
        Args:
            text: Text to speak
        """
        if not self.engine:
            print(f"TTS not available. Would say: {text}")
            return
        
        try:
            print(f"Speaking: {text}")
            self.engine.say(text)
            self.engine.runAndWait()
        except Exception as e:
            print(f"Error speaking: {e}")
    
    def set_rate(self, rate):
        """Set speech rate
        
        Args:
            rate: Speech rate (words per minute)
        """
        if self.engine:
            self.engine.setProperty('rate', rate)
    
    def set_volume(self, volume):
        """Set speech volume
        
        Args:
            volume: Volume level (0.0 to 1.0)
        """
        if self.engine:
            self.engine.setProperty('volume', volume)

"""
Voice Recognition Module for Deskbot
Uses speech_recognition library for wake word detection and voice commands
"""

import os
import speech_recognition as sr


class VoiceRecognition:
    """Voice recognition class for wake word and command detection"""
    
    def __init__(self):
        """Initialize voice recognition"""
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Get wake word from environment
        self.wake_word = os.getenv('WAKE_WORD', 'hey deskbot').lower()
        
        # Adjust for ambient noise
        print("Calibrating microphone for ambient noise...")
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
        print("Microphone calibrated")
        
        # Recognizer settings
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
    
    def listen(self, timeout=5, phrase_time_limit=5):
        """Listen for speech input
        
        Args:
            timeout: Maximum time to wait for speech to start
            phrase_time_limit: Maximum time for phrase
            
        Returns:
            Recognized text or None
        """
        try:
            with self.microphone as source:
                print("Listening...")
                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit
                )
                
            # Recognize speech using Google Speech Recognition
            try:
                text = self.recognizer.recognize_google(audio)
                return text
            except sr.UnknownValueError:
                print("Could not understand audio")
                return None
            except sr.RequestError as e:
                print(f"Could not request results; {e}")
                return None
                
        except sr.WaitTimeoutError:
            print("Listening timed out")
            return None
        except Exception as e:
            print(f"Error during listening: {e}")
            return None
    
    def check_wake_word(self, text):
        """Check if text contains wake word
        
        Args:
            text: Text to check
            
        Returns:
            True if wake word detected, False otherwise
        """
        if not text:
            return False
        
        # Split both text and wake word into words for better matching
        text_lower = text.lower()
        wake_words = self.wake_word.split()
        text_words = text_lower.split()
        
        # Check if all wake words appear in order
        wake_phrase = ' '.join(wake_words)
        return wake_phrase in text_lower

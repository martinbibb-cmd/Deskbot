"""
Deskbot - Desktop Companion Application
Main application entry point and loop
"""

import os
import sys
import threading
import time
from dotenv import load_dotenv

from gui import DeskbotGUI
from voice_recognition import VoiceRecognition
from openai_integration import OpenAIIntegration
from text_to_speech import TextToSpeech
from face_tracking import FaceTracking


class Deskbot:
    """Main Deskbot application class"""
    
    def __init__(self):
        """Initialize Deskbot application"""
        # Load environment variables
        load_dotenv()
        
        # Initialize components
        self.gui = DeskbotGUI()
        self.voice_recognition = VoiceRecognition()
        self.openai_integration = OpenAIIntegration()
        self.tts = TextToSpeech()
        self.face_tracking = FaceTracking()
        
        # Application state
        self.running = True
        self.listening = False
        
        # Check if features are enabled
        self.voice_enabled = os.getenv('VOICE_ENABLED', 'true').lower() == 'true'
        self.face_tracking_enabled = os.getenv('FACE_TRACKING_ENABLED', 'true').lower() == 'true'
        
    def start_voice_recognition_thread(self):
        """Start voice recognition in a separate thread"""
        def voice_loop():
            while self.running:
                if self.voice_enabled and self.listening:
                    try:
                        # Listen for wake word or commands
                        text = self.voice_recognition.listen()
                        if text:
                            print(f"Heard: {text}")
                            self.gui.update_status(f"Heard: {text}")
                            
                            # Process with OpenAI
                            response = self.openai_integration.get_response(text)
                            print(f"Response: {response}")
                            
                            # Update GUI to show talking
                            self.gui.set_expression("talking")
                            
                            # Speak response
                            self.tts.speak(response)
                            
                            # Reset to normal expression
                            self.gui.set_expression("normal")
                            
                    except Exception as e:
                        print(f"Voice recognition error: {e}")
                        self.gui.update_status(f"Error: {e}")
                else:
                    time.sleep(0.1)
        
        voice_thread = threading.Thread(target=voice_loop, daemon=True)
        voice_thread.start()
        
    def start_face_tracking_thread(self):
        """Start face tracking in a separate thread"""
        def face_tracking_loop():
            while self.running:
                if self.face_tracking_enabled:
                    try:
                        # Get face position
                        face_position = self.face_tracking.get_face_position()
                        if face_position:
                            # Update eye position based on face location
                            self.gui.update_eye_position(face_position)
                    except Exception as e:
                        print(f"Face tracking error: {e}")
                else:
                    time.sleep(0.1)
        
        face_thread = threading.Thread(target=face_tracking_loop, daemon=True)
        face_thread.start()
        
    def toggle_listening(self):
        """Toggle listening state"""
        self.listening = not self.listening
        if self.listening:
            self.gui.update_status("Listening...")
            self.gui.set_expression("happy")
        else:
            self.gui.update_status("Not listening")
            self.gui.set_expression("normal")
    
    def run(self):
        """Main application loop"""
        print("Starting Deskbot...")
        
        # Set up GUI callbacks
        self.gui.set_toggle_listening_callback(self.toggle_listening)
        
        # Start background threads
        self.start_voice_recognition_thread()
        self.start_face_tracking_thread()
        
        # Start GUI (blocking call)
        try:
            self.gui.run()
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            self.running = False
            self.face_tracking.cleanup()


def main():
    """Main entry point"""
    # Check for API key
    load_dotenv()
    if not os.getenv('OPENAI_API_KEY'):
        print("Warning: OPENAI_API_KEY not found in .env file")
        print("Please copy .env.example to .env and add your API key")
    
    # Create and run application
    app = Deskbot()
    app.run()


if __name__ == "__main__":
    main()

"""
Face Tracking Module for Deskbot
Uses OpenCV for face detection and tracking
"""

import cv2
import numpy as np


class FaceTracking:
    """Face tracking class for eye movement"""
    
    def __init__(self):
        """Initialize face tracking"""
        try:
            # Initialize webcam
            self.cap = cv2.VideoCapture(0)
            
            if not self.cap.isOpened():
                print("Warning: Could not open webcam")
                self.cap = None
            else:
                # Set camera properties for better performance
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
                print("Face tracking initialized successfully")
            
            # Load face detection cascade
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Tracking state
            self.last_face_position = None
            
        except Exception as e:
            print(f"Error initializing face tracking: {e}")
            self.cap = None
    
    def get_face_position(self):
        """Get normalized face position
        
        Returns:
            Tuple of (x, y) normalized coordinates (-1 to 1) or None
        """
        if not self.cap:
            return None
        
        try:
            # Capture frame
            ret, frame = self.cap.read()
            if not ret:
                return self.last_face_position
            
            # Convert to grayscale for detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            if len(faces) > 0:
                # Get the largest face (closest to camera)
                face = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = face
                
                # Calculate face center
                face_center_x = x + w // 2
                face_center_y = y + h // 2
                
                # Get frame dimensions
                frame_height, frame_width = frame.shape[:2]
                frame_center_x = frame_width // 2
                frame_center_y = frame_height // 2
                
                # Normalize to -1 to 1 range
                normalized_x = (face_center_x - frame_center_x) / (frame_width // 2)
                normalized_y = (face_center_y - frame_center_y) / (frame_height // 2)
                
                # Clamp values
                normalized_x = max(-1, min(1, normalized_x))
                normalized_y = max(-1, min(1, normalized_y))
                
                # Store for smoothing
                self.last_face_position = (normalized_x, normalized_y)
                
                return (normalized_x, normalized_y)
            else:
                # No face detected, return to center
                if self.last_face_position:
                    # Gradually return to center
                    x, y = self.last_face_position
                    x *= 0.95
                    y *= 0.95
                    if abs(x) < 0.01 and abs(y) < 0.01:
                        self.last_face_position = (0, 0)
                    else:
                        self.last_face_position = (x, y)
                    return self.last_face_position
                return (0, 0)
                
        except Exception as e:
            print(f"Error in face tracking: {e}")
            return self.last_face_position
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
            print("Face tracking cleaned up")

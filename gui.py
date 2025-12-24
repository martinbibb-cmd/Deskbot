"""
GUI Module for Deskbot
Uses CustomTkinter for modern UI with animated eyes
"""

import customtkinter as ctk
import math
import time


class DeskbotGUI:
    """Main GUI class for Deskbot"""
    
    def __init__(self):
        """Initialize the GUI"""
        # Set appearance
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Create main window
        self.root = ctk.CTk()
        self.root.title("Deskbot")
        self.root.geometry("600x500")
        
        # Eye animation state
        self.left_eye_x = 0
        self.left_eye_y = 0
        self.right_eye_x = 0
        self.right_eye_y = 0
        self.target_eye_x = 0
        self.target_eye_y = 0
        
        # Expression state
        self.expression = "normal"
        self.blink_timer = 0
        self.is_blinking = False
        
        # Callback
        self.toggle_listening_callback = None
        
        # Create UI elements
        self.create_ui()
        
        # Start animation loop
        self.animate()
        
    def create_ui(self):
        """Create UI elements"""
        # Title
        title_label = ctk.CTkLabel(
            self.root,
            text="Deskbot",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=20)
        
        # Face canvas
        self.canvas = ctk.CTkCanvas(
            self.root,
            width=400,
            height=250,
            bg="#2b2b2b",
            highlightthickness=0
        )
        self.canvas.pack(pady=20)
        
        # Status label
        self.status_label = ctk.CTkLabel(
            self.root,
            text="Ready",
            font=ctk.CTkFont(size=14)
        )
        self.status_label.pack(pady=10)
        
        # Control buttons
        button_frame = ctk.CTkFrame(self.root)
        button_frame.pack(pady=10)
        
        self.listen_button = ctk.CTkButton(
            button_frame,
            text="Start Listening",
            command=self.on_toggle_listening
        )
        self.listen_button.pack(side="left", padx=10)
        
        quit_button = ctk.CTkButton(
            button_frame,
            text="Quit",
            command=self.root.quit
        )
        quit_button.pack(side="left", padx=10)
        
        # Draw initial face
        self.draw_face()
    
    def draw_face(self):
        """Draw the face with eyes"""
        # Clear canvas
        self.canvas.delete("all")
        
        # Face dimensions
        canvas_width = 400
        canvas_height = 250
        center_x = canvas_width // 2
        center_y = canvas_height // 2
        
        # Eye positions (base)
        left_eye_center_x = center_x - 60
        right_eye_center_x = center_x + 60
        eye_center_y = center_y
        
        # Eye size
        eye_outer_radius = 40
        pupil_radius = 20
        
        if not self.is_blinking:
            # Draw eyes (outer white circles)
            self.canvas.create_oval(
                left_eye_center_x - eye_outer_radius,
                eye_center_y - eye_outer_radius,
                left_eye_center_x + eye_outer_radius,
                eye_center_y + eye_outer_radius,
                fill="white",
                outline=""
            )
            
            self.canvas.create_oval(
                right_eye_center_x - eye_outer_radius,
                eye_center_y - eye_outer_radius,
                right_eye_center_x + eye_outer_radius,
                eye_center_y + eye_outer_radius,
                fill="white",
                outline=""
            )
            
            # Draw pupils
            left_pupil_x = left_eye_center_x + self.left_eye_x
            left_pupil_y = eye_center_y + self.left_eye_y
            
            right_pupil_x = right_eye_center_x + self.right_eye_x
            right_pupil_y = eye_center_y + self.right_eye_y
            
            self.canvas.create_oval(
                left_pupil_x - pupil_radius,
                left_pupil_y - pupil_radius,
                left_pupil_x + pupil_radius,
                left_pupil_y + pupil_radius,
                fill="black",
                outline=""
            )
            
            self.canvas.create_oval(
                right_pupil_x - pupil_radius,
                right_pupil_y - pupil_radius,
                right_pupil_x + pupil_radius,
                right_pupil_y + pupil_radius,
                fill="black",
                outline=""
            )
        else:
            # Draw closed eyes (horizontal lines)
            self.canvas.create_line(
                left_eye_center_x - eye_outer_radius,
                eye_center_y,
                left_eye_center_x + eye_outer_radius,
                eye_center_y,
                fill="white",
                width=4
            )
            
            self.canvas.create_line(
                right_eye_center_x - eye_outer_radius,
                eye_center_y,
                right_eye_center_x + eye_outer_radius,
                eye_center_y,
                fill="white",
                width=4
            )
        
        # Draw mouth based on expression
        mouth_y = center_y + 60
        
        if self.expression == "happy":
            # Happy smile
            self.canvas.create_arc(
                center_x - 40,
                mouth_y - 20,
                center_x + 40,
                mouth_y + 20,
                start=180,
                extent=180,
                outline="white",
                width=3,
                style="arc"
            )
        elif self.expression == "talking":
            # Open mouth (circle)
            self.canvas.create_oval(
                center_x - 20,
                mouth_y - 15,
                center_x + 20,
                mouth_y + 15,
                fill="black",
                outline="white",
                width=2
            )
        else:
            # Normal expression (slight smile)
            self.canvas.create_arc(
                center_x - 30,
                mouth_y - 10,
                center_x + 30,
                mouth_y + 10,
                start=180,
                extent=180,
                outline="white",
                width=2,
                style="arc"
            )
    
    def animate(self):
        """Animation loop for smooth eye movement"""
        # Smooth eye movement
        smoothing = 0.15
        self.left_eye_x += (self.target_eye_x - self.left_eye_x) * smoothing
        self.left_eye_y += (self.target_eye_y - self.left_eye_y) * smoothing
        self.right_eye_x += (self.target_eye_x - self.right_eye_x) * smoothing
        self.right_eye_y += (self.target_eye_y - self.right_eye_y) * smoothing
        
        # Blinking logic
        self.blink_timer += 1
        if self.blink_timer > 150:  # Blink every ~150 frames (3 seconds at 50fps)
            self.is_blinking = True
            if self.blink_timer > 155:  # Blink duration
                self.is_blinking = False
                self.blink_timer = 0
        
        # Redraw face
        self.draw_face()
        
        # Schedule next frame
        self.root.after(20, self.animate)  # ~50 fps
    
    def update_eye_position(self, position):
        """Update target eye position based on face tracking
        
        Args:
            position: Tuple of (x, y) normalized coordinates (-1 to 1)
        """
        if position:
            x, y = position
            # Limit movement range
            max_movement = 15
            self.target_eye_x = x * max_movement
            self.target_eye_y = y * max_movement
    
    def set_expression(self, expression):
        """Set facial expression
        
        Args:
            expression: One of "normal", "happy", "talking"
        """
        self.expression = expression
    
    def update_status(self, status):
        """Update status text"""
        self.status_label.configure(text=status)
    
    def set_toggle_listening_callback(self, callback):
        """Set callback for toggle listening button"""
        self.toggle_listening_callback = callback
    
    def on_toggle_listening(self):
        """Handle toggle listening button click"""
        if self.toggle_listening_callback:
            self.toggle_listening_callback()
            # Update button text
            current_text = self.listen_button.cget("text")
            if "Start" in current_text:
                self.listen_button.configure(text="Stop Listening")
            else:
                self.listen_button.configure(text="Start Listening")
    
    def run(self):
        """Start the GUI main loop"""
        self.root.mainloop()

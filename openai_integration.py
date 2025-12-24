"""
OpenAI Integration Module for Deskbot
Handles conversation and personality using OpenAI API
"""

import os
from openai import OpenAI


class OpenAIIntegration:
    """OpenAI integration for conversation"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("Warning: OPENAI_API_KEY not set. AI features will not work.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        # Conversation history
        self.conversation_history = [
            {
                "role": "system",
                "content": """You are Deskbot, a friendly desktop companion inspired by the LOOI robot.
You have a cheerful and helpful personality. You enjoy chatting with users and helping them with tasks.
Keep your responses concise and conversational - aim for 1-3 sentences unless more detail is specifically requested.
You can see the user through your camera and track their face to make eye contact.
Be warm, engaging, and occasionally playful in your responses."""
            }
        ]
        
        # Model configuration
        self.model = "gpt-3.5-turbo"
        self.max_tokens = 150
        self.temperature = 0.7
    
    def get_response(self, user_input):
        """Get response from OpenAI
        
        Args:
            user_input: User's text input
            
        Returns:
            AI response text
        """
        if not self.client:
            return "I'm sorry, but I'm not configured properly. Please set up your OpenAI API key."
        
        try:
            # Add user message to history
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.conversation_history,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            # Extract response text
            assistant_message = response.choices[0].message.content
            
            # Add to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            # Limit conversation history length (keep system message + last 18 messages = 19 total)
            if len(self.conversation_history) > 19:
                # Keep system message and recent messages
                self.conversation_history = [self.conversation_history[0]] + self.conversation_history[-18:]
            
            return assistant_message
            
        except Exception as e:
            print(f"Error getting response from OpenAI: {e}")
            return "I'm sorry, I encountered an error processing your request."
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = [self.conversation_history[0]]

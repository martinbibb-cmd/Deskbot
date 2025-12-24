/**
 * Deskbot PWA - Main Application Logic
 * 
 * Features:
 * - Push-to-talk audio recording using MediaRecorder (with WebAudio WAV fallback)
 * - Multipart form upload to Cloudflare Worker
 * - Audio playback with iOS autoplay handling
 * - Session management with localStorage
 * - Error handling for microphone permissions
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// API endpoint - modify this to point to your deployed worker
// Development: '/api/deskbot/turn' (uses dev-server.js mock)
// Production: 'https://your-worker.workers.dev/api/deskbot/turn'
const API_ENDPOINT = '/api/deskbot/turn';

// Session ID stored in localStorage for conversation continuity
const SESSION_ID_KEY = 'deskbot_session_id';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;
let isRecording = false;
let hasInteracted = false; // Track user interaction for iOS autoplay
let audioContext = null; // For WebAudio fallback
let recordingStartTime = null;

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const talkButton = document.getElementById('talkButton');
const recordingIndicator = document.getElementById('recordingIndicator');
const statusMessage = document.getElementById('statusMessage');
const chatMessages = document.getElementById('chatMessages');
const chatContainer = document.getElementById('chatContainer');
const permissionOverlay = document.getElementById('permissionOverlay');
const requestPermissionBtn = document.getElementById('requestPermissionBtn');
const errorOverlay = document.getElementById('errorOverlay');
const errorMessage = document.getElementById('errorMessage');
const dismissErrorBtn = document.getElementById('dismissErrorBtn');
const responseAudio = document.getElementById('responseAudio');
const textInput = document.getElementById('textInput');
const sendButton = document.getElementById('sendButton');
const cameraSection = document.getElementById('cameraSection');
const cameraVideo = document.getElementById('cameraVideo');
const cameraToggle = document.getElementById('cameraToggle');
const botMouth = document.getElementById('botMouth');

// Camera state
let cameraStream = null;
let isCameraActive = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Deskbot PWA...');
    
    // Get or create session ID
    const sessionId = getOrCreateSessionId();
    console.log('Session ID:', sessionId);
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for microphone support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Your browser does not support audio recording. Please use a modern browser.');
        return;
    }
    
    console.log('Deskbot PWA initialized successfully');
}

/**
 * Get or create a session ID for conversation continuity
 */
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
        // Generate a new session ID
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Use both touch and pointer events for maximum compatibility
    
    // Touch events (mobile)
    talkButton.addEventListener('touchstart', handleRecordStart, { passive: false });
    talkButton.addEventListener('touchend', handleRecordStop, { passive: false });
    talkButton.addEventListener('touchcancel', handleRecordStop, { passive: false });
    
    // Pointer events (desktop and modern mobile)
    talkButton.addEventListener('pointerdown', handleRecordStart);
    talkButton.addEventListener('pointerup', handleRecordStop);
    talkButton.addEventListener('pointercancel', handleRecordStop);
    
    // Permission request button
    requestPermissionBtn.addEventListener('click', requestMicrophonePermission);
    
    // Error dismiss button
    dismissErrorBtn.addEventListener('click', hideError);
    
    // Track first user interaction for iOS autoplay
    document.addEventListener('click', () => { hasInteracted = true; }, { once: true });
    document.addEventListener('touchstart', () => { hasInteracted = true; }, { once: true });

    // Text chat event listeners
    sendButton.addEventListener('click', handleTextSend);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextSend();
        }
    });

    // Camera toggle event listener
    cameraToggle.addEventListener('click', toggleCamera);
}

// ============================================================================
// RECORDING HANDLERS
// ============================================================================

/**
 * Handle record start event
 */
async function handleRecordStart(event) {
    event.preventDefault();
    
    // Prevent multiple simultaneous recordings
    if (isRecording) {
        return;
    }
    
    hasInteracted = true; // Mark user interaction for iOS
    
    console.log('Starting recording...');
    
    try {
        await startRecording();
    } catch (error) {
        console.error('Failed to start recording:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showPermissionPrompt();
        } else {
            showError('Failed to start recording: ' + error.message);
        }
    }
}

/**
 * Handle record stop event
 */
function handleRecordStop(event) {
    event.preventDefault();
    
    if (!isRecording) {
        return;
    }
    
    console.log('Stopping recording...');
    stopRecording();
}

/**
 * Start audio recording
 */
async function startRecording() {
    // Request microphone access
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
        throw error;
    }
    
    // Clear previous audio chunks
    audioChunks = [];
    
    // Try to use MediaRecorder (preferred)
    if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm')) {
        await startMediaRecorder(mediaStream);
    } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) {
        await startMediaRecorder(mediaStream, 'audio/mp4');
    } else {
        // Fallback to WebAudio WAV encoding
        await startWebAudioRecording(mediaStream);
    }
    
    isRecording = true;
    recordingStartTime = Date.now();

    // Update UI
    talkButton.classList.add('recording');
    recordingIndicator.classList.add('active');
    animateBotTalking(true);
}

/**
 * Start recording using MediaRecorder API
 */
async function startMediaRecorder(stream, mimeType = 'audio/webm') {
    console.log('Using MediaRecorder with', mimeType);
    
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        await handleRecordingComplete(audioBlob);
    };
    
    mediaRecorder.start();
}

/**
 * Start recording using WebAudio API (fallback for browsers without MediaRecorder)
 */
async function startWebAudioRecording(stream) {
    console.log('Using WebAudio recording (fallback)');
    
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    const recordedChunks = [];
    
    processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        recordedChunks.push(new Float32Array(inputData));
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    // Store for cleanup
    mediaRecorder = {
        stop: () => {
            processor.disconnect();
            source.disconnect();
            
            // Convert Float32Array to WAV
            const audioBlob = encodeWAV(recordedChunks, audioContext.sampleRate);
            handleRecordingComplete(audioBlob);
        }
    };
}

/**
 * Stop audio recording
 */
function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        return;
    }
    
    isRecording = false;
    
    // Stop the recorder
    mediaRecorder.stop();
    
    // Stop all media tracks
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    // Update UI
    talkButton.classList.remove('recording');
    recordingIndicator.classList.remove('active');
    animateBotTalking(false);

    // Show processing status
    const duration = ((Date.now() - recordingStartTime) / 1000).toFixed(1);
    showStatus(`Processing ${duration}s of audio...`);
}

/**
 * Handle recording completion and upload
 */
async function handleRecordingComplete(audioBlob) {
    console.log('Recording complete, size:', audioBlob.size, 'bytes');
    
    // Validate recording duration (at least 0.5 seconds)
    const duration = (Date.now() - recordingStartTime) / 1000;
    if (duration < 0.5) {
        showStatus('Recording too short, please try again');
        return;
    }
    
    // Add user message placeholder
    addMessage('user', 'Processing audio...');
    
    try {
        // Upload audio and get response
        const response = await uploadAudio(audioBlob);
        
        // Update user message with transcript
        updateLastUserMessage(response.transcript || 'Audio sent');
        
        // Add assistant response
        if (response.replyText) {
            addMessage('assistant', response.replyText);

            // Play audio response if available, otherwise use TTS
            if (response.replyAudioUrl) {
                await playAudioResponse(response.replyAudioUrl);
            } else {
                // Use text-to-speech for the response
                speakText(response.replyText);
            }
        }

        hideStatus();
        
    } catch (error) {
        console.error('Failed to process recording:', error);
        showError('Failed to process your message: ' + error.message);
        
        // Remove the placeholder message
        removeLastUserMessage();
    }
}

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Upload audio to the backend API
 */
async function uploadAudio(audioBlob) {
    const sessionId = getOrCreateSessionId();
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sessionId', sessionId);
    
    console.log('Uploading audio to:', API_ENDPOINT);
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received response:', data);
        
        return data;
        
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ============================================================================
// AUDIO PLAYBACK & TEXT-TO-SPEECH
// ============================================================================

/**
 * Play audio response from URL
 */
async function playAudioResponse(audioUrl) {
    console.log('Playing audio response:', audioUrl);

    try {
        // For iOS, audio playback must be triggered by user interaction
        // Since we're in the context of a user interaction (button release), this should work
        responseAudio.src = audioUrl;

        // Attempt to play
        const playPromise = responseAudio.play();

        if (playPromise !== undefined) {
            await playPromise;
            console.log('Audio playback started');
        }

    } catch (error) {
        console.error('Audio playback failed:', error);
        // Don't show error to user, just log it
        // Audio playback failure shouldn't break the app
    }
}

/**
 * Speak text using Web Speech API (TTS)
 */
function speakText(text) {
    // Check if Web Speech API is supported
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice settings
    utterance.rate = 1.0;  // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    // Animate mouth while speaking
    utterance.onstart = () => {
        animateBotTalking(true);
        console.log('TTS started');
    };

    utterance.onend = () => {
        animateBotTalking(false);
        console.log('TTS ended');
    };

    utterance.onerror = (event) => {
        animateBotTalking(false);
        console.error('TTS error:', event);
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Add a message to the chat
 */
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    const textP = document.createElement('p');
    textP.textContent = text;
    
    bubbleDiv.appendChild(textP);
    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Update the last user message (used to replace placeholder with transcript)
 */
function updateLastUserMessage(text) {
    const userMessages = chatMessages.querySelectorAll('.message.user');
    if (userMessages.length > 0) {
        const lastMessage = userMessages[userMessages.length - 1];
        const bubble = lastMessage.querySelector('.message-bubble p');
        if (bubble) {
            bubble.textContent = text;
        }
    }
}

/**
 * Remove the last user message (used when upload fails)
 */
function removeLastUserMessage() {
    const userMessages = chatMessages.querySelectorAll('.message.user');
    if (userMessages.length > 0) {
        const lastMessage = userMessages[userMessages.length - 1];
        lastMessage.remove();
    }
}

/**
 * Show status message
 */
function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.classList.add('show');
}

/**
 * Hide status message
 */
function hideStatus() {
    statusMessage.classList.remove('show');
}

/**
 * Show permission prompt
 */
function showPermissionPrompt() {
    permissionOverlay.style.display = 'flex';
}

/**
 * Hide permission prompt
 */
function hidePermissionPrompt() {
    permissionOverlay.style.display = 'none';
}

/**
 * Request microphone permission
 */
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission granted, stop the stream
        stream.getTracks().forEach(track => track.stop());
        hidePermissionPrompt();
        showStatus('Microphone access granted!');
        setTimeout(hideStatus, 2000);
    } catch (error) {
        console.error('Permission denied:', error);
        showError('Microphone permission denied. Please enable it in your browser settings.');
    }
}

/**
 * Show error overlay
 */
function showError(message) {
    errorMessage.textContent = message;
    errorOverlay.style.display = 'flex';
}

/**
 * Hide error overlay
 */
function hideError() {
    errorOverlay.style.display = 'none';
}

// ============================================================================
// CAMERA FUNCTIONS
// ============================================================================

/**
 * Toggle camera on/off
 */
async function toggleCamera() {
    if (isCameraActive) {
        // Turn off camera
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraVideo.srcObject = null;
        cameraSection.style.display = 'none';
        isCameraActive = false;
        cameraToggle.textContent = '📷 Enable Camera';
    } else {
        // Turn on camera
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            cameraVideo.srcObject = cameraStream;
            cameraSection.style.display = 'block';
            isCameraActive = true;
            cameraToggle.textContent = '📷 Disable Camera';
        } catch (error) {
            console.error('Camera access error:', error);
            showError('Could not access camera: ' + error.message);
        }
    }
}

// ============================================================================
// TEXT CHAT FUNCTIONS
// ============================================================================

/**
 * Handle text message send
 */
async function handleTextSend() {
    const text = textInput.value.trim();

    if (!text) {
        return;
    }

    // Clear input
    textInput.value = '';
    sendButton.disabled = true;

    // Add user message
    addMessage('user', text);

    // Animate bot thinking
    animateBotTalking(true);
    showStatus('Thinking...');

    try {
        // Send text message to backend
        const response = await sendTextMessage(text);

        // Add assistant response
        if (response.replyText) {
            addMessage('assistant', response.replyText);

            // Play audio response if available, otherwise use TTS
            if (response.replyAudioUrl) {
                await playAudioResponse(response.replyAudioUrl);
            } else {
                // Use text-to-speech for the response
                speakText(response.replyText);
            }
        }

        hideStatus();

    } catch (error) {
        console.error('Failed to send message:', error);
        showError('Failed to send your message: ' + error.message);
    } finally {
        animateBotTalking(false);
        sendButton.disabled = false;
    }
}

/**
 * Send text message to the backend API
 */
async function sendTextMessage(text) {
    const sessionId = getOrCreateSessionId();

    console.log('Sending text message to:', API_ENDPOINT);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                sessionId: sessionId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Received response:', data);

        return data;

    } catch (error) {
        console.error('Send error:', error);
        throw error;
    }
}

// ============================================================================
// BOT FACE ANIMATION
// ============================================================================

/**
 * Animate bot face when talking/thinking
 */
function animateBotTalking(isTalking) {
    if (isTalking) {
        botMouth.classList.add('talking');
    } else {
        botMouth.classList.remove('talking');
    }
}

// ============================================================================
// AUDIO ENCODING HELPERS (for WebAudio fallback)
// ============================================================================

/**
 * Encode Float32Array audio data to WAV format
 */
function encodeWAV(samples, sampleRate) {
    // Flatten the array of Float32Arrays
    const buffer = new Float32Array(samples.reduce((acc, val) => acc + val.length, 0));
    let offset = 0;
    for (const chunk of samples) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }
    
    // Convert to 16-bit PCM
    const pcmData = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(wavBuffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Audio format
    view.setUint16(22, 1, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    
    // Write PCM data
    const pcmView = new Int16Array(wavBuffer, 44);
    pcmView.set(pcmData);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Write string to DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

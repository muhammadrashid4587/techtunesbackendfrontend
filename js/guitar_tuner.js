// enhanced_guitar_tuner.js
// ───── Enhanced Guitar Tuner with Better Pitch Detection ─────────

// Audio context initialization
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Initialize audio context on first user interaction
document.body.addEventListener('click', () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => console.log('🔊 AudioContext resumed!'));
    }
  }
}, { once: true });

// ───── Configuration ─────────────────────────────────────────
const API_BASE_URL = 'http://127.0.0.1:8000';
const RECORDING_DURATION = 2000; // 2 seconds
const AUTO_TUNE_INTERVAL = 3000;  // 3 seconds for auto mode

// Note mapping for frontend string IDs to backend note names
const STRING_TO_NOTE = {
  'e-low': 'E2',
  'a': 'A2',
  'd': 'D3',
  'g': 'G3',
  'b': 'B3',
  'e-high': 'E4'
};

const NOTE_TO_STRING = Object.fromEntries(
  Object.entries(STRING_TO_NOTE).map(([k, v]) => [v, k])
);

// ───── Global State ─────────────────────────────────────────
let currentString = 'g';
let autoMode = true;
let isRecording = false;
let autoTuneInterval = null;
let mediaStream = null;
let analyserNode = null;
let scriptProcessor = null;

// Enhanced pitch detection state
let pitchBuffer = [];
let pitchHistory = [];
const PITCH_HISTORY_SIZE = 10;
const BUFFER_SIZE = 16384; // Larger buffer for better low frequency detection

// ───── DOM Elements ─────────────────────────────────────────
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  elements = {
    letters: document.querySelectorAll('.string-letter'),
    strings: document.querySelectorAll('.guitar-string'),
    meters: document.querySelectorAll('.string-meter'),
    meterArrows: document.querySelectorAll('.meter-arrow'),
    toggle: document.getElementById('autoToggle'),
    toggleLabel: document.querySelector('.toggle-label')
  };

  // Initialize event listeners
  initEventListeners();
  
  // Start with G string selected and auto mode enabled
  selectString('g');
  if (autoMode) {
    startAutoTuning();
  }
});

// ───── Event Listeners ─────────────────────────────────────
function initEventListeners() {
  // String selection
  elements.letters.forEach(letter => {
    letter.addEventListener('click', () => {
      const stringKey = letter.id.replace('letter-', '');
      selectString(stringKey);
      
      // In manual mode, immediately start tuning
      if (!autoMode && !isRecording) {
        tuneCurrentString();
      }
    });
  });

  // Toggle mode switch
  elements.toggle.addEventListener('click', toggleMode);
}

// ───── Enhanced Audio Recording with Real-time Analysis ─────────────────
async function startEnhancedAudioCapture() {
  try {
    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
    }

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    // Create nodes for real-time analysis
    const source = audioCtx.createMediaStreamSource(mediaStream);
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = BUFFER_SIZE;
    analyserNode.smoothingTimeConstant = 0.8;

    // Create bandpass filter for guitar frequencies
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 70; // Filter out below 70Hz
    highpass.Q.value = 0.7;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 500; // Filter out above 500Hz
    lowpass.Q.value = 0.7;

    // Connect audio chain
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(analyserNode);

    return true;
  } catch (error) {
    console.error('Audio capture failed:', error);
    return false;
  }
}

// ───── Enhanced Pitch Detection Algorithm ─────────────────────
function detectPitchEnhanced(buffer) {
  // Normalize the buffer
  let maxVal = 0;
  for (let i = 0; i < buffer.length; i++) {
    maxVal = Math.max(maxVal, Math.abs(buffer[i]));
  }
  
  if (maxVal < 0.01) return -1; // Signal too weak
  
  // Normalize
  const normalized = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    normalized[i] = buffer[i] / maxVal;
  }
  
  // Enhanced autocorrelation with window function
  const SIZE = normalized.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  const correlations = new Array(MAX_SAMPLES);
  
  // Apply Hann window to reduce spectral leakage
  for (let i = 0; i < SIZE; i++) {
    normalized[i] *= 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (SIZE - 1));
  }
  
  // Calculate autocorrelation
  for (let i = 0; i < MAX_SAMPLES; i++) {
    let sum = 0;
    for (let j = 0; j < MAX_SAMPLES; j++) {
      sum += normalized[j] * normalized[j + i];
    }
    correlations[i] = sum;
  }
  
  // Find the first peak after the zero lag
  let d = 0;
  while (correlations[d] > correlations[d + 1]) d++;
  
  // Find the highest peak in the range of guitar frequencies
  let maxval = -1;
  let maxpos = -1;
  const minPeriod = Math.floor(audioCtx.sampleRate / 400); // 400 Hz max
  const maxPeriod = Math.floor(audioCtx.sampleRate / 70);  // 70 Hz min
  
  for (let i = minPeriod; i < maxPeriod && i < MAX_SAMPLES; i++) {
    if (correlations[i] > maxval) {
      maxval = correlations[i];
      maxpos = i;
    }
  }
  
  // Use parabolic interpolation for better accuracy
  let T0 = maxpos;
  if (maxpos > 0 && maxpos < correlations.length - 1) {
    const y1 = correlations[maxpos - 1];
    const y2 = correlations[maxpos];
    const y3 = correlations[maxpos + 1];
    
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    if (a) T0 = maxpos - b / (2 * a);
  }
  
  // Calculate confidence based on correlation strength
  const confidence = correlations[maxpos] / correlations[0];
  
  if (confidence < 0.9) return -1; // Not confident enough
  
  return audioCtx.sampleRate / T0;
}

// ───── Enhanced Recording with Continuous Analysis ─────────────────
async function recordAndAnalyzeAudio(duration = RECORDING_DURATION) {
  try {
    // Ensure audio capture is started
    if (!analyserNode) {
      const success = await startEnhancedAudioCapture();
      if (!success) throw new Error('Failed to start audio capture');
    }

    // Show recording indicator
    updateTuningStatus('🎤 Listening... Play your note clearly', 'recording');
    
    isRecording = true;
    const startTime = Date.now();
    const frequencies = [];
    
    // Continuous analysis during recording
    const analyzeFrame = () => {
      if (!isRecording || Date.now() - startTime > duration) {
        isRecording = false;
        
        // Process collected frequencies
        if (frequencies.length > 0) {
          // Use median for stability
          frequencies.sort((a, b) => a - b);
          const medianFreq = frequencies[Math.floor(frequencies.length / 2)];
          
          // Add to history for smoothing
          pitchHistory.push(medianFreq);
          if (pitchHistory.length > PITCH_HISTORY_SIZE) {
            pitchHistory.shift();
          }
          
          // Calculate average from recent history
          const avgFreq = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
          
          return avgFreq;
        }
        return null;
      }
      
      // Get time domain data
      const buffer = new Float32Array(analyserNode.fftSize);
      analyserNode.getFloatTimeDomainData(buffer);
      
      // Detect pitch
      const frequency = detectPitchEnhanced(buffer);
      if (frequency > 0) {
        frequencies.push(frequency);
      }
      
      // Continue analysis
      requestAnimationFrame(analyzeFrame);
    };
    
    // Start analysis loop
    return new Promise((resolve) => {
      analyzeFrame();
      setTimeout(() => {
        isRecording = false;
        const result = analyzeFrame();
        resolve(result);
      }, duration);
    });

  } catch (error) {
    console.error('Recording failed:', error);
    isRecording = false;
    throw error;
  }
}

// ───── Enhanced Backend Communication ─────────────────────────────────
async function sendAudioForTuning(audioBlob, targetNote = null) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'guitar_recording.webm');
    
    if (targetNote) {
      formData.append('note', targetNote);
    }

    const response = await fetch(`${API_BASE_URL}/tune`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to analyze audio:', error);
    
    // Fallback to client-side detection if server is down
    if (error.message.includes('Failed to fetch')) {
      console.log('Using client-side pitch detection as fallback');
      return null; // Signal to use client-side result
    }
    throw error;
  }
}

// ───── Enhanced Tuning Logic ─────────────────────────────────────────
async function tuneCurrentString() {
  if (isRecording) return;

  try {
    // Use enhanced client-side analysis
    const detectedFrequency = await recordAndAnalyzeAudio();
    
    if (!detectedFrequency || detectedFrequency <= 0) {
      updateTuningStatus('❌ No clear pitch detected. Try playing louder.', 'error');
      return;
    }
    
    // Find closest note
    let closestNote = null;
    let minCentsDiff = Infinity;
    let targetFreq = 0;
    
    const noteFrequencies = {
      'E2': 82.41,
      'A2': 110.00,
      'D3': 146.83,
      'G3': 196.00,
      'B3': 246.94,
      'E4': 329.63
    };
    
    for (const [note, freq] of Object.entries(noteFrequencies)) {
      const cents = 1200 * Math.log2(detectedFrequency / freq);
      if (Math.abs(cents) < Math.abs(minCentsDiff)) {
        minCentsDiff = cents;
        closestNote = note;
        targetFreq = freq;
      }
    }
    
    // Create tuning data object
    const tuningData = {
      note: closestNote,
      frequency: detectedFrequency,
      target_frequency: targetFreq,
      cents: minCentsDiff,
      in_tune: Math.abs(minCentsDiff) <= 5,
      direction: minCentsDiff > 0 ? 'sharp' : (minCentsDiff < 0 ? 'flat' : 'perfect')
    };
    
    // Update UI with enhanced feedback
    updateTunerUIEnhanced(tuningData);
    
  } catch (error) {
    console.error('Tuning failed:', error);
    updateTuningStatus('❌ Error: ' + error.message, 'error');
  }
}

// ───── Enhanced UI Updates with Better Feedback ─────────────────────────
function updateTunerUIEnhanced(tuningData) {
  console.log('Tuning result:', tuningData);
  
  // Map backend note to frontend string
  const detectedString = NOTE_TO_STRING[tuningData.note];
  
  if (detectedString) {
    // In auto mode, switch to detected string
    if (autoMode) {
      selectString(detectedString);
    }
  }
  
  // Update meter arrow with smooth animation
  const currentMeter = document.getElementById(`meter-${detectedString || currentString}`);
  if (currentMeter) {
    const arrow = currentMeter.querySelector('.meter-arrow');
    if (arrow) {
      // Enhanced rotation calculation with easing
      const maxCents = 50;
      const maxRotation = 45;
      let rotation = (tuningData.cents / maxCents) * maxRotation;
      rotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));
      
      // Apply smooth transition
      arrow.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      arrow.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      
      // Update arrow image based on tuning status
      if (tuningData.in_tune) {
        arrow.src = arrow.dataset.clicked;
        currentMeter.classList.add('checked');
      } else {
        arrow.src = arrow.dataset.unclicked;
        currentMeter.classList.remove('checked');
      }
    }
  }
  
  // Enhanced status message with frequency info
  const freqDisplay = `${tuningData.frequency.toFixed(1)}Hz`;
  const targetDisplay = `(target: ${tuningData.target_frequency.toFixed(1)}Hz)`;
  
  if (tuningData.in_tune) {
    updateTuningStatus(`✅ Perfect! ${tuningData.note} - ${freqDisplay}`, 'in-tune');
  } else {
    const direction = tuningData.direction === 'sharp' ? 'too high ⬇️' : 'too low ⬆️';
    const centsAbs = Math.abs(tuningData.cents).toFixed(1);
    
    // Add specific tuning instructions
    let instruction = '';
    if (Math.abs(tuningData.cents) > 20) {
      instruction = tuningData.direction === 'sharp' ? 
        ' - Turn peg counter-clockwise' : 
        ' - Turn peg clockwise';
    }
    
    updateTuningStatus(
      `${tuningData.note}: ${centsAbs}¢ ${direction} ${targetDisplay}${instruction}`, 
      'out-of-tune'
    );
  }
}

// Keep all the original UI functions unchanged
function selectString(stringKey) {
  // Clear all active states
  elements.strings.forEach(el => el.classList.remove('active'));
  elements.letters.forEach(el => el.classList.remove('active'));
  elements.meters.forEach(el => {
    el.classList.remove('active', 'checked');
    const arrow = el.querySelector('.meter-arrow');
    if (arrow) {
      arrow.src = arrow.dataset.unclicked;
      arrow.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    }
  });

  // Set new active states
  const stringEl = document.getElementById(`string-${stringKey}`);
  const letterEl = document.getElementById(`letter-${stringKey}`);
  const meterEl = document.getElementById(`meter-${stringKey}`);
  
  if (stringEl) stringEl.classList.add('active');
  if (letterEl) letterEl.classList.add('active');
  if (meterEl) meterEl.classList.add('active');

  currentString = stringKey;
  
  // Play reference tone
  playReferenceNote(stringKey);
}

function updateTuningStatus(message, className) {
  // Create or update status element
  let statusEl = document.getElementById('tuning-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'tuning-status';
    statusEl.style.cssText = `
      position: absolute;
      top: 260px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 100;
      transition: all 0.3s ease;
    `;
    document.querySelector('.tuner-container').appendChild(statusEl);
  }
  
  statusEl.textContent = message;
  statusEl.className = className;
}

function toggleMode() {
  autoMode = !autoMode;
  
  if (autoMode) {
    elements.toggle.classList.add('active');
    elements.toggleLabel.textContent = 'AUTOMATIC';
    startAutoTuning();
  } else {
    elements.toggle.classList.remove('active');
    elements.toggleLabel.textContent = 'MANUAL';
    stopAutoTuning();
  }
}

function startAutoTuning() {
  stopAutoTuning(); // Clear any existing interval
  
  // Start continuous analysis immediately
  if (!analyserNode) {
    startEnhancedAudioCapture();
  }
  
  autoTuneInterval = setInterval(() => {
    if (autoMode && !isRecording) {
      tuneCurrentString();
    }
  }, AUTO_TUNE_INTERVAL);
}

function stopAutoTuning() {
  if (autoTuneInterval) {
    clearInterval(autoTuneInterval);
    autoTuneInterval = null;
  }
}

function playReferenceNote(stringKey) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  
  const frequencies = {
    'e-low': 82.41,
    'a': 110.00,
    'd': 146.83,
    'g': 196.00,
    'b': 246.94,
    'e-high': 329.63
  };
  
  const frequency = frequencies[stringKey];
  if (!frequency) return;
  
  // Create oscillator for reference tone
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  oscillator.type = 'sine';
  
  // Fade in and out
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 1);
}

function goHome() {
  // Clean up resources before leaving
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  stopAutoTuning();
  
  window.location.href = 'homepage.html';
}

function showPickbot() {
  const messages = [
    "🎸 Welcome to the Enhanced Guitar Tuner! Now with better pitch detection!",
    "🎵 Toggle between Automatic and Manual modes using the switch above.",
    "🎤 Make sure to allow microphone access for tuning to work.",
    "🎯 Play each string clearly for the best tuning results!",
    "💡 Tip: The closer to 0 cents, the more in tune you are!",
    "🔧 Enhanced algorithm now detects low E string more accurately!"
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  alert(`PickBot: ${randomMessage}`);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  stopAutoTuning();
});
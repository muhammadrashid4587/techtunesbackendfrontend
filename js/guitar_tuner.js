// guitar_tuner.js - Updated for Ultra-Accurate Detection
// ───── Works with your existing HTML/CSS design ─────────

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
const API_BASE_URL = 'http://127.0.0.1:8001';
const RECORDING_DURATION = 2000; // 2 seconds
const AUTO_TUNE_INTERVAL = 3000;  // 3 seconds for auto mode
const ERROR_MARGIN = 5; // Professional accuracy

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
let prevDetections = [];
const STABLE_WINDOW = 3; // require 3 consecutive similar detections
const MAX_NOTE_DELTA_CENTS = 15; // tolerance for stability

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
    toggleLabel: document.querySelector('.toggle-label'),
    levelFill: document.getElementById('levelFill'),
    confidenceBadge: document.getElementById('confidenceBadge')
  };

  // Initialize event listeners
  initEventListeners();
  
  // Start with G string selected and auto mode enabled
  selectString('g');
  if (autoMode) {
    startAutoTuning();
  }
  
  // Show startup message
  updateTuningStatus('🎸 Ultra-Accurate Tuner Ready! ±5 cents precision', 'ready');
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

// ───── Audio Recording ─────────────────────────────────────
async function recordAudio(duration = RECORDING_DURATION) {
  try {
    // Request microphone access with optimal settings
    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: { ideal: 44100 },
          channelCount: { ideal: 1 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
    }

    // Live level meter via WebAudio analyser
    const audioSource = audioCtx.createMediaStreamSource(mediaStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioSource.connect(analyser);
    const dataArray = new Uint8Array(analyser.fftSize);
    const levelEl = elements.levelFill;
    let levelAnim;
    function updateLevel() {
      analyser.getByteTimeDomainData(dataArray);
      // Compute peak-to-peak as rough loudness proxy
      let min = 255, max = 0;
      for (let i = 0; i < dataArray.length; i++) { const v = dataArray[i]; if (v < min) min = v; if (v > max) max = v; }
      const p2p = (max - min) / 255; // 0..1
      if (levelEl) levelEl.style.width = Math.min(100, Math.max(0, p2p * 140)) + '%';
      levelAnim = requestAnimationFrame(updateLevel);
    }
    levelAnim = requestAnimationFrame(updateLevel);

    // Create MediaRecorder with best available format
    let options = { audioBitsPerSecond: 128000 };
    
    // Try different mime types in order of preference
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        break;
      }
    }

    const mediaRecorder = new MediaRecorder(mediaStream, options);
    const audioChunks = [];

    // Collect audio data
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start();
    isRecording = true;
    
    // Visual feedback
    showRecordingAnimation();
    
    // Stop after duration
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, duration);

    // Return promise that resolves with audio blob
    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        isRecording = false;
        hideRecordingAnimation();
        if (levelAnim) cancelAnimationFrame(levelAnim);
        const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
        console.log(`🎵 Recording complete: ${audioBlob.size} bytes`);
        resolve(audioBlob);
      };
      
      mediaRecorder.onerror = reject;
    });

  } catch (error) {
    console.error('Recording failed:', error);
    isRecording = false;
    throw error;
  }
}

// ───── Backend Communication ─────────────────────────────────
async function sendAudioForTuning(audioBlob, targetNote = null) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'guitar_recording.webm');
    
    if (targetNote) {
      formData.append('note', targetNote);
    }

    console.log('📤 Sending to ultra-accurate server...');

    const response = await fetch(`${API_BASE_URL}/tune`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      
      // Parse error message
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Server error');
      } catch {
        throw new Error('Server error: ' + response.status);
      }
    }

    const result = await response.json();
    console.log('📥 Analysis result:', result);
    return result;
    
  } catch (error) {
    console.error('Failed to analyze audio:', error);
    throw error;
  }
}

// ───── Tuning Logic ─────────────────────────────────────────
async function tuneCurrentString() {
  if (isRecording) return;

  try {
    // Show recording indicator
    updateTuningStatus('🎤 Listening... Play a single note clearly', 'recording');
    
    // Record audio
    const audioBlob = await recordAudio();
    
    // Show processing indicator
    updateTuningStatus('🔬 Analyzing with advanced algorithms...', 'processing');
    
    // Get target note for current string (only in manual mode)
    const targetNote = autoMode ? null : STRING_TO_NOTE[currentString];
    
    // Send to backend for analysis
    const tuningData = await sendAudioForTuning(audioBlob, targetNote);
    
    // Stable detection: require consistent detections across window
    const detection = {
      note: tuningData.note,
      cents: tuningData.cents || 0,
      confidence: tuningData.confidence || 0,
      ts: Date.now()
    };
    prevDetections.push(detection);
    if (prevDetections.length > STABLE_WINDOW) prevDetections.shift();

    // compute stability
    const allSameNote = prevDetections.every(d => d.note === detection.note);
    const maxDelta = Math.max(...prevDetections.map(d => Math.abs(d.cents - detection.cents)));
    const avgConf = prevDetections.reduce((s,d)=>s+(d.confidence||0),0)/prevDetections.length;
    const isStable = allSameNote && maxDelta <= MAX_NOTE_DELTA_CENTS && avgConf >= 0.6;

    // Update quality/confidence badge
    if (elements.confidenceBadge) {
      elements.confidenceBadge.textContent = `${Math.round((tuningData.confidence||0)*100)} %`;
    }

    if (isStable) {
      // Update UI with results
      updateTunerUI(tuningData);
    } else {
      // Show transient hint without switching meters
      const meterString = NOTE_TO_STRING[tuningData.note] || currentString;
      const currentMeter = document.getElementById(`meter-${meterString}`);
      if (currentMeter) {
        const arrow = currentMeter.querySelector('.meter-arrow');
        if (arrow) {
          const maxCents = 50;
          const maxRotation = 45;
          const rotation = Math.max(-maxRotation, Math.min(maxRotation, (tuningData.cents / maxCents) * maxRotation));
          arrow.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
      }
      updateTuningStatus(`👂 Detected ${tuningData.note} (stabilizing…)`, 'processing');
    }
    
  } catch (error) {
    console.error('Tuning failed:', error);
    
    let errorMessage = '❌ ';
    if (error.message.includes('No clear pitch')) {
      errorMessage += 'No note detected - Play louder or closer to mic';
    } else if (error.message.includes('Audio too short')) {
      errorMessage += 'Recording too short - Try again';
    } else if (error.message.includes('outside guitar range')) {
      errorMessage += 'Frequency outside guitar range';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Server connection error - Check if server is running';
    } else {
      errorMessage += error.message;
    }
    
    updateTuningStatus(errorMessage, 'error');
  }
}

// ───── UI Updates ─────────────────────────────────────────
function updateTunerUI(tuningData) {
  console.log('🎯 Tuning result:', tuningData);
  
  // Validate data
  if (!tuningData || !tuningData.note) {
    console.error('Invalid tuning data');
    return;
  }
  
  // Map backend note to frontend string
  const detectedString = NOTE_TO_STRING[tuningData.note];
  
  if (detectedString && autoMode) {
    // In auto mode, switch to detected string
    selectString(detectedString);
  }
  
  // Update meter arrow
  const meterString = detectedString || currentString;
  const currentMeter = document.getElementById(`meter-${meterString}`);
  
  if (currentMeter) {
    const arrow = currentMeter.querySelector('.meter-arrow');
    if (arrow) {
      // Calculate arrow rotation based on cents
      const maxCents = 50;
      const maxRotation = 45;
      
      // Use logarithmic scale for better visual feedback
      let visualCents = Math.sign(tuningData.cents) * Math.log(Math.abs(tuningData.cents) + 1) / Math.log(maxCents + 1) * maxCents;
      let rotation = (visualCents / maxCents) * maxRotation;
      rotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));
      
      // Apply rotation with smooth transition
      arrow.style.transition = 'transform 0.3s ease-out';
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
  
  // Create detailed status message
  const freqDisplay = `${tuningData.frequency.toFixed(1)}Hz`;
  const targetDisplay = `(target: ${tuningData.target_frequency.toFixed(1)}Hz)`;
  const confidenceDisplay = tuningData.confidence ? ` • ${(tuningData.confidence * 100).toFixed(0)}% conf` : '';
  
  if (tuningData.in_tune) {
    updateTuningStatus(
      `✅ Perfect! ${tuningData.note} - ${freqDisplay}${confidenceDisplay}`, 
      'in-tune'
    );
    // Play success sound
    playSuccessSound();
  } else {
    const centsAbs = Math.abs(tuningData.cents).toFixed(1);
    const direction = tuningData.direction === 'sharp' ? 'HIGH ⬇️' : 'LOW ⬆️';
    
    // Tuning instructions based on deviation
    let instruction = '';
    if (Math.abs(tuningData.cents) > 30) {
      instruction = tuningData.direction === 'sharp' ? 
        ' Turn peg LEFT' : ' Turn peg RIGHT';
    } else if (Math.abs(tuningData.cents) > 10) {
      instruction = ' Small adjustment';
    } else {
      instruction = ' Almost there!';
    }
    
    updateTuningStatus(
      `${tuningData.note}: ${centsAbs}¢ ${direction} ${targetDisplay}${instruction}${confidenceDisplay}`, 
      'out-of-tune'
    );
  }
  
  // Show low confidence warning if needed
  if (tuningData.confidence && tuningData.confidence < 0.7) {
    setTimeout(() => {
      updateTuningStatus(
        '⚠️ Low confidence - Try playing clearer or check for noise', 
        'warning'
      );
    }, 2500);
  }
}

// ───── Visual Feedback ─────────────────────────────────────
function showRecordingAnimation() {
  // Add pulsing effect to all string letters during recording
  elements.letters.forEach(letter => {
    letter.style.animation = 'pulse 1s infinite';
  });
}

function hideRecordingAnimation() {
  // Remove animation
  elements.letters.forEach(letter => {
    letter.style.animation = '';
  });
}

// ───── Original UI Functions (unchanged) ─────────────────────
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
      white-space: nowrap;
    `;
    document.querySelector('.tuner-container').appendChild(statusEl);
  }
  
  statusEl.textContent = message;
  statusEl.className = className;
  
  // Add pulse animation for certain states
  if (className === 'in-tune') {
    statusEl.style.animation = 'successPulse 0.5s ease-out';
    setTimeout(() => {
      statusEl.style.animation = '';
    }, 500);
  }
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

function playSuccessSound() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  
  // Play a pleasant success sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // Play C-E notes
  osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.2);
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
    "🎸 Ultra-Accurate Tuner: Professional ±5 cents precision!",
    "🎵 Using 5 advanced pitch detection algorithms!",
    "🎤 For best results, play one string at a time clearly.",
    "🎯 Green arrow = Perfect tuning within 5 cents!",
    "💡 Tip: If detecting harmonics, try playing softer.",
    "🔧 Manual mode lets you focus on one string at a time."
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  alert(`PickBot: ${randomMessage}`);
}

// Add CSS animation for success pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes successPulse {
    0% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.1); }
    100% { transform: translateX(-50%) scale(1); }
  }
  
  .in-tune { color: #51cf66 !important; }
  .out-of-tune { color: #ffd43b !important; }
  .error { color: #ff6b6b !important; }
  .warning { color: #ff9f43 !important; }
  .recording { color: #74c0fc !important; }
  .processing { color: #91a7ff !important; }
  .ready { color: #69db7c !important; }
`;
document.head.appendChild(style);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  stopAutoTuning();
});
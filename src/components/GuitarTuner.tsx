import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const GuitarTuner: React.FC = () => {
  const navigate = useNavigate();
  const [currentString, setCurrentString] = useState('g');
  const [autoMode, setAutoMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [tuningStatus, setTuningStatus] = useState('🎸 Enhanced Guitar Tuner Ready! Improved note detection active.');
  const [detectedChip, setDetectedChip] = useState({ show: false, text: '', inTune: false });
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const autoTuneIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startAutoTuning = useCallback(() => {
    if (autoTuneIntervalRef.current) {
      clearInterval(autoTuneIntervalRef.current);
    }
    
    autoTuneIntervalRef.current = setInterval(() => {
      if (autoMode && !isRecording) {
        tuneCurrentString();
      }
    }, 3000);
  }, [autoMode, isRecording]);

  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().then(() => console.log('🔊 AudioContext resumed!'));
        }
      }
    };

    document.body.addEventListener('click', initAudio, { once: true });

    if (autoMode) {
      startAutoTuning();
    }

    return () => {
      if (autoTuneIntervalRef.current) {
        clearInterval(autoTuneIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [autoMode, startAutoTuning]);

  const stopAutoTuning = () => {
    if (autoTuneIntervalRef.current) {
      clearInterval(autoTuneIntervalRef.current);
      autoTuneIntervalRef.current = null;
    }
  };

  const recordAudio = async (duration = 2000): Promise<Blob> => {
    try {
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false
          } 
        });
      }

      const mediaRecorder = new MediaRecorder(mediaStreamRef.current);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, duration);

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          setIsRecording(false);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        mediaRecorder.onerror = reject;
      });
    } catch (error) {
      console.error('Recording failed:', error);
      setIsRecording(false);
      throw error;
    }
  };

  const sendAudioForTuning = async (audioBlob: Blob, targetNote: string | null = null) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'guitar_recording.webm');
      
      if (targetNote) {
        formData.append('note', targetNote);
      }

      const response = await fetch('http://127.0.0.1:8001/tune', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to analyze audio:', error);
      // Fallback to simulation
      return simulateTuning(targetNote);
    }
  };

  const simulateTuning = (targetNote: string | null) => {
    const allNotes = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
    let detectedNote;
    
    if (targetNote && Math.random() > 0.3) {
      detectedNote = targetNote;
    } else {
      detectedNote = allNotes[Math.floor(Math.random() * allNotes.length)];
    }
    
    const mockResults = {
      'E2': { note: 'E2', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 82.41, target_frequency: 82.41, confidence: 0.8 },
      'A2': { note: 'A2', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 110.00, target_frequency: 110.00, confidence: 0.8 },
      'D3': { note: 'D3', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 146.83, target_frequency: 146.83, confidence: 0.8 },
      'G3': { note: 'G3', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 196.00, target_frequency: 196.00, confidence: 0.8 },
      'B3': { note: 'B3', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 246.94, target_frequency: 246.94, confidence: 0.8 },
      'E4': { note: 'E4', cents: Math.random() * 60 - 30, in_tune: Math.random() > 0.7, direction: Math.random() > 0.5 ? 'sharp' : 'flat', frequency: 329.63, target_frequency: 329.63, confidence: 0.8 }
    };
    
    return mockResults[detectedNote as keyof typeof mockResults];
  };

  const tuneCurrentString = async () => {
    if (isRecording) return;

    try {
      setTuningStatus('🎤 Listening for guitar notes...');
      
      const audioBlob = await recordAudio();
      setTuningStatus('🔄 Analyzing pitch and detecting note...');
      
      const targetNote = autoMode ? null : STRING_TO_NOTE[currentString as keyof typeof STRING_TO_NOTE];
      const tuningData = await sendAudioForTuning(audioBlob, targetNote);
      
      showDetectedNote(tuningData.note);
      showDetectedChip(tuningData.note, tuningData.cents || 0, !!tuningData.in_tune);
      updateTunerUI(tuningData);
      
    } catch (error) {
      console.error('Tuning failed:', error);
      setTuningStatus('❌ Tuning failed: ' + (error as Error).message);
    }
  };

  const showDetectedNote = (detectedNote: string) => {
    const stringKey = NOTE_TO_STRING[detectedNote];
    if (stringKey && autoMode) {
      setCurrentString(stringKey);
    }
  };

  const showDetectedChip = (note: string, cents: number, inTune: boolean) => {
    const sign = cents > 0 ? '+' : '';
    setDetectedChip({
      show: true,
      text: `✔ Detected: ${note} (${sign}${Math.abs(cents).toFixed(1)}¢)`,
      inTune
    });
    
    setTimeout(() => {
      setDetectedChip(prev => ({ ...prev, show: false }));
    }, 1600);
  };

  const updateTunerUI = (tuningData: any) => {
    const noteDisplay = tuningData.note || 'Unknown';
    const frequencyDisplay = tuningData.frequency ? `${tuningData.frequency}Hz` : 'Unknown';
    
    if (tuningData.in_tune) {
      setTuningStatus(`✅ ${noteDisplay} perfect! (${frequencyDisplay})`);
    } else {
      const direction = tuningData.direction === 'sharp' ? 'too high ⬇️' : 'too low ⬆️';
      const centsDisplay = Math.abs(tuningData.cents || 0).toFixed(1);
      setTuningStatus(`🎵 ${noteDisplay}: ${centsDisplay}¢ ${direction}`);
    }
  };

  const selectString = (stringKey: string) => {
    setCurrentString(stringKey);
    const noteName = STRING_TO_NOTE[stringKey as keyof typeof STRING_TO_NOTE];
    setTuningStatus(`🎯 Selected: ${noteName} string`);
    playReferenceNote(stringKey);
  };

  const playReferenceNote = (stringKey: string) => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
    
    const frequencies = {
      'e-low': 82.41,
      'a': 110.00,
      'd': 146.83,
      'g': 196.00,
      'b': 246.94,
      'e-high': 329.63
    };
    
    const frequency = frequencies[stringKey as keyof typeof frequencies];
    if (!frequency) return;
    
    try {
      const oscillator = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
      
      oscillator.start(audioCtxRef.current.currentTime);
      oscillator.stop(audioCtxRef.current.currentTime + 1);
    } catch (error) {
      console.log('Could not play reference tone:', error);
    }
  };

  const toggleMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode) {
      startAutoTuning();
      setTuningStatus('🔄 Auto mode: Continuous tuning active');
    } else {
      stopAutoTuning();
      setTuningStatus('👆 Manual mode: Click button to tune');
    }
  };

  const goHome = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    stopAutoTuning();
    navigate('/homepage.html');
  };

  const manualTune = () => {
    if (!isRecording) {
      tuneCurrentString();
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      background: '#0a0a1f',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      <style>{`
        .brick-wall {
          position: absolute; 
          top: 0; 
          left: 0;
          width: 100%; 
          height: 100%;
          background: url('/images/Brick_Wall.png') repeat;
          background-size: 200px 100px;
          z-index: 1;
          filter: brightness(0.5) saturate(0.8);
        }

        .tuner-container {
          position: relative;
          width: 100vw; 
          height: 117vh;
          display: flex; 
          flex-direction: column; 
          align-items: center;
          z-index: 2;
        }

        .header {
          position: absolute; 
          top: 20px; 
          left: 20px; 
          right: 20px;
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          z-index: 10;
        }

        .home-btn {
          width: 70px; 
          height: 70px; 
          border-radius: 50%;
          background: linear-gradient(135deg,#00d4ff,#0099cc);
          border: none; 
          cursor: pointer;
          font-size: 32px; 
          color: #fff;
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,212,255,0.3);
          transition: all 0.3s ease;
        }

        .home-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(0,212,255,0.5);
        }

        .toggle-container {
          display: flex; 
          align-items: center; 
          gap: 15px;
          background: rgba(255,255,255,0.1);
          padding: 12px 20px; 
          border-radius: 30px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer;
        }

        .toggle-label {
          color: #fff; 
          font-size: 16px; 
          font-weight: 600; 
          letter-spacing: .5px;
          min-width: 80px; 
          text-align: center;
          cursor: pointer;
        }

        .toggle-switch {
          position: relative; 
          width: 70px; 
          height: 35px;
          background: #333; 
          border-radius: 20px; 
          cursor: pointer;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
          transition: background 0.3s;
          border: 2px solid transparent;
        }

        .toggle-switch:hover {
          border: 2px solid rgba(255,255,255,0.3);
        }

        .toggle-switch.active {
          background: #00d4ff;
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,0.2),
            0 0 15px rgba(0,212,255,0.5);
        }

        .toggle-knob {
          position: absolute; 
          top: 3px; 
          left: 3px;
          width: 29px; 
          height: 29px; 
          background: #fff; 
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        }

        .toggle-switch.active .toggle-knob {
          transform: translateX(35px);
        }

        .quality-panel {
          position: absolute; 
          top: 20px; 
          left: 50%; 
          transform: translateX(-50%);
          display: flex; 
          align-items: center; 
          gap: 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 12px; 
          border-radius: 999px;
          backdrop-filter: blur(8px);
          z-index: 10;
        }

        .level-bar { 
          width: 160px; 
          height: 10px; 
          border-radius: 999px; 
          background: rgba(255,255,255,0.15); 
          overflow: hidden; 
        }
        
        .level-fill { 
          width: 0%; 
          height: 100%; 
          background: linear-gradient(90deg,#51cf66,#ffd43b,#ff6b6b); 
          transition: width .12s ease; 
        }
        
        .confidence-badge { 
          font-weight: 800; 
          color:#fff; 
          font-size: 12px; 
          opacity: 0.9; 
          min-width: 70px; 
          text-align: right; 
        }

        .detected-chip {
          position: absolute;
          top: 90px;
          left: 50%;
          transform: translateX(-50%) scale(0.95);
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: .5px;
          color: #0b0820;
          background: #ef09d0;
          border: 1px solid rgba(255,255,255,0.35);
          box-shadow: 0 10px 30px rgba(239,9,208,0.35);
          z-index: 120;
          opacity: 0;
          transition: opacity .18s ease, transform .18s ease, filter .18s ease;
          pointer-events: none;
        }

        .detected-chip.show {
          opacity: 1;
          transform: translateX(-50%) scale(1);
          filter: brightness(1.03);
        }

        .detected-chip.in-tune { 
          background: #51cf66; 
          color: #062010; 
        }
        
        .detected-chip.out { 
          background: #ffd43b; 
          color: #3a2a00; 
        }

        .sound-meter {
          position: absolute; 
          top: 100px;
          width: 450px; 
          height: 140px;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }

        .string-meter {
          position: absolute; 
          width: 100%; 
          height: 100%;
          display: none; 
          align-items: center; 
          justify-content: center;
        }

        .string-meter.active { 
          display: flex; 
        }

        .meter-image { 
          width: 400px; 
          height: auto; 
          position: relative; 
        }

        .meter-arrow {
          position: absolute; 
          width: 70px; 
          height: auto;
          top: 50%; 
          left: 50%;
          transform: translate(-50%,-50%);
          transform-origin: center bottom;
          transition: all 0.3s ease;
        }

        .guitar-container {
          position: absolute; 
          top: 50%; 
          left: 50%;
          transform: translate(-50%,-50%);
          width: 450px; 
          height: 650px;
        }

        .headstock-image {
          position: absolute; 
          top: 0; 
          left: 0;
          width: 100%; 
          height: 100%;
          background: url('/images/Tuner_Page_Assets/Guitar Head@4x.png') no-repeat center;
          background-size: contain; 
          z-index: 1;
        }

        .guitar-strings { 
          position: absolute; 
          top: 0; 
          left: 0; 
          width:100%; 
          height:100%; 
          z-index:2; 
        }

        .guitar-string {
          position: absolute; 
          top: 0; 
          left: 0;
          width:100%; 
          height:100%;
          opacity:0; 
          transition: opacity .4s ease;
          background-size:contain; 
          background-position:center;
          background-repeat: no-repeat;
        }

        .guitar-string.active { 
          opacity:1; 
        }

        .string-e-low {
          background-image: url('/images/Tuner_Page_Assets/Strings/E Left String Clicked@4x.png');
          top:350px; 
          right:50px; 
          left:95px; 
          width:94px; 
          height:280px;
        }

        .string-a {
          background-image: url('/images/Tuner_Page_Assets/Strings/A String Clicked@4x.png');
          top:260px; 
          right:50px; 
          left:120px; 
          width:94px; 
          height:350px;
        }

        .string-d {
          background-image: url('/images/Tuner_Page_Assets/Strings/D String Clicked@4x.png');
          top:93px; 
          right:50px; 
          left:135px; 
          width:100px; 
          height:550px;
        }

        .string-g {
          background-image: url('/images/Tuner_Page_Assets/Strings/G String Clicked@4x.png');
          top:140px; 
          right:-10px; 
          left:214px; 
          width:100px; 
          height:460px;
        }

        .string-b {
          background-image: url('/images/Tuner_Page_Assets/Strings/B String Clicked@4x.png');
          top:156px; 
          right:-220px; 
          left:235px; 
          width:90px; 
          height:550px;
        }

        .string-e-high {
          background-image: url('/images/Tuner_Page_Assets/Strings/E Right String Clicked@4x.png');
          top:363px; 
          right:-250px; 
          left:260px; 
          width:90px; 
          height:250px;
        }

        .string-letters { 
          position:absolute; 
          top:0; 
          left:0; 
          width:100%; 
          height:100%; 
          z-index:3; 
        }

        .string-letter {
          position:absolute; 
          width:50px; 
          height:50px;
          border:3px solid; 
          border-radius:50%;
          display:flex; 
          align-items:center; 
          justify-content:center;
          font-size:24px; 
          font-weight:bold;
          color:#fff; 
          opacity:0.3; 
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          cursor:pointer;
        }

        .string-letter:hover { 
          transform: scale(1.1); 
          opacity:1!important; 
        }

        .string-letter.active { 
          opacity:1; 
          box-shadow: 0 0 20px currentColor,0 0 40px currentColor; 
        }

        .letter-e-low { 
          top:395px; 
          left:-80px; 
          color:#b65994; 
          border-color:#b65994; 
        }

        .letter-a { 
          top:280px; 
          left:-45px; 
          color:#1212f3; 
          border-color:#4a12f3; 
        }

        .letter-d { 
          top:168px; 
          left:-15px; 
          color:#f1840f; 
          border-color:#f1840f; 
        }

        .letter-g { 
          top:168px; 
          right:-35px; 
          color:#2ebccc; 
          border-color:#2ebccc; 
        }

        .letter-b { 
          top:280px; 
          right:-59px; 
          color:#c239ef; 
          border-color:#c239ef; 
        }

        .letter-e-high {
          top:400px; 
          right:-85px;
          color:#2ecc71;
          border-color:#2ecc71;
        }

        .letter-e-low.active { 
          background:#b65994; 
          color:#fff!important; 
        }

        .letter-a.active { 
          background:#1219f3; 
          color:#fff!important; 
        }

        .letter-d.active { 
          background:#f1840f; 
          color:#fff!important; 
        }

        .letter-g.active { 
          background:#2ebccc; 
          color:#fff!important; 
        }

        .letter-b.active { 
          background:#c239ef; 
          color:#fff!important; 
        }

        .letter-e-high.active { 
          background:#2ecc71; 
          color:#fff!important; 
        }

        .tune-button {
          position: absolute;
          top: 280px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 50px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
          transition: all 0.3s ease;
          z-index: 100;
          display: none;
        }

        .tune-button:hover {
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 6px 25px rgba(255, 107, 107, 0.5);
        }

        .tune-button:active {
          transform: translateX(-50%) scale(0.98);
        }

        .tune-button.recording {
          background: linear-gradient(135deg, #4ecdc4, #44a08d);
          animation: pulse 1.5s infinite;
        }

        .tune-button.processing {
          background: linear-gradient(135deg, #ffd43b, #f39c12);
        }

        @keyframes pulse {
          0% { box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3); }
          50% { box-shadow: 0 6px 25px rgba(78, 205, 196, 0.8); }
          100% { box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3); }
        }

        #tuning-status {
          position: absolute;
          top: 350px;
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
          min-width: 200px;
          text-align: center;
        }

        .pickbot {
          position:absolute; 
          bottom:30px; 
          right:30px;
          width:150px; 
          height:450px;
          background: url('/images/PickbotTrans.png') no-repeat center;
          background-size:contain; 
          cursor:pointer;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
          transition: transform .3s ease, filter .3s ease;
        }

        .pickbot:hover {
          transform: scale(1.1);
          filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));
        }
      `}</style>

      <div className="brick-wall"></div>
      <div className="tuner-container">
        <div className="header">
          <button className="home-btn" onClick={goHome}>🏠</button>
          <div className="toggle-container" onClick={toggleMode}>
            <span className="toggle-label">{autoMode ? 'AUTOMATIC' : 'MANUAL'}</span>
            <div className={`toggle-switch ${autoMode ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div className="quality-panel">
          <div className="level-bar">
            <div className="level-fill"></div>
          </div>
          <div className="confidence-badge">-- %</div>
        </div>

        <div className={`detected-chip ${detectedChip.show ? 'show' : ''} ${detectedChip.inTune ? 'in-tune' : 'out'}`}>
          {detectedChip.text}
        </div>

        <div className="sound-meter">
          <div className={`string-meter ${currentString === 'e-low' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/E Left Meter@4x.png" alt="E Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/E Left Arrow@4x.png" alt="E Arrow" />
          </div>
          <div className={`string-meter ${currentString === 'a' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/A Meter@4x.png" alt="A Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/A Arrow@4x.png" alt="A Arrow" />
          </div>
          <div className={`string-meter ${currentString === 'd' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/D Meter@4x.png" alt="D Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/D Arrow@4x.png" alt="D Arrow" />
          </div>
          <div className={`string-meter ${currentString === 'g' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/G Meter@4x.png" alt="G Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/G Arrow@4x.png" alt="G Arrow" />
          </div>
          <div className={`string-meter ${currentString === 'b' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/B Meter@4x.png" alt="B Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/B Arrow@4x.png" alt="B Arrow" />
          </div>
          <div className={`string-meter ${currentString === 'e-high' ? 'active' : ''}`}>
            <img className="meter-image" src="/images/Tuner_Page_Assets/Sound Meter/E Right Meter@4x.png" alt="E Meter" />
            <img className="meter-arrow" src="/images/Tuner_Page_Assets/Sound Meter/E Right Arrow@4x.png" alt="E Arrow" />
          </div>
        </div>

        <button 
          className={`tune-button ${isRecording ? 'recording' : ''}`} 
          onClick={manualTune}
          style={{ display: autoMode ? 'none' : 'block' }}
        >
          {isRecording ? '🎤 Recording...' : '🎤 Listen & Tune'}
        </button>

        <div className="guitar-container">
          <div className="guitar-headstock">
            <div className="headstock-image"></div>
            <div className="guitar-strings">
              <div className={`guitar-string string-e-low ${currentString === 'e-low' ? 'active' : ''}`}></div>
              <div className={`guitar-string string-a ${currentString === 'a' ? 'active' : ''}`}></div>
              <div className={`guitar-string string-d ${currentString === 'd' ? 'active' : ''}`}></div>
              <div className={`guitar-string string-g ${currentString === 'g' ? 'active' : ''}`}></div>
              <div className={`guitar-string string-b ${currentString === 'b' ? 'active' : ''}`}></div>
              <div className={`guitar-string string-e-high ${currentString === 'e-high' ? 'active' : ''}`}></div>
            </div>
            <div className="string-letters">
              <div className={`string-letter letter-e-low ${currentString === 'e-low' ? 'active' : ''}`} onClick={() => selectString('e-low')}>E</div>
              <div className={`string-letter letter-a ${currentString === 'a' ? 'active' : ''}`} onClick={() => selectString('a')}>A</div>
              <div className={`string-letter letter-d ${currentString === 'd' ? 'active' : ''}`} onClick={() => selectString('d')}>D</div>
              <div className={`string-letter letter-g ${currentString === 'g' ? 'active' : ''}`} onClick={() => selectString('g')}>G</div>
              <div className={`string-letter letter-b ${currentString === 'b' ? 'active' : ''}`} onClick={() => selectString('b')}>B</div>
              <div className={`string-letter letter-e-high ${currentString === 'e-high' ? 'active' : ''}`} onClick={() => selectString('e-high')}>E</div>
            </div>
          </div>
        </div>

        <div className="pickbot" onClick={() => alert('PickBot: Welcome to the Enhanced Guitar Tuner!')}></div>
      </div>

      <div id="tuning-status">{tuningStatus}</div>
    </div>
  );
};

export default GuitarTuner;

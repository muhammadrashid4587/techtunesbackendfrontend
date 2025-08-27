# ultra_accurate_server.py - State-of-the-art pitch detection
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import librosa
import scipy.signal
import scipy.fftpack
import io
import tempfile
import os
from typing import Optional, Tuple, List
import logging
from collections import deque
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ultra-Accurate Guitar Tuner API", version="3.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SAMPLE_RATE = 44100
ERROR_MARGIN = 5  # ±5 cents for professional accuracy

# Standard guitar tuning frequencies with overtones
GUITAR_NOTES = {
    'E2': {'fundamental': 82.41, 'overtones': [164.81, 247.22, 329.63]},
    'A2': {'fundamental': 110.00, 'overtones': [220.00, 330.00, 440.00]},
    'D3': {'fundamental': 146.83, 'overtones': [293.66, 440.49, 587.32]},
    'G3': {'fundamental': 196.00, 'overtones': [392.00, 588.00, 784.00]},
    'B3': {'fundamental': 246.94, 'overtones': [493.88, 740.82, 987.76]},
    'E4': {'fundamental': 329.63, 'overtones': [659.26, 988.89, 1318.52]}
}

class TuningResult(BaseModel):
    note: str
    frequency: float
    target_frequency: float
    cents: float
    in_tune: bool
    direction: str
    confidence: float
    clarity: float
    stability: float

class AdvancedPitchDetector:
    """Ultra-accurate pitch detection using state-of-the-art algorithms"""
    
    def __init__(self, sample_rate=44100):
        self.sample_rate = sample_rate
        self.pitch_history = deque(maxlen=20)
        
    def detect_pitch_ultra_accurate(self, audio: np.ndarray) -> Tuple[float, float, float, float]:
        """
        Ultra-accurate pitch detection using multiple advanced methods
        Returns: (frequency, confidence, clarity, stability)
        """
        # Pre-process audio
        processed = self.advanced_preprocessing(audio)
        
        # Method 1: Enhanced McLeod Pitch Method (MPM) - Most accurate
        freq_mpm, conf_mpm = self.mcleod_pitch_method(processed)
        
        # Method 2: SWIPE (Sawtooth Waveform Inspired Pitch Estimator)
        freq_swipe, conf_swipe = self.swipe_pitch_estimation(processed)
        
        # Method 3: Enhanced YIN with adaptive threshold
        freq_yin, conf_yin = self.enhanced_yin(processed)
        
        # Method 4: Cepstral with peak enhancement
        freq_cep, conf_cep = self.enhanced_cepstral(processed)
        
        # Method 5: Phase vocoder for fine-tuning
        freq_phase, conf_phase = self.phase_vocoder_pitch(processed)
        
        logger.info(f"Detection results - MPM: {freq_mpm:.2f}Hz ({conf_mpm:.2f}), "
                   f"SWIPE: {freq_swipe:.2f}Hz ({conf_swipe:.2f}), "
                   f"YIN: {freq_yin:.2f}Hz ({conf_yin:.2f}), "
                   f"Cepstral: {freq_cep:.2f}Hz ({conf_cep:.2f}), "
                   f"Phase: {freq_phase:.2f}Hz ({conf_phase:.2f})")
        
        # Smart combination with outlier rejection
        final_freq, confidence, clarity = self.smart_combination([
            (freq_mpm, conf_mpm, 1.5),      # MPM gets highest weight
            (freq_swipe, conf_swipe, 1.3),  # SWIPE is very reliable
            (freq_yin, conf_yin, 1.2),      # YIN is good for guitars
            (freq_cep, conf_cep, 1.0),      # Cepstral as baseline
            (freq_phase, conf_phase, 1.1)   # Phase vocoder for fine-tuning
        ])
        
        # Calculate stability from history
        self.pitch_history.append(final_freq)
        stability = self.calculate_stability()
        
        return final_freq, confidence, clarity, stability
    
    def advanced_preprocessing(self, audio: np.ndarray) -> np.ndarray:
        """Advanced audio preprocessing for better pitch detection"""
        # Remove DC offset
        audio = audio - np.mean(audio)
        
        # Adaptive noise gate
        noise_floor = np.percentile(np.abs(audio), 10)
        audio[np.abs(audio) < noise_floor * 2] = 0
        
        # Apply pre-emphasis to enhance harmonics
        pre_emphasis = 0.97
        audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
        
        # Spectral whitening to balance frequency content
        fft = np.fft.rfft(audio)
        magnitude = np.abs(fft)
        # Smooth magnitude spectrum
        smoothed_mag = scipy.signal.savgol_filter(magnitude, 51, 3)
        # Whiten
        whitened = fft / (smoothed_mag + 1e-10)
        audio = np.fft.irfft(whitened, n=len(audio))
        
        # Apply optimal window
        audio = audio * np.hanning(len(audio))
        
        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.95
            
        return audio
    
    def mcleod_pitch_method(self, audio: np.ndarray) -> Tuple[float, float]:
        """McLeod Pitch Method - extremely accurate for monophonic signals"""
        # Calculate normalized square difference function
        nsdf = self.calculate_nsdf(audio)
        
        # Find all positive zero crossings
        zero_crossings = np.where(np.diff(np.sign(nsdf)))[0]
        zero_crossings = zero_crossings[nsdf[zero_crossings] < 0]
        
        if len(zero_crossings) == 0:
            return 0, 0
        
        # Find maximum values between zero crossings
        max_positions = []
        max_values = []
        
        for i in range(len(zero_crossings) - 1):
            start = zero_crossings[i]
            end = zero_crossings[i + 1]
            if end - start < 2:
                continue
            max_pos = start + np.argmax(nsdf[start:end])
            max_positions.append(max_pos)
            max_values.append(nsdf[max_pos])
        
        if not max_positions:
            return 0, 0
        
        # Choose the highest peak with sufficient strength
        threshold = 0.8 * max(max_values) if max_values else 0.8
        valid_peaks = [(pos, val) for pos, val in zip(max_positions, max_values) if val > threshold]
        
        if not valid_peaks:
            return 0, 0
        
        # Use the first strong peak (fundamental)
        peak_pos = valid_peaks[0][0]
        peak_value = valid_peaks[0][1]
        
        # Parabolic interpolation for sub-sample accuracy
        if 0 < peak_pos < len(nsdf) - 1:
            alpha = nsdf[peak_pos - 1]
            beta = nsdf[peak_pos]
            gamma = nsdf[peak_pos + 1]
            p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma)
            interpolated_pos = peak_pos + p
        else:
            interpolated_pos = peak_pos
        
        frequency = self.sample_rate / interpolated_pos if interpolated_pos > 0 else 0
        confidence = peak_value
        
        return frequency, confidence
    
    def calculate_nsdf(self, audio: np.ndarray) -> np.ndarray:
        """Calculate Normalized Square Difference Function for MPM"""
        audio = np.asarray(audio, dtype=np.float64)
        N = len(audio)
        
        # Autocorrelation via FFT
        audio_fft = np.fft.rfft(audio, n=2*N)
        autocorr = np.fft.irfft(audio_fft * np.conj(audio_fft))[:N]
        
        # Calculate m'(tau) - running sum of squares
        m_prime = np.cumsum(audio**2)[::-1]
        m_prime = np.concatenate([[2 * m_prime[0]], m_prime[:-1] + m_prime[:0:-1]])
        
        # NSDF = 2 * r'(tau) / m'(tau)
        nsdf = 2 * autocorr / (m_prime[:N] + 1e-10)
        nsdf[0] = 1  # Definition at tau=0
        
        return nsdf
    
    def swipe_pitch_estimation(self, audio: np.ndarray) -> Tuple[float, float]:
        """SWIPE algorithm - very robust pitch estimation"""
        # Parameters
        pitch_min, pitch_max = 70, 400
        dt = 0.001  # Time step
        dlog2p = 1/48  # Pitch resolution (48 steps per octave)
        
        # Create pitch candidates
        log2_pitch_min = np.log2(pitch_min)
        log2_pitch_max = np.log2(pitch_max)
        log2_pitches = np.arange(log2_pitch_min, log2_pitch_max, dlog2p)
        pitches = 2 ** log2_pitches
        
        # Calculate strength for each pitch candidate
        strengths = []
        for p in pitches:
            strength = self.calculate_pitch_strength(audio, p)
            strengths.append(strength)
        
        strengths = np.array(strengths)
        
        # Find peak
        if len(strengths) == 0 or np.max(strengths) == 0:
            return 0, 0
        
        peak_idx = np.argmax(strengths)
        
        # Parabolic interpolation
        if 0 < peak_idx < len(strengths) - 1:
            alpha = strengths[peak_idx - 1]
            beta = strengths[peak_idx]
            gamma = strengths[peak_idx + 1]
            if alpha < beta and gamma < beta:
                p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma)
                interpolated_idx = peak_idx + p
                frequency = 2 ** (log2_pitches[peak_idx] + p * dlog2p)
            else:
                frequency = pitches[peak_idx]
        else:
            frequency = pitches[peak_idx]
        
        confidence = strengths[peak_idx] / (np.mean(strengths) + 1e-10)
        confidence = min(1.0, confidence / 3)  # Normalize
        
        return frequency, confidence
    
    def calculate_pitch_strength(self, audio: np.ndarray, pitch: float) -> float:
        """Calculate strength of a specific pitch using harmonic summation"""
        period_samples = int(self.sample_rate / pitch)
        if period_samples >= len(audio):
            return 0
        
        # Calculate correlation at fundamental and harmonics
        strength = 0
        for harmonic in range(1, 6):  # Check up to 5th harmonic
            lag = int(period_samples / harmonic)
            if lag < len(audio):
                correlation = np.correlate(audio[:-lag], audio[lag:], mode='valid')
                if len(correlation) > 0:
                    strength += np.max(correlation) / harmonic
        
        return strength
    
    def enhanced_yin(self, audio: np.ndarray) -> Tuple[float, float]:
        """Enhanced YIN with adaptive threshold"""
        # Difference function
        df = self.yin_difference_function(audio)
        
        # Cumulative mean normalized difference
        cmndf = self.yin_cmndf(df)
        
        # Adaptive threshold based on signal characteristics
        threshold = self.calculate_adaptive_threshold(cmndf)
        
        # Find the first minimum below threshold
        tau = self.find_yin_period(cmndf, threshold)
        
        if tau == 0:
            return 0, 0
        
        # Parabolic interpolation
        if tau < len(cmndf) - 1:
            x0, x1, x2 = cmndf[tau - 1], cmndf[tau], cmndf[tau + 1]
            if x1 < x0 and x1 < x2:
                # Parabolic interpolation
                a = (x0 - 2 * x1 + x2) / 2
                b = (x2 - x0) / 2
                tau_interp = tau - b / (2 * a) if a != 0 else tau
            else:
                tau_interp = tau
        else:
            tau_interp = tau
        
        frequency = self.sample_rate / tau_interp
        confidence = 1 - cmndf[tau]
        
        return frequency, confidence
    
    def yin_difference_function(self, audio: np.ndarray) -> np.ndarray:
        """Calculate YIN difference function"""
        N = len(audio)
        df = np.zeros(N)
        
        for tau in range(1, N):
            for j in range(N - tau):
                df[tau] += (audio[j] - audio[j + tau]) ** 2
                
        return df
    
    def yin_cmndf(self, df: np.ndarray) -> np.ndarray:
        """Cumulative mean normalized difference function"""
        cmndf = df.copy()
        cmndf[0] = 1
        
        cumsum = 0
        for tau in range(1, len(df)):
            cumsum += df[tau]
            cmndf[tau] = df[tau] / (cumsum / tau) if cumsum > 0 else 0
            
        return cmndf
    
    def calculate_adaptive_threshold(self, cmndf: np.ndarray) -> float:
        """Calculate adaptive threshold based on signal characteristics"""
        # Find the global minimum
        global_min = np.min(cmndf[1:])
        
        # Adaptive threshold between 0.1 and 0.3
        threshold = max(0.1, min(0.3, global_min + 0.1))
        
        return threshold
    
    def find_yin_period(self, cmndf: np.ndarray, threshold: float) -> int:
        """Find the first period estimate below threshold"""
        # Start searching after the first zero (avoid zero-lag)
        for tau in range(2, len(cmndf)):
            if cmndf[tau] < threshold:
                # Check if it's a local minimum
                if tau + 1 < len(cmndf) and cmndf[tau] < cmndf[tau + 1]:
                    return tau
        
        # If no value below threshold, return the global minimum
        return np.argmin(cmndf[1:]) + 1
    
    def enhanced_cepstral(self, audio: np.ndarray) -> Tuple[float, float]:
        """Enhanced cepstral analysis with liftering"""
        # Apply window
        windowed = audio * np.blackman(len(audio))
        
        # Power spectrum
        fft = np.fft.rfft(windowed, n=8192)
        log_spectrum = np.log(np.abs(fft) ** 2 + 1e-10)
        
        # Cepstrum
        cepstrum = np.fft.irfft(log_spectrum)
        
        # Liftering to enhance pitch peak
        quefrency = np.arange(len(cepstrum)) / self.sample_rate
        lifter = 1 + 6 * np.sin(np.pi * quefrency * 100)
        cepstrum_liftered = cepstrum * lifter
        
        # Search for peak in valid range
        min_period = int(self.sample_rate / 400)
        max_period = int(self.sample_rate / 70)
        max_period = min(max_period, len(cepstrum_liftered) - 1)
        
        if min_period >= max_period:
            return 0, 0
        
        peak_idx = min_period + np.argmax(cepstrum_liftered[min_period:max_period])
        
        # Parabolic interpolation
        if 0 < peak_idx < len(cepstrum_liftered) - 1:
            y1, y2, y3 = cepstrum_liftered[peak_idx-1:peak_idx+2]
            if y2 > y1 and y2 > y3:
                x0 = 0.5 * (y1 - y3) / (y1 - 2 * y2 + y3)
                peak_idx_interp = peak_idx + x0
            else:
                peak_idx_interp = peak_idx
        else:
            peak_idx_interp = peak_idx
        
        frequency = self.sample_rate / peak_idx_interp
        
        # Confidence based on peak prominence
        if min_period > 0 and max_period < len(cepstrum_liftered):
            confidence = cepstrum_liftered[peak_idx] / np.std(cepstrum_liftered[min_period:max_period])
            confidence = min(1.0, confidence / 3)
        else:
            confidence = 0
        
        return frequency, confidence
    
    def phase_vocoder_pitch(self, audio: np.ndarray) -> Tuple[float, float]:
        """Phase vocoder approach for fine pitch estimation"""
        # Parameters
        hop_length = 128
        n_fft = 2048
        
        # STFT
        stft = librosa.stft(audio, n_fft=n_fft, hop_length=hop_length, window='hann')
        
        # Instantaneous frequency estimation
        phase = np.angle(stft)
        phase_diff = np.diff(phase, axis=1)
        phase_diff = np.mod(phase_diff + np.pi, 2 * np.pi) - np.pi
        
        # Convert phase difference to frequency
        freq_bins = np.fft.fftfreq(n_fft, 1/self.sample_rate)[:n_fft//2 + 1]
        inst_freq = freq_bins[:, np.newaxis] + phase_diff * self.sample_rate / (2 * np.pi * hop_length)
        
        # Magnitude weighting
        magnitude = np.abs(stft)
        
        # Find fundamental frequency through harmonic analysis
        pitch_candidates = []
        
        for frame_idx in range(inst_freq.shape[1]):
            frame_mag = magnitude[:, frame_idx]
            frame_freq = inst_freq[:, frame_idx]
            
            # Find peaks
            peaks, properties = scipy.signal.find_peaks(frame_mag, height=np.max(frame_mag) * 0.1)
            
            if len(peaks) > 0:
                # Look for harmonic relationships
                fundamental = self.find_fundamental_from_peaks(frame_freq[peaks], frame_mag[peaks])
                if fundamental > 0:
                    pitch_candidates.append(fundamental)
        
        if not pitch_candidates:
            return 0, 0
        
        # Use median for robustness
        frequency = np.median(pitch_candidates)
        confidence = len(pitch_candidates) / inst_freq.shape[1]
        
        return frequency, confidence
    
    def find_fundamental_from_peaks(self, frequencies: np.ndarray, magnitudes: np.ndarray) -> float:
        """Find fundamental frequency from spectral peaks"""
        if len(frequencies) == 0:
            return 0
        
        # Sort by magnitude
        sorted_idx = np.argsort(magnitudes)[::-1]
        frequencies = frequencies[sorted_idx]
        magnitudes = magnitudes[sorted_idx]
        
        # Check if peaks form harmonic series
        for i in range(min(3, len(frequencies))):
            f0_candidate = frequencies[i]
            if 70 <= f0_candidate <= 400:
                harmonic_score = 0
                for f in frequencies:
                    ratio = f / f0_candidate
                    if abs(ratio - round(ratio)) < 0.05:  # Within 5% of harmonic
                        harmonic_score += 1
                
                if harmonic_score >= 3:  # At least 3 harmonics
                    return f0_candidate
        
        return 0
    
    def smart_combination(self, results: List[Tuple[float, float, float]]) -> Tuple[float, float, float]:
        """Smart combination of multiple pitch estimates with outlier rejection"""
        # Extract valid results
        valid_results = [(f, c, w) for f, c, w in results if f > 0 and c > 0.5]
        
        if not valid_results:
            # Fallback to best available
            valid_results = [(f, c, w) for f, c, w in results if f > 0]
        
        if not valid_results:
            return 0, 0, 0
        
        frequencies = np.array([f for f, c, w in valid_results])
        confidences = np.array([c for f, c, w in valid_results])
        weights = np.array([w for f, c, w in valid_results])
        
        # Outlier detection using MAD (Median Absolute Deviation)
        median_freq = np.median(frequencies)
        mad = np.median(np.abs(frequencies - median_freq))
        
        # Reject outliers (more than 3 MAD away)
        if mad > 0:
            inlier_mask = np.abs(frequencies - median_freq) <= 3 * mad
        else:
            inlier_mask = np.ones(len(frequencies), dtype=bool)
        
        # If all are outliers, keep all
        if not np.any(inlier_mask):
            inlier_mask = np.ones(len(frequencies), dtype=bool)
        
        # Weighted average of inliers
        final_freq = np.average(frequencies[inlier_mask], 
                               weights=weights[inlier_mask] * confidences[inlier_mask])
        
        # Overall confidence
        confidence = np.mean(confidences[inlier_mask])
        
        # Clarity (how well methods agree)
        if len(frequencies[inlier_mask]) > 1:
            clarity = 1 - (np.std(frequencies[inlier_mask]) / median_freq)
            clarity = max(0, min(1, clarity))
        else:
            clarity = confidence
        
        return final_freq, confidence, clarity
    
    def calculate_stability(self) -> float:
        """Calculate pitch stability from history"""
        if len(self.pitch_history) < 3:
            return 0.5
        
        recent_pitches = list(self.pitch_history)[-10:]
        
        # Remove zeros
        valid_pitches = [p for p in recent_pitches if p > 0]
        
        if len(valid_pitches) < 2:
            return 0.5
        
        # Calculate coefficient of variation
        mean_pitch = np.mean(valid_pitches)
        std_pitch = np.std(valid_pitches)
        
        if mean_pitch > 0:
            cv = std_pitch / mean_pitch
            stability = 1 - min(cv * 10, 1)  # Scale for display
        else:
            stability = 0
        
        return stability

def preprocess_audio_ultra(audio: np.ndarray, sr: int) -> np.ndarray:
    """Ultra-high quality audio preprocessing"""
    # Remove silence from beginning and end
    audio = librosa.effects.trim(audio, top_db=30)[0]
    
    if len(audio) < 1024:
        return audio
    
    # High-quality resampling if needed
    if sr != SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE, res_type='kaiser_best')
    
    # Remove DC offset
    audio = audio - np.mean(audio)
    
    # Apply A-weighting to match human perception
    b, a = A_weighting(SAMPLE_RATE)
    audio = scipy.signal.filtfilt(b, a, audio)
    
    # Adaptive normalization
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.95
    
    return audio

def A_weighting(fs):
    """Design A-weighting filter"""
    # A-weighting filter coefficients
    f1 = 20.598997
    f2 = 107.65265
    f3 = 737.86223
    f4 = 12194.217
    
    nums = [(2*np.pi*f4)**2 * (10**(2.0/20))]
    dens = [1, 4*np.pi*f4, (2*np.pi*f4)**2]
    
    # Bilinear transformation
    b, a = scipy.signal.bilinear(nums, dens, fs)
    
    return b, a

def analyze_pitch_ultra_accurate(audio_data: np.ndarray, sr: int) -> Tuple[float, float, float, float]:
    """Ultra-accurate pitch analysis"""
    # Preprocess
    processed_audio = preprocess_audio_ultra(audio_data, sr)
    
    # Check signal strength
    rms = np.sqrt(np.mean(processed_audio**2))
    if rms < 0.001:
        logger.info("Signal too weak")
        return None, 0, 0, 0
    
    # Use advanced detector
    detector = AdvancedPitchDetector(SAMPLE_RATE)
    
    # Analyze full signal
    frequency, confidence, clarity, stability = detector.detect_pitch_ultra_accurate(processed_audio)
    
    # Additional validation for guitar frequencies
    if frequency > 0:
        # Check if it's likely a harmonic instead of fundamental
        for note, data in GUITAR_NOTES.items():
            fundamental = data['fundamental']
            # Check if detected frequency is close to a harmonic
            for overtone in data['overtones']:
                if abs(frequency - overtone) < 5:  # Within 5 Hz of overtone
                    # Likely detecting overtone, try to find fundamental
                    logger.info(f"Detected likely overtone at {frequency}Hz, checking for fundamental at {fundamental}Hz")
                    # Re-analyze focusing on lower frequency
                    detector_low = AdvancedPitchDetector(SAMPLE_RATE)
                    # Apply lowpass filter
                    sos = scipy.signal.butter(6, fundamental * 2, btype='low', fs=SAMPLE_RATE, output='sos')
                    filtered = scipy.signal.sosfilt(sos, processed_audio)
                    freq_low, conf_low, _, _ = detector_low.detect_pitch_ultra_accurate(filtered)
                    if abs(freq_low - fundamental) < 10:  # Found fundamental
                        frequency = freq_low
                        confidence = conf_low * 0.9  # Slightly lower confidence
                        logger.info(f"Corrected to fundamental: {frequency}Hz")
                        break
    
    return frequency, confidence, clarity, stability

def get_closest_note_ultra(freq: float, target_note: Optional[str] = None):
    """Find closest note with overtone awareness"""
    if freq <= 10:
        return None, None, None, 0.0
    
    logger.info(f"Finding closest note for frequency: {freq:.2f} Hz")
    
    if target_note and target_note in GUITAR_NOTES:
        # Manual mode - calculate deviation from specific note
        target_freq = GUITAR_NOTES[target_note]['fundamental']
        cents = 1200 * np.log2(freq / target_freq)
        return target_note, cents, target_freq, 1.0
    else:
        # Auto mode - find closest note considering overtones
        closest_note = None
        closest_freq = None
        min_cents_diff = float('inf')
        is_harmonic = False
        
        for note, data in GUITAR_NOTES.items():
            # Check fundamental
            fundamental = data['fundamental']
            cents_diff = abs(1200 * np.log2(freq / fundamental))
            
            if cents_diff < min_cents_diff:
                min_cents_diff = cents_diff
                closest_note = note
                closest_freq = fundamental
                is_harmonic = False
            
            # Check if it matches an overtone better
            for i, overtone in enumerate(data['overtones'][:2]):  # Only check 2nd and 3rd harmonics
                cents_diff_harmonic = abs(1200 * np.log2(freq / overtone))
                if cents_diff_harmonic < 50 and cents_diff_harmonic < min_cents_diff:
                    # Very close to overtone - user might be detecting harmonic
                    logger.info(f"Frequency {freq}Hz is close to {i+2}nd harmonic of {note}")
                    # Still map to fundamental
                    min_cents_diff = cents_diff  # Use distance to fundamental
                    closest_note = note
                    closest_freq = fundamental
                    is_harmonic = True
        
        if closest_note is None:
            return None, None, None, 0.0
        
        # Calculate actual cents from fundamental
        cents = 1200 * np.log2(freq / closest_freq)
        
        # Confidence based on how close we are
        if is_harmonic:
            confidence = 0.7  # Lower confidence if we detected a harmonic
        else:
            confidence = max(0.0, 1.0 - (min_cents_diff / 100.0))
        
        logger.info(f"Closest match - Note: {closest_note}, Target: {closest_freq}Hz, "
                   f"Cents: {cents:.1f}, Confidence: {confidence:.2f}, "
                   f"Harmonic: {is_harmonic}")
        
        return closest_note, cents, closest_freq, confidence

@app.post("/tune", response_model=TuningResult)
async def tune_guitar(
    file: UploadFile = File(...),
    note: Optional[str] = Form(None)
):
    """Ultra-accurate guitar tuning analysis"""
    try:
        logger.info(f"Received file: {file.filename}, Target note: {note}")
        
        # Read audio file
        audio_bytes = await file.read()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Load audio with better error handling
            try:
                audio_data, sr = librosa.load(temp_file_path, sr=None, mono=True)
                logger.info(f"Audio loaded - Shape: {audio_data.shape}, SR: {sr}")
            except Exception as e:
                logger.error(f"librosa failed: {e}")
                # Try soundfile as backup
                import soundfile as sf
                audio_data, sr = sf.read(temp_file_path)
                if len(audio_data.shape) > 1:
                    audio_data = np.mean(audio_data, axis=1)
            
            # Check audio length
            if len(audio_data) < sr * 0.1:  # Less than 100ms
                raise HTTPException(
                    status_code=400,
                    detail="Audio too short. Please record at least 0.5 seconds."
                )
            
            # Analyze with ultra-accurate method
            detected_freq, confidence, clarity, stability = analyze_pitch_ultra_accurate(audio_data, sr)
            
            if detected_freq is None or detected_freq <= 0:
                # Try again with different preprocessing
                logger.info("First attempt failed, trying alternative preprocessing")
                
                # Apply aggressive filtering for noisy signals
                nyquist = sr / 2
                sos = scipy.signal.butter(6, [65/nyquist, 500/nyquist], btype='band', output='sos')
                filtered = scipy.signal.sosfilt(sos, audio_data)
                
                detected_freq, confidence, clarity, stability = analyze_pitch_ultra_accurate(filtered, sr)
                
                if detected_freq is None or detected_freq <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail="No clear pitch detected. Try: 1) Play louder, 2) Play a single note, 3) Move closer to mic"
                    )
            
            # Get closest note
            closest_note, cents, target_freq, note_confidence = get_closest_note_ultra(detected_freq, note)
            
            if closest_note is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Detected frequency {detected_freq:.1f}Hz is outside guitar range"
                )
            
            # Final confidence combining all factors
            final_confidence = confidence * note_confidence * clarity
            
            # Determine tuning status with tighter tolerance
            in_tune = abs(cents) <= ERROR_MARGIN
            
            if cents > 0:
                direction = "sharp"
            elif cents < 0:
                direction = "flat"
            else:
                direction = "perfect"
            
            # Detailed logging
            logger.info(f"Result - Note: {closest_note}, Freq: {detected_freq:.2f}Hz, "
                       f"Target: {target_freq:.2f}Hz, Cents: {cents:.1f}, "
                       f"In tune: {in_tune}, Confidence: {final_confidence:.2f}, "
                       f"Clarity: {clarity:.2f}, Stability: {stability:.2f}")
            
            return TuningResult(
                note=closest_note,
                frequency=round(detected_freq, 2),
                target_frequency=round(target_freq, 2),
                cents=round(cents, 1),
                in_tune=in_tune,
                direction=direction,
                confidence=round(final_confidence, 3),
                clarity=round(clarity, 3),
                stability=round(stability, 3)
            )
            
        finally:
            # Clean up
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/notes")
async def get_guitar_notes():
    """Get guitar notes with overtone information"""
    return {note: data['fundamental'] for note, data in GUITAR_NOTES.items()}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "version": "3.0.0",
        "features": ["MPM", "SWIPE", "Enhanced YIN", "Cepstral", "Phase Vocoder", "Overtone Detection"]
    }

@app.get("/debug/{note}")
async def debug_note(note: str):
    """Debug endpoint to check note detection"""
    if note not in GUITAR_NOTES:
        raise HTTPException(status_code=404, detail="Note not found")
    
    data = GUITAR_NOTES[note]
    return {
        "note": note,
        "fundamental": data['fundamental'],
        "overtones": data['overtones'],
        "cents_ranges": {
            "perfect": f"{data['fundamental']-1:.2f} - {data['fundamental']+1:.2f} Hz",
            "in_tune": f"±{ERROR_MARGIN} cents",
            "sharp": f"> +{ERROR_MARGIN} cents",
            "flat": f"< -{ERROR_MARGIN} cents"
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Ultra-Accurate Guitar Tuner Server v3.0")
    logger.info("Features: MPM, SWIPE, Enhanced YIN, Cepstral, Phase Vocoder")
    logger.info("Improvements: Overtone detection, A-weighting, Adaptive thresholds")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
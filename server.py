# # enhanced_server.py

# from fastapi import FastAPI, File, UploadFile, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import numpy as np
# import librosa
# import scipy.signal
# import io
# import tempfile
# import os
# from typing import Optional, Tuple, List
# import logging
# import soundfile as sf

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="Enhanced Guitar Tuner API", version="2.0.0")

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configuration
# SAMPLE_RATE = 44100
# ERROR_MARGIN = 5  # ±5 cents for tighter tolerance

# # Standard guitar tuning frequencies
# GUITAR_NOTES = {
#     'E2': 82.41,   # Low E (6th string)
#     'A2': 110.00,  # A (5th string)
#     'D3': 146.83,  # D (4th string)
#     'G3': 196.00,  # G (3rd string)
#     'B3': 246.94,  # B (2nd string)
#     'E4': 329.63   # High E (1st string)
# }

# class TuningResult(BaseModel):
#     note: str
#     frequency: float
#     target_frequency: float
#     cents: float
#     in_tune: bool
#     direction: str
#     confidence: float
#     clarity: float

# class EnhancedPitchDetector:
#     """Enhanced pitch detection using multiple algorithms"""
    
#     def __init__(self, sample_rate=44100):
#         self.sample_rate = sample_rate
#         self.window_size = 4096
#         self.hop_length = 512
        
#     def detect_pitch_multi_method(self, audio: np.ndarray) -> Tuple[float, float, float]:
#         """
#         Detect pitch using multiple methods and return the most confident result
#         Returns: (frequency, confidence, clarity)
#         """
#         # Method 1: Enhanced Autocorrelation
#         freq_ac, conf_ac = self.enhanced_autocorrelation(audio)
        
#         # Method 2: YIN algorithm
#         freq_yin, conf_yin = self.yin_pitch_detection(audio)
        
#         # Method 3: Harmonic Product Spectrum
#         freq_hps, conf_hps = self.harmonic_product_spectrum(audio)
        
#         # Method 4: Cepstral pitch detection
#         freq_cep, conf_cep = self.cepstral_pitch_detection(audio)
        
#         logger.info(f"Pitch detection results - AC: {freq_ac:.2f}Hz ({conf_ac:.2f}), "
#                    f"YIN: {freq_yin:.2f}Hz ({conf_yin:.2f}), "
#                    f"HPS: {freq_hps:.2f}Hz ({conf_hps:.2f}), "
#                    f"Cepstral: {freq_cep:.2f}Hz ({conf_cep:.2f})")
        
#         # Combine results using weighted voting
#         results = [
#             (freq_ac, conf_ac * 1.2),   # Give autocorrelation slight preference
#             (freq_yin, conf_yin * 1.1),  # YIN is very reliable
#             (freq_hps, conf_hps),
#             (freq_cep, conf_cep)
#         ]
        
#         # Filter out low confidence results
#         valid_results = [(f, c) for f, c in results if c > 0.7 and 70 <= f <= 400]
        
#         if not valid_results:
#             return 0, 0, 0
        
#         # Calculate weighted average frequency
#         total_weight = sum(c for _, c in valid_results)
#         weighted_freq = sum(f * c for f, c in valid_results) / total_weight
        
#         # Calculate overall confidence
#         confidence = min(1.0, total_weight / len(results))
        
#         # Calculate clarity (how consistent the methods are)
#         frequencies = [f for f, _ in valid_results]
#         clarity = 1.0 - (np.std(frequencies) / np.mean(frequencies)) if frequencies else 0
        
#         return weighted_freq, confidence, clarity
    
#     def enhanced_autocorrelation(self, audio: np.ndarray) -> Tuple[float, float]:
#         """Enhanced autocorrelation with better peak detection"""
#         # Apply window
#         windowed = audio * np.hanning(len(audio))
        
#         # Compute autocorrelation
#         correlation = np.correlate(windowed, windowed, mode='full')
#         correlation = correlation[len(correlation)//2:]
        
#         # Normalize
#         correlation = correlation / correlation[0]
        
#         # Find peaks
#         d = np.diff(correlation)
#         start = np.where(d > 0)[0][0] if len(np.where(d > 0)[0]) > 0 else 0
        
#         # Search for maximum in valid range
#         min_period = int(self.sample_rate / 400)  # 400 Hz max
#         max_period = int(self.sample_rate / 70)   # 70 Hz min
        
#         if start >= max_period:
#             return 0, 0
        
#         search_range = correlation[max(start, min_period):min(max_period, len(correlation))]
#         if len(search_range) == 0:
#             return 0, 0
        
#         peak_idx = np.argmax(search_range) + max(start, min_period)
        
#         # Parabolic interpolation
#         if 0 < peak_idx < len(correlation) - 1:
#             y1, y2, y3 = correlation[peak_idx-1:peak_idx+2]
#             x0 = (y3 - y1) / (2 * (2 * y2 - y1 - y3))
#             true_peak = peak_idx + x0
#             freq = self.sample_rate / true_peak
#             confidence = correlation[peak_idx]
#         else:
#             freq = self.sample_rate / peak_idx
#             confidence = correlation[peak_idx]
        
#         return freq, confidence
    
#     def yin_pitch_detection(self, audio: np.ndarray) -> Tuple[float, float]:
#         """YIN algorithm implementation"""
#         try:
#             # Use librosa's YIN implementation
#             pitches = librosa.yin(
#                 audio,
#                 fmin=70,
#                 fmax=400,
#                 sr=self.sample_rate,
#                 hop_length=self.hop_length,
#                 trough_threshold=0.1
#             )
            
#             # Filter valid pitches
#             valid_pitches = pitches[pitches > 0]
#             if len(valid_pitches) == 0:
#                 return 0, 0
            
#             # Use median for stability
#             pitch = np.median(valid_pitches)
#             confidence = min(1.0, len(valid_pitches) / len(pitches))
            
#             return pitch, confidence
            
#         except Exception as e:
#             logger.error(f"YIN error: {e}")
#             return 0, 0
    
#     def harmonic_product_spectrum(self, audio: np.ndarray) -> Tuple[float, float]:
#         """Harmonic Product Spectrum method"""
#         # Apply window
#         windowed = audio * np.hanning(len(audio))
        
#         # Compute FFT
#         fft = np.fft.rfft(windowed, n=self.window_size)
#         magnitude = np.abs(fft)
        
#         # Downsample for harmonics
#         hps = magnitude.copy()
#         for h in range(2, 6):  # Check up to 5th harmonic
#             downsampled = magnitude[::h]
#             hps[:len(downsampled)] *= downsampled
        
#         # Find peak in valid frequency range
#         freq_bins = np.fft.rfftfreq(self.window_size, 1/self.sample_rate)
#         valid_range = np.where((freq_bins >= 70) & (freq_bins <= 400))[0]
        
#         if len(valid_range) == 0:
#             return 0, 0
        
#         peak_idx = valid_range[np.argmax(hps[valid_range])]
#         freq = freq_bins[peak_idx]
        
#         # Confidence based on peak prominence
#         confidence = hps[peak_idx] / np.mean(hps[valid_range])
#         confidence = min(1.0, confidence / 10)  # Normalize
        
#         return freq, confidence
    
#     def cepstral_pitch_detection(self, audio: np.ndarray) -> Tuple[float, float]:
#         """Cepstral analysis for pitch detection"""
#         # Apply window
#         windowed = audio * np.hanning(len(audio))
        
#         # Compute cepstrum
#         fft = np.fft.rfft(windowed)
#         log_spectrum = np.log(np.abs(fft) + 1e-10)
#         cepstrum = np.fft.irfft(log_spectrum)
        
#         # Search for peak in valid quefrency range
#         min_quefrency = int(self.sample_rate / 400)  # 400 Hz max
#         max_quefrency = int(self.sample_rate / 70)   # 70 Hz min
        
#         valid_range = cepstrum[min_quefrency:min(max_quefrency, len(cepstrum))]
#         if len(valid_range) == 0:
#             return 0, 0
        
#         peak_idx = np.argmax(valid_range) + min_quefrency
#         freq = self.sample_rate / peak_idx
        
#         # Confidence based on peak prominence
#         confidence = cepstrum[peak_idx] / np.std(cepstrum)
#         confidence = min(1.0, confidence / 5)  # Normalize
        
#         return freq, confidence

# def preprocess_audio(audio: np.ndarray, sr: int) -> np.ndarray:
#     """Enhanced audio preprocessing"""
#     # Remove DC offset
#     audio = audio - np.mean(audio)
    
#     # Normalize
#     max_val = np.max(np.abs(audio))
#     if max_val > 0:
#         audio = audio / max_val
    
#     # Apply pre-emphasis filter
#     pre_emphasis = 0.97
#     audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
    
#     # Apply bandpass filter for guitar frequencies
#     nyquist = sr / 2
#     low_freq = 70 / nyquist
#     high_freq = 400 / nyquist
    
#     # Design butterworth bandpass filter
#     sos = scipy.signal.butter(4, [low_freq, high_freq], btype='band', output='sos')
#     filtered = scipy.signal.sosfilt(sos, audio)
    
#     return filtered

# def analyze_pitch_enhanced(audio_data: np.ndarray, sr: int) -> Tuple[float, float, float]:
#     """Enhanced pitch analysis with multiple methods"""
#     # Preprocess audio
#     processed_audio = preprocess_audio(audio_data, sr)
    
#     # Check if signal is strong enough
#     rms = np.sqrt(np.mean(processed_audio**2))
#     if rms < 0.001:
#         logger.info("Signal too weak")
#         return None, 0, 0
    
#     # Create pitch detector and analyze
#     detector = EnhancedPitchDetector(sr)
#     frequency, confidence, clarity = detector.detect_pitch_multi_method(processed_audio)
    
#     # Apply median filter on segments for stability
#     segment_size = len(processed_audio) // 5
#     frequencies = []
    
#     for i in range(5):
#         start = i * segment_size
#         end = start + segment_size if i < 4 else len(processed_audio)
#         segment = processed_audio[start:end]
        
#         if len(segment) > 1024:  # Minimum segment size
#             seg_freq, seg_conf, _ = detector.detect_pitch_multi_method(segment)
#             if seg_freq > 0 and seg_conf > 0.7:
#                 frequencies.append(seg_freq)
    
#     # Use median of segment frequencies if available
#     if frequencies:
#         final_frequency = np.median(frequencies)
#         frequency_std = np.std(frequencies)
#         # Adjust confidence based on consistency
#         confidence *= (1 - min(0.5, frequency_std / final_frequency))
#     else:
#         final_frequency = frequency
    
#     return final_frequency, confidence, clarity

# @app.post("/tune", response_model=TuningResult)
# async def tune_guitar(
#     file: UploadFile = File(...),
#     note: Optional[str] = Form(None)
# ):
#     """Enhanced guitar tuning analysis"""
#     try:
#         logger.info(f"Processing file: {file.filename}")
        
#         # Read audio file
#         audio_bytes = await file.read()
        
#         # Save to temporary file
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
#             temp_file.write(audio_bytes)
#             temp_file_path = temp_file.name
        
#         try:
#             # Load audio with soundfile as fallback
#             try:
#                 audio_data, sr = librosa.load(temp_file_path, sr=SAMPLE_RATE, mono=True)
#             except:
#                 # Fallback to soundfile
#                 audio_data, sr = sf.read(temp_file_path)
#                 if len(audio_data.shape) > 1:
#                     audio_data = np.mean(audio_data, axis=1)
#                 if sr != SAMPLE_RATE:
#                     audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=SAMPLE_RATE)
#                     sr = SAMPLE_RATE
            
#             # Analyze pitch with enhanced method
#             detected_freq, confidence, clarity = analyze_pitch_enhanced(audio_data, sr)
            
#             if detected_freq is None or detected_freq <= 0:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="No clear pitch detected. Try playing louder or a single note."
#                 )
            
#             # Find closest note
#             closest_note = None
#             min_cents_diff = float('inf')
#             target_freq = 0
            
#             for note_name, note_freq in GUITAR_NOTES.items():
#                 cents = 1200 * np.log2(detected_freq / note_freq)
#                 if abs(cents) < abs(min_cents_diff):
#                     min_cents_diff = cents
#                     closest_note = note_name
#                     target_freq = note_freq
            
#             # Determine tuning status
#             in_tune = abs(min_cents_diff) <= ERROR_MARGIN
#             direction = "sharp" if min_cents_diff > 0 else "flat" if min_cents_diff < 0 else "perfect"
            
#             logger.info(f"Result - Note: {closest_note}, Freq: {detected_freq:.2f}Hz, "
#                        f"Cents: {min_cents_diff:.1f}, Confidence: {confidence:.2f}, "
#                        f"Clarity: {clarity:.2f}")
            
#             return TuningResult(
#                 note=closest_note,
#                 frequency=round(detected_freq, 2),
#                 target_frequency=round(target_freq, 2),
#                 cents=round(min_cents_diff, 1),
#                 in_tune=in_tune,
#                 direction=direction,
#                 confidence=round(confidence, 2),
#                 clarity=round(clarity, 2)
#             )
            
#         finally:
#             os.unlink(temp_file_path)
            
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Processing error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "version": "2.0.0"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# server.py

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import io
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import soundfile as sf
import librosa
import scipy.signal

# ───── App & Logging ─────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guitar_tuner")

app = FastAPI(title="Enhanced Guitar Tuner API", version="2.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# ───── Config ────────────────────────────────────────────────
SAMPLE_RATE   = 44100
ERROR_MARGIN  = 5   # ±5 cents
GUITAR_NOTES  = { 'E2':82.41,'A2':110.00,'D3':146.83,'G3':196.00,'B3':246.94,'E4':329.63 }

# ───── Admin Config ───────────────────────────────────────────
import os
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "dev-admin-token")
INSTRUCTOR_TOKEN = os.getenv("INSTRUCTOR_TOKEN", "dev-instructor-token")
INSTRUCTOR_PASSWORD = os.getenv("INSTRUCTOR_PASSWORD")

def require_admin(x_admin_token: str = Header(default="")):
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid admin token")
    return True

# ───── Onboarding Storage (in-memory, dev) ────────────────────
ONBOARDING_SUBMISSIONS: List[Dict[str, Any]] = []

class OnboardingPayload(BaseModel):
    step: str
    data: Dict[str, Any]
    user_id: Optional[str] = None

# ───── Instructor Auth & Content Storage (in-memory) ──────────
def require_instructor(x_instructor_token: str = Header(default="")):
    if not x_instructor_token or x_instructor_token != INSTRUCTOR_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid instructor token")
    return True

COURSES: List[Dict[str, Any]] = []
LESSONS: List[Dict[str, Any]] = []
COURSE_ID_SEQ = 1
LESSON_ID_SEQ = 1

class CourseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner: Optional[str] = None  # instructor email/id

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_url: Optional[str] = None

# ───── Response Model ────────────────────────────────────────
class TuningResult(BaseModel):
    note:             str
    frequency:        float
    target_frequency: float
    cents:            float
    in_tune:          bool
    direction:        str
    confidence:       float
    clarity:          float

# ───── Audio Preprocessing ───────────────────────────────────
def preprocess(audio: np.ndarray) -> np.ndarray:
    """Enhanced preprocessing: mono, normalize, pre-emphasis, bandpass 70–400Hz"""
    # mono & normalize
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    audio = audio - np.mean(audio)
    mx = np.max(np.abs(audio))
    if mx > 0:
        audio = audio / mx
    # pre-emphasis to improve peak definition
    pre_emphasis = 0.97
    audio = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])
    # bandpass 70–400Hz
    sos = scipy.signal.butter(4, [70/(SAMPLE_RATE/2), 400/(SAMPLE_RATE/2)],
                              btype="band", output="sos")
    return scipy.signal.sosfilt(sos, audio)

# ───── Multi-Method Pitch Detection ──────────────────────────
class EnhancedPitchDetector:
    """Combines multiple pitch detection methods with confidence weighting"""

    def __init__(self, sample_rate: int = SAMPLE_RATE):
        self.sample_rate = sample_rate
        self.window_size = 4096
        self.hop_length = 512

    def enhanced_autocorrelation(self, audio: np.ndarray) -> tuple[float, float]:
        windowed = audio * np.hanning(len(audio))
        corr = np.correlate(windowed, windowed, mode='full')
        corr = corr[len(corr)//2:]
        if len(corr) == 0 or corr[0] == 0:
            return 0.0, 0.0
        corr = corr / corr[0]
        d = np.diff(corr)
        pos = np.where(d > 0)[0]
        start = int(pos[0]) if len(pos) else 0
        min_p = int(self.sample_rate / 400)
        max_p = int(self.sample_rate / 70)
        if start >= max_p:
            return 0.0, 0.0
        rng = corr[max(start, min_p):min(max_p, len(corr))]
        if len(rng) == 0:
            return 0.0, 0.0
        peak_idx = int(np.argmax(rng)) + max(start, min_p)
        if 1 <= peak_idx < len(corr) - 1:
            y1, y2, y3 = corr[peak_idx-1:peak_idx+2]
            denom = (2 * y2 - y1 - y3)
            x0 = (y3 - y1) / (2 * denom) if denom != 0 else 0.0
            true_peak = peak_idx + x0
            freq = self.sample_rate / true_peak
            conf = float(max(0.0, min(1.0, y2)))
        else:
            freq = self.sample_rate / max(peak_idx, 1)
            conf = float(max(0.0, min(1.0, corr[peak_idx])))
        return float(freq), float(conf)

    def yin(self, audio: np.ndarray) -> tuple[float, float]:
        try:
            pitches = librosa.yin(audio, fmin=70, fmax=400, sr=self.sample_rate,
                                  hop_length=self.hop_length, frame_length=2048,
                                  trough_threshold=0.1)
            valid = pitches[pitches > 0]
            if len(valid) == 0:
                return 0.0, 0.0
            freq = float(np.median(valid))
            conf = float(min(1.0, len(valid) / len(pitches)))
            return freq, conf
        except Exception as e:
            logger.warning(f"YIN failed: {e}")
            return 0.0, 0.0

    def harmonic_product_spectrum(self, audio: np.ndarray) -> tuple[float, float]:
        windowed = audio * np.hanning(len(audio))
        fft = np.fft.rfft(windowed, n=self.window_size)
        mag = np.abs(fft)
        hps = mag.copy()
        for h in range(2, 6):
            ds = mag[::h]
            hps[:len(ds)] *= ds
        freq_bins = np.fft.rfftfreq(self.window_size, 1 / self.sample_rate)
        valid = np.where((freq_bins >= 70) & (freq_bins <= 400))[0]
        if len(valid) == 0:
            return 0.0, 0.0
        peak_idx = int(valid[np.argmax(hps[valid])])
        freq = float(freq_bins[peak_idx])
        conf = float(min(1.0, (hps[peak_idx] / (np.mean(hps[valid]) + 1e-9)) / 10))
        return freq, conf

    def cepstral(self, audio: np.ndarray) -> tuple[float, float]:
        windowed = audio * np.hanning(len(audio))
        spec = np.fft.rfft(windowed)
        log_mag = np.log(np.abs(spec) + 1e-10)
        cep = np.fft.irfft(log_mag)
        min_q = int(self.sample_rate / 400)
        max_q = int(self.sample_rate / 70)
        if min_q >= len(cep):
            return 0.0, 0.0
        rng = cep[min_q:min(max_q, len(cep))]
        if len(rng) == 0:
            return 0.0, 0.0
        peak_idx = int(np.argmax(rng)) + min_q
        freq = float(self.sample_rate / peak_idx)
        conf = float(min(1.0, (cep[peak_idx] / (np.std(cep) + 1e-9)) / 5))
        return freq, conf

    def detect(self, audio: np.ndarray) -> tuple[float, float, float]:
        f_ac, c_ac = self.enhanced_autocorrelation(audio)
        f_yin, c_yin = self.yin(audio)
        f_hps, c_hps = self.harmonic_product_spectrum(audio)
        f_cep, c_cep = self.cepstral(audio)
        results = [
            (f_ac, c_ac * 1.2),
            (f_yin, c_yin * 1.1),
            (f_hps, c_hps),
            (f_cep, c_cep),
        ]
        valid = [(f, c) for f, c in results if 70 <= f <= 400 and c > 0.6]
        if not valid:
            return 0.0, 0.0, 0.0
        total_w = sum(c for _, c in valid)
        weighted_f = sum(f * c for f, c in valid) / (total_w + 1e-9)
        confidence = float(min(1.0, total_w / len(results)))
        freqs = np.array([f for f, _ in valid], dtype=float)
        clarity = float(max(0.0, 1.0 - (np.std(freqs) / (np.mean(freqs) + 1e-9))))
        return float(weighted_f), confidence, clarity


def analyze_pitch_enhanced(audio: np.ndarray) -> tuple[float, float, float]:
    """End-to-end enhanced pitch analysis with stability check"""
    processed = preprocess(audio)
    rms = float(np.sqrt(np.mean(processed**2)))
    if rms < 0.001:
        return 0.0, 0.0, 0.0
    detector = EnhancedPitchDetector(SAMPLE_RATE)
    # Segmental median for stability
    segs = 5
    length = len(processed)
    seg_size = max(1024, length // segs)
    seg_freqs, seg_confs = [], []
    for i in range(segs):
        start = i * seg_size
        end = length if i == segs - 1 else min(length, (i + 1) * seg_size)
        if end - start < 1024:
            continue
        f, c, _ = detector.detect(processed[start:end])
        if f > 0 and c > 0.6:
            seg_freqs.append(f)
            seg_confs.append(c)
    if seg_freqs:
        freq = float(np.median(seg_freqs))
        base_f, base_c, base_cl = detector.detect(processed)
        conf = float(min(1.0, (np.mean(seg_confs) + base_c) / 2))
        clarity = float(min(1.0, 1.0 - (np.std(seg_freqs) / (np.mean(seg_freqs) + 1e-9))))
        return freq, conf, clarity
    return detector.detect(processed)

# ───── Pitch Detection (single-method via YIN for demo speed) ──
def detect_pitch(audio: np.ndarray) -> (float, float):
    # use librosa YIN
    pitches = librosa.yin(audio, fmin=70, fmax=400,
                          sr=SAMPLE_RATE, frame_length=2048)
    valid = pitches[pitches>0]
    if len(valid)==0:
        return 0.0, 0.0
    freq       = float(np.median(valid))
    confidence = float(min(1.0, len(valid)/len(pitches)))
    return freq, confidence

# ───── Main /tune Endpoint ──────────────────────────────────
@app.post("/tune", response_model=TuningResult)
async def tune_guitar(
    file: UploadFile = File(...),
    note: str = Form(None)   # ignored in auto, available in manual
):
    try:
        # 1) Read file bytes
        data = await file.read()
        audio, sr = sf.read(io.BytesIO(data), always_2d=False)
        if sr != SAMPLE_RATE:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
            sr = SAMPLE_RATE

        # 2) Enhanced analysis (multi-method with stability)
        freq, confidence, clarity = analyze_pitch_enhanced(audio)
        if freq <= 0:
            raise HTTPException(400, "No clear pitch detected. Play louder or single note.")

        # 3) Find closest string note
        closest, cents_diff, target_f = None, None, None
        for n,freq_t in GUITAR_NOTES.items():
            cents = 1200*np.log2(freq/freq_t)
            if closest is None or abs(cents) < abs(cents_diff):
                closest, cents_diff, target_f = n, cents, freq_t

        # 4) Build response
        in_tune   = abs(cents_diff) <= ERROR_MARGIN
        direction = "sharp" if cents_diff > 0 else ("flat" if cents_diff < 0 else "perfect")

        logger.info(f"Tuned {closest}: {freq:.1f}Hz ({cents_diff:.1f}¢) conf={confidence:.2f} clr={clarity:.2f}")

        return TuningResult(
            note             = closest,
            frequency        = round(freq, 2),
            target_frequency = round(target_f, 2),
            cents            = round(cents_diff, 1),
            in_tune          = in_tune,
            direction        = direction,
            confidence       = round(confidence, 2),
            clarity          = round(clarity, 2)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in tuning: {e}")
        raise HTTPException(500, str(e))

# ───── Health Check & Runner ─────────────────────────────────
@app.get("/health")
async def health(): 
    return {"status":"healthy","version":"2.1.0"}

# ───── Onboarding API ─────────────────────────────────────────
@app.post("/onboarding/save")
async def onboarding_save(payload: OnboardingPayload):
    entry = {
        "received_at": datetime.utcnow().isoformat() + "Z",
        "step": payload.step,
        "data": payload.data,
        "user_id": payload.user_id,
        "ip": "hidden",
    }
    ONBOARDING_SUBMISSIONS.append(entry)
    return {"ok": True, "count": len(ONBOARDING_SUBMISSIONS)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)

# ───── Admin Endpoints ────────────────────────────────────────
@app.post("/admin/login")
async def admin_login(password: str = Form(...)):
    expected = os.getenv("ADMIN_PASSWORD")
    if expected is not None:
        if password != expected:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    # If no ADMIN_PASSWORD set, accept any password for dev and return token
    return {"token": ADMIN_TOKEN}

@app.get("/admin/health")
async def admin_health(_: bool = Depends(require_admin)):
    return {"status": "ok", "service": "admin", "version": app.version}

@app.get("/admin/users")
async def list_users(_: bool = Depends(require_admin)):
    # Stub: integrate with DB later
    return {"users": []}

@app.get("/admin/onboarding")
async def admin_onboarding(_: bool = Depends(require_admin)):
    return {"submissions": ONBOARDING_SUBMISSIONS}

# ───── Instructor endpoints ───────────────────────────────────
@app.post("/instructor/login")
async def instructor_login(password: str = Form(...)):
    if INSTRUCTOR_PASSWORD is not None and password != INSTRUCTOR_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": INSTRUCTOR_TOKEN}

@app.post("/instructor/courses")
async def create_course(course: CourseCreate, _: bool = Depends(require_instructor)):
    global COURSE_ID_SEQ
    new_course = {
        "id": COURSE_ID_SEQ,
        "name": course.name,
        "description": course.description or "",
        "owner": course.owner or "",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    COURSE_ID_SEQ += 1
    COURSES.append(new_course)
    return new_course

@app.get("/instructor/courses")
async def list_courses(_: bool = Depends(require_instructor)):
    return {"courses": COURSES}

@app.post("/instructor/courses/{course_id}/lessons")
async def create_lesson(course_id: int, lesson: LessonCreate, _: bool = Depends(require_instructor)):
    global LESSON_ID_SEQ
    if not any(c["id"] == course_id for c in COURSES):
        raise HTTPException(status_code=404, detail="Course not found")
    new_lesson = {
        "id": LESSON_ID_SEQ,
        "course_id": course_id,
        "title": lesson.title,
        "description": lesson.description or "",
        "content_url": lesson.content_url or "",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    LESSON_ID_SEQ += 1
    LESSONS.append(new_lesson)
    return new_lesson

@app.get("/instructor/courses/{course_id}/lessons")
async def list_lessons(course_id: int, _: bool = Depends(require_instructor)):
    return {"lessons": [l for l in LESSONS if l["course_id"] == course_id]}

# guitar_tuner.py
import pyaudio
import numpy as np
import librosa

SAMPLE_RATE = 44100
CHUNK_SIZE = 2048
DURATION = 2  # Recording duration in seconds
ERROR_MARGIN = 10  # ±10 cents tolerance

GUITAR_NOTES = {
    'E2': 82.41,   # Low E (6th string)
    'A2': 110.00,  # A (5th string)
    'D3': 146.83,  # D (4th string)
    'G3': 196.00,  # G (3rd string)
    'B3': 246.94,  # B (2nd string)
    'E4': 329.63   # High E (1st string)
}

def get_closest_note(freq):
    """Find the closest guitar note using proper cents-based distance calculation"""
    if freq <= 10:  # Frequency threshold
        return None, None, None
    
    print(f"Finding closest note for frequency: {freq:.2f} Hz")
    
    # Find closest note by comparing cents differences
    closest_note = None
    closest_freq = None
    min_cents_diff = float('inf')
    
    for note, note_freq in GUITAR_NOTES.items():
        cents_diff = abs(1200 * np.log2(freq / note_freq))
        print(f"  {note} ({note_freq}Hz): {cents_diff:.1f} cents difference")
        
        if cents_diff < min_cents_diff:
            min_cents_diff = cents_diff
            closest_note = note
            closest_freq = note_freq
    
    if closest_note is None:
        return None, None, None
    
    # Calculate actual cents (positive = sharp, negative = flat)
    cents = 1200 * np.log2(freq / closest_freq)
    
    print(f"Closest match: {closest_note} ({closest_freq}Hz), {cents:.1f} cents")
    return closest_note, cents, closest_freq

def record_audio():
    """Record audio from microphone"""
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16,
                    channels=1,
                    rate=SAMPLE_RATE,
                    input=True,
                    frames_per_buffer=CHUNK_SIZE)
    
    print("Recording... Play your note now!")
    frames = [np.frombuffer(stream.read(CHUNK_SIZE), dtype=np.int16) 
              for _ in range(int(SAMPLE_RATE * DURATION / CHUNK_SIZE))]
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    audio = np.concatenate(frames).astype(np.float32) / 32767.0
    return audio

def analyze_pitch(audio):
    """Analyze pitch using YIN algorithm with improved parameters"""
    try:
        # Use YIN with corrected parameters
        try:
            # Try new parameter name first (librosa >= 0.9.0)
            pitches = librosa.yin(
                audio, 
                fmin=65,              # Lower to catch low E better
                fmax=450,             # Higher for harmonics
                sr=SAMPLE_RATE,
                trough_threshold=0.1,  # New parameter name
                hop_length=256        # Better resolution
            )
        except TypeError:
            # Fallback for older librosa versions
            print("Using fallback YIN parameters...")
            pitches = librosa.yin(
                audio, 
                fmin=65, 
                fmax=450, 
                sr=SAMPLE_RATE,
                hop_length=256
            )
        
        # Filter out invalid pitches
        valid_pitches = pitches[pitches > 0]
        
        if valid_pitches.size == 0:
            return None
        
        print(f"Detected {len(valid_pitches)} valid pitch frames out of {len(pitches)}")
        
        # Use histogram-based dominant pitch detection
        hist, bin_edges = np.histogram(valid_pitches, bins=50)
        dominant_bin = np.argmax(hist)
        dominant_pitch = (bin_edges[dominant_bin] + bin_edges[dominant_bin+1]) / 2
        
        return dominant_pitch
        
    except Exception as e:
        print(f"Pitch analysis error: {e}")
        return None

def main():
    """Main tuner function"""
    print("🎸 Guitar Tuner Starting...")
    print("Standard Tuning: E2(82Hz) A2(110Hz) D3(147Hz) G3(196Hz) B3(247Hz) E4(330Hz)")
    print("-" * 60)
    
    try:
        audio = record_audio()
        
        # Check if audio is loud enough
        rms = np.sqrt(np.mean(audio**2))
        print(f"Audio RMS level: {rms:.6f}")
        
        if rms < 0.001:
            print("⚠️ Audio too quiet. Try playing louder or closer to microphone.")
            return
        
        pitch = analyze_pitch(audio)
        
        if pitch is None:
            print("❌ No note detected. Try playing a single note louder.")
            return
        
        note, cents, target_freq = get_closest_note(pitch)
        
        if note is None:
            print("❌ Detected frequency too low. Try playing louder.")
            return
        
        print(f"\n🎵 Results:")
        print(f"Detected Frequency: {pitch:.2f} Hz")
        print(f"Target Note: {note} ({target_freq:.2f} Hz)")
        print(f"Deviation: {cents:.1f} cents")
        
        # Tuning status with visual feedback
        if abs(cents) <= ERROR_MARGIN:
            print("\n✅ PERFECT! IN TUNE! (within ±10 cents)")
        elif abs(cents) <= 25:
            direction = "sharp (tune DOWN)" if cents > 0 else "flat (tune UP)"
            print(f"\n🎯 CLOSE! {abs(cents):.1f} cents {direction}")
        else:
            direction = "sharp (tune DOWN)" if cents > 0 else "flat (tune UP)"
            print(f"\n⚠️ OUT OF TUNE! {abs(cents):.1f} cents {direction}")
        
        # String identification
        string_names = {
            'E2': '6th string (Low E)',
            'A2': '5th string (A)', 
            'D3': '4th string (D)',
            'G3': '3rd string (G)',
            'B3': '2nd string (B)',
            'E4': '1st string (High E)'
        }
        
        if note in string_names:
            print(f"🎸 String: {string_names[note]}")
            
    except KeyboardInterrupt:
        print("\n👋 Tuner stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
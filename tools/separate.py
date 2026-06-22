import os
import sys
import subprocess
import numpy as np
import torch

# Configuration
SAMPLE_RATE = 44100
SEGMENT_SAMPLES = 343980
MODEL_PATH = r"C:\Program Files\Go-Splitter\_up_\_up_\engine\native\segment_b1_cpu.pt"
FFMPEG_PATH = r"C:\Program Files\Go-Splitter\resources\ffmpeg.exe"

def read_audio(filepath):
    """Reads audio using FFmpeg and returns a float32 numpy array of shape (channels, samples)."""
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", filepath,
        "-f", "f32le",
        "-ac", "2",
        "-ar", str(SAMPLE_RATE),
        "-"
    ]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    stdout, _ = process.communicate()
    
    if process.returncode != 0:
        raise RuntimeError("FFmpeg failed to read audio file.")
        
    audio = np.frombuffer(stdout, dtype=np.float32)
    audio = audio.reshape(-1, 2).T  # shape: (2, samples)
    return audio

def write_wav(filepath, data, sample_rate):
    """Writes a stereo float32 wav file directly with header."""
    channels = data.shape[0]
    samples = data.shape[1]
    byte_rate = sample_rate * channels * 4
    block_align = channels * 4
    data_size = samples * channels * 4
    
    header = bytearray()
    header.extend(b'RIFF')
    header.extend((36 + data_size).to_bytes(4, 'little'))
    header.extend(b'WAVE')
    header.extend(b'fmt ')
    header.extend((16).to_bytes(4, 'little'))
    header.extend((3).to_bytes(2, 'little'))  # 3 = IEEE Float
    header.extend(channels.to_bytes(2, 'little'))
    header.extend(sample_rate.to_bytes(4, 'little'))
    header.extend(byte_rate.to_bytes(4, 'little'))
    header.extend(block_align.to_bytes(2, 'little'))
    header.extend((32).to_bytes(2, 'little'))  # 32 bits per sample
    header.extend(b'data')
    header.extend(data_size.to_bytes(4, 'little'))
    
    # Interleave channels
    flat_data = data.T.flatten()
    
    with open(filepath, 'wb') as f:
        f.write(header)
        f.write(flat_data.tobytes())

def apply_spectral_blending(audio, stems, sample_rate):
    """Extracts high frequencies (above 11 kHz) from original audio and blends them into stems to restore clarity."""
    try:
        print("Applying spectral blending (restoring high-frequency air)...")
        cutoff_freq = 11000  # Hz
        channels, samples = audio.shape
        high_freqs = np.zeros_like(audio)
        
        for ch in range(channels):
            x = audio[ch]
            X = np.fft.rfft(x)
            freqs = np.fft.rfftfreq(samples, d=1.0/sample_rate)
            mask = freqs >= cutoff_freq
            X_filtered = X * mask
            high_freqs[ch] = np.fft.irfft(X_filtered, n=samples)
            
        # Blend into vocals (idx 0), drums (idx 1), and other (idx 3)
        stems[0] += 0.5 * high_freqs
        stems[1] += 0.5 * high_freqs
        stems[3] += 0.5 * high_freqs
    except Exception as e:
        print(f"Warning: Spectral blending failed: {e}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python separate.py <input_file> <output_dir>")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading JIT model from {MODEL_PATH}...")
    model = torch.jit.load(MODEL_PATH, map_location="cpu")
    model.eval()
    
    print(f"Reading audio file {input_file}...")
    audio = read_audio(input_file)
    num_samples = audio.shape[1]
    
    # Calculate number of segments
    num_segments = int(np.ceil(num_samples / SEGMENT_SAMPLES))
    print(f"Total samples: {num_samples}, segments: {num_segments}")
    
    # Prepare output buffers: 4 stems (vocals, drums, bass, other)
    stems = [np.zeros((2, num_samples), dtype=np.float32) for _ in range(4)]
    
    # Hann window for JIT model
    window = torch.hann_window(4096)
    
    for i in range(num_segments):
        start = i * SEGMENT_SAMPLES
        end = min(start + SEGMENT_SAMPLES, num_samples)
        
        # Pad segment with zeros if it is the last segment
        segment_len = end - start
        segment = audio[:, start:end]
        if segment_len < SEGMENT_SAMPLES:
            pad_width = SEGMENT_SAMPLES - segment_len
            segment = np.pad(segment, ((0, 0), (0, pad_width)), 'constant')
            
        # Convert to tensor: shape (1, 2, SEGMENT_SAMPLES)
        segment_tensor = torch.from_numpy(segment).unsqueeze(0)
        
        print(f"Processing segment {i+1}/{num_segments}...")
        with torch.no_grad():
            # forward(mix, window) -> shape (1, 4, 2, SEGMENT_SAMPLES)
            output_tensor = model(segment_tensor, window)
            
        # Extract stems
        output_np = output_tensor.squeeze(0).numpy()  # shape: (4, 2, SEGMENT_SAMPLES)
        
        for stem_idx in range(4):
            stems[stem_idx][:, start:end] = output_np[stem_idx][:, :segment_len]
            
    # Apply spectral blending to restore high-frequency air
    apply_spectral_blending(audio, stems, SAMPLE_RATE)

    # Write output stems
    stem_names = ["vocals", "drums", "bass", "other"]
    for stem_idx, name in enumerate(stem_names):
        out_path = os.path.join(output_dir, f"{name}.wav")
        print(f"Writing {name} stem to {out_path}...")
        write_wav(out_path, stems[stem_idx], SAMPLE_RATE)
        
    print("Stem separation completed successfully!")

if __name__ == "__main__":
    main()

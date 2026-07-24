/** Browser-side audio helpers (Web Audio API — no ffmpeg). */

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
export const MAX_WAVEFORM_BARS = 800;

export type AudioExportFormat = "wav" | "webm";

export function isAudioFile(file: File): boolean {
  return (
    file.type.startsWith("audio/") ||
    /\.(mp3|wav|ogg|oga|m4a|aac|flac|webm|opus)$/i.test(file.name)
  );
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const data = await file.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/** Downsampled absolute peaks for waveform drawing (mono mix). */
export function computePeaks(
  buffer: AudioBuffer,
  bars = MAX_WAVEFORM_BARS,
): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const block = Math.max(1, Math.floor(length / bars));
  const peaks = new Float32Array(bars);
  for (let i = 0; i < bars; i++) {
    const start = i * block;
    const end = Math.min(length, start + block);
    let max = 0;
    for (let s = start; s < end; s++) {
      let sample = 0;
      for (let c = 0; c < channels; c++) {
        sample += buffer.getChannelData(c)[s] ?? 0;
      }
      sample /= channels;
      const a = Math.abs(sample);
      if (a > max) max = a;
    }
    peaks[i] = max;
  }
  return peaks;
}

export function sliceAudioBuffer(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number,
): AudioBuffer {
  const rate = buffer.sampleRate;
  const start = Math.max(0, Math.floor(startSec * rate));
  const end = Math.min(buffer.length, Math.floor(endSec * rate));
  const length = Math.max(1, end - start);
  const out = new OfflineAudioContext(
    buffer.numberOfChannels,
    length,
    rate,
  ).createBuffer(buffer.numberOfChannels, length, rate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.copyToChannel(
      buffer.getChannelData(c).subarray(start, start + length),
      c,
    );
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Encode AudioBuffer as 16-bit PCM WAV. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c]![i] ?? 0));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function pickAudioRecorderMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(mime)
    ) {
      return mime;
    }
  }
  return "audio/webm";
}

/** Re-encode via MediaRecorder (typically WebM/Opus). Real-time duration. */
export async function audioBufferToCompressed(
  buffer: AudioBuffer,
  onProgress?: (ratio: number) => void,
): Promise<{ blob: Blob; mime: string }> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("NO_RECORDER");
  }
  const mime = pickAudioRecorderMime();
  const ctx = new AudioContext({ sampleRate: buffer.sampleRate });
  try {
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(dest);

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(dest.stream, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () =>
        resolve(new Blob(chunks, { type: mime.split(";")[0] || "audio/webm" }));
      recorder.onerror = () => reject(new Error("recorder"));
    });

    const duration = buffer.duration;
    const started = performance.now();
    recorder.start(100);
    source.start(0);

    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      const tick = () => {
        const elapsed = (performance.now() - started) / 1000;
        onProgress?.(Math.min(1, elapsed / Math.max(0.001, duration)));
        if (elapsed < duration + 0.05) requestAnimationFrame(tick);
      };
      tick();
    });

    // Small pad so encoder flushes
    await new Promise((r) => setTimeout(r, 120));
    if (recorder.state !== "inactive") recorder.stop();
    dest.stream.getTracks().forEach((t) => t.stop());
    onProgress?.(1);
    const blob = await done;
    return { blob, mime: blob.type || mime.split(";")[0] || "audio/webm" };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export async function exportAudio(
  buffer: AudioBuffer,
  format: AudioExportFormat,
  onProgress?: (ratio: number) => void,
): Promise<{ blob: Blob; extension: string; mime: string }> {
  if (format === "wav") {
    onProgress?.(1);
    const blob = audioBufferToWav(buffer);
    return { blob, extension: "wav", mime: "audio/wav" };
  }
  const { blob, mime } = await audioBufferToCompressed(buffer, onProgress);
  const extension = mime.includes("ogg") ? "ogg" : "webm";
  return { blob, extension, mime };
}

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

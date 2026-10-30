"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["videoToAudio"];
};

export default function VideoToAudio({ labels }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [bitrate, setBitrate] = useState<128 | 192 | 320>(192);
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");

  function handleFile(f: File) {
    if (!f.type.startsWith("video/") && !/\.(mp4|webm|mov|mkv|avi)$/i.test(f.name)) {
      setError(labels.invalidFile);
      return;
    }
    setError("");
    setFile(f);
    setDownloadUrl(null);
  }

  // Convert AudioBuffer to WAV Uint8Array
  function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    // Interleave channels
    const length = buffer.length;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]!));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Uint8Array(arrayBuffer);
  }

  // Convert AudioBuffer to MP3 with lamejs
  async function audioBufferToMp3(buffer: AudioBuffer, targetBitrate: number): Promise<Uint8Array> {
    const lamejs = await import("lamejs");
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, targetBitrate);
    const mp3Data: Uint8Array[] = [];

    // Convert Float32Array to Int16Array
    const leftFloat = buffer.getChannelData(0);
    const rightFloat = channels > 1 ? buffer.getChannelData(1) : leftFloat;
    const length = leftFloat.length;

    const leftInt = new Int16Array(length);
    const rightInt = new Int16Array(length);

    for (let i = 0; i < length; i++) {
      const l = Math.max(-1, Math.min(1, leftFloat[i]!));
      leftInt[i] = l < 0 ? l * 0x8000 : l * 0x7fff;

      const r = Math.max(-1, Math.min(1, rightFloat[i]!));
      rightInt[i] = r < 0 ? r * 0x8000 : r * 0x7fff;
    }

    const sampleBlockSize = 1152;
    for (let i = 0; i < length; i += sampleBlockSize) {
      const leftChunk = leftInt.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt.subarray(i, i + sampleBlockSize);
      const mp3buf = channels === 1
        ? mp3encoder.encodeBuffer(leftChunk)
        : mp3encoder.encodeBuffer(leftChunk, rightChunk);

      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }

      if (i % (sampleBlockSize * 10) === 0) {
        setProgress(40 + Math.floor((i / length) * 55));
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }

    // Concatenate all chunks
    const totalLen = mp3Data.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of mp3Data) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  async function handleConvert() {
    if (!file) return;
    setBusy(true);
    setProgress(10);
    setError("");

    try {
      // Decode audio data from video file array buffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(25);

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(40);

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      let resultBlob: Blob;

      if (format === "mp3") {
        const mp3Bytes = await audioBufferToMp3(decodedBuffer, bitrate);
        resultBlob = new Blob([mp3Bytes.buffer as ArrayBuffer], { type: "audio/mp3" });
        setDownloadName(`${baseName}.mp3`);
      } else {
        const wavBytes = audioBufferToWav(decodedBuffer);
        resultBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: "audio/wav" });
        setDownloadName(`${baseName}.wav`);
      }

      setProgress(100);
      setDownloadUrl(URL.createObjectURL(resultBlob));
      await audioCtx.close();
    } catch (err) {
      console.error(err);
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {!file ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/20"
        >
          <input
            type="file"
            accept="video/*,.mp4,.webm,.mov,.mkv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <span className="text-4xl mb-2">🎬</span>
          <span className="text-sm font-bold text-slate-800">
            {labels.dropTitle}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {labels.dropSubtitle}
          </span>
          <span className="mt-4 inline-flex min-h-[38px] items-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-blue-500/20">
            {labels.selectVideo}
          </span>
        </label>
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 truncate max-w-sm">
                {file.name}
              </h4>
              <p className="text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setDownloadUrl(null);
              }}
              className="text-xs text-rose-600 hover:underline"
            >
              {labels.changeVideo}
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl bg-slate-50 p-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {labels.audioFormat}
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormat("mp3")}
                  className={`rounded-lg py-2 transition active:scale-95 ${format === "mp3" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
                >
                  {labels.mp3Compressed}
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("wav")}
                  className={`rounded-lg py-2 transition active:scale-95 ${format === "wav" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600"}`}
                >
                  {labels.wavLossless}
                </button>
              </div>
            </div>

            {format === "mp3" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {labels.qualityBitrate}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[128, 192, 320].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBitrate(b as 128 | 192 | 320)}
                      className={`min-h-[38px] rounded-xl border text-xs font-bold transition active:scale-95 ${bitrate === b ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-slate-200 bg-white text-slate-700"}`}
                    >
                      {b} kbps
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress bar if busy */}
          {busy && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{labels.processing}</span>
                <span>%{progress}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {!downloadUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleConvert}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
              >
                {busy ? labels.processing : `🎧 ${labels.extractButton}`}
              </button>
            ) : (
              <a
                href={downloadUrl}
                download={downloadName}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-95"
              >
                📥 {labels.download} ({downloadName})
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadBlob, formatBytes } from "@/lib/files/utils";

type Props = {
  labels: Dictionary["tools"]["voiceRecorder"];
};

function bufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const dataView = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      dataView.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  dataView.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, format, true);
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, byteRate, true);
  dataView.setUint16(32, blockAlign, true);
  dataView.setUint16(34, bitDepth, true);
  writeString(36, "data");
  dataView.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      dataView.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function VoiceRecorder({ labels }: Props) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [durationSec, setDurationSec] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopAllMedia();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAllMedia() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  function formatDuration(sec: number): string {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    const hrs = Math.floor(mins / 60);
    const mm = String(mins % 60).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");
    const hh = String(hrs).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function drawWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#6366f1"; // indigo-500
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  }

  async function startRecording() {
    setError("");
    setAudioBlob(null);
    setWavBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDurationSec(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext & Analyser setup for waveform
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveform();

      // Pick recorder mime type
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(rawBlob);
        const url = URL.createObjectURL(rawBlob);
        setAudioUrl(url);

        // Convert to WAV for universal audio compatibility
        try {
          const arrayBuf = await rawBlob.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          const wav = bufferToWav(decoded);
          setWavBlob(wav);
        } catch {
          /* ignore decoding error if format unusual */
        }
      };

      recorder.start(100);
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone access denied.";
      setError(labels.micError || `Microphone permission required: ${msg}`);
      setRecordingState("idle");
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingState("paused");
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
      setRecordingState("recording");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopAllMedia();
    setRecordingState("idle");
  }

  function downloadWav() {
    if (wavBlob) {
      downloadBlob(wavBlob, `recording-${Date.now()}.wav`);
    } else if (audioBlob) {
      downloadBlob(audioBlob, `recording-${Date.now()}.webm`);
    }
  }

  function downloadWebm() {
    if (audioBlob) {
      downloadBlob(audioBlob, `recording-${Date.now()}.webm`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {labels.recorderTitle || "Voice & Audio Recorder"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {labels.recorderDesc ||
              "Record voice notes, dictation, and meetings directly in your browser. 100% private, saves to WAV or WebM."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Live Visualizer Canvas */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={130}
            className="w-full h-32 rounded-xl"
          />

          {/* Recording Timer Badge */}
          <div className="absolute top-5 right-5 flex items-center gap-2 rounded-xl bg-black/75 px-3 py-1.5 shadow">
            {recordingState === "recording" && (
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
            )}
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              {formatDuration(durationSec)}
            </span>
          </div>

          {recordingState === "idle" && !audioBlob && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 text-slate-300">
              <span className="text-3xl mb-1">🎙️</span>
              <p className="text-xs font-medium">
                {labels.clickToRecord || "Click Start Recording to begin"}
              </p>
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {recordingState === "idle" ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-red-700 transition"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
              {labels.startRecording || "Start Recording"}
            </button>
          ) : (
            <>
              {recordingState === "recording" ? (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  ⏸ {labels.pause || "Pause"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  ▶ {labels.resume || "Resume"}
                </button>
              )}

              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                ⏹ {labels.stopRecording || "Stop & Save"}
              </button>
            </>
          )}
        </div>

        {/* Playback & Download Card */}
        {audioUrl && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {labels.playbackTitle || "Playback & Export"}
            </span>

            <audio src={audioUrl} controls className="w-full rounded-xl" />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500">
                {wavBlob ? `WAV (${formatBytes(wavBlob.size)})` : audioBlob ? `WebM (${formatBytes(audioBlob.size)})` : ""}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={downloadWav}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  ⬇ {labels.downloadWav || "Download .WAV (Lossless)"}
                </button>
                <button
                  type="button"
                  onClick={downloadWebm}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  ⬇ {labels.downloadWebm || "Download .WebM"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

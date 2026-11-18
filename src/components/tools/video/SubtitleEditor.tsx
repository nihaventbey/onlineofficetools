"use client";

import { useState, useRef, useEffect } from "react";
import type { Dictionary } from "@/lib/i18n";
import { downloadText } from "@/lib/files/utils";

type Props = {
  labels: Dictionary["tools"]["subtitleEditor"];
};

export type SubtitleCue = {
  id: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
};

function formatTime(seconds: number, format: "srt" | "vtt"): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);

  const hh = String(hrs).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  const sep = format === "srt" ? "," : ".";
  return `${hh}:${mm}:${ss}${sep}${mmm}`;
}

function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().replace(",", ".");
  const parts = cleaned.split(":");
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(cleaned) || 0;
}

export function parseSrtOrVtt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);

  let idCounter = 1;
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (!lines.length || lines[0].startsWith("WEBVTT") || lines[0].startsWith("NOTE")) {
      continue;
    }

    let timeLineIdx = 0;
    if (!lines[0].includes("-->") && lines[1] && lines[1].includes("-->")) {
      timeLineIdx = 1;
    } else if (!lines[0].includes("-->")) {
      continue;
    }

    const timeLine = lines[timeLineIdx];
    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    if (!startStr || !endStr) continue;

    const startTime = parseTime(startStr);
    const endTime = parseTime(endStr);
    const text = lines.slice(timeLineIdx + 1).join("\n").trim();

    if (text) {
      cues.push({
        id: `cue-${idCounter++}`,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

const SAMPLE_CUES: SubtitleCue[] = [
  { id: "1", startTime: 1.0, endTime: 4.5, text: "Welcome to Online Office Tools!" },
  { id: "2", startTime: 5.0, endTime: 8.2, text: "Edit subtitles, translate, and sync with ease." },
  { id: "3", startTime: 9.0, endTime: 12.5, text: "Download your clean .SRT or .VTT file instantly." },
];

export default function SubtitleEditor({ labels }: Props) {
  const [cues, setCues] = useState<SubtitleCue[]>(SAMPLE_CUES);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [shiftMs, setShiftMs] = useState<string>("500");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync playhead with active cue
  useEffect(() => {
    const active = cues.find(
      (c) => currentTime >= c.startTime && currentTime <= c.endTime
    );
    setActiveCueId(active ? active.id : null);
  }, [currentTime, cues]);

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
  }

  function handleSubUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const parsed = parseSrtOrVtt(text);
        if (parsed.length > 0) {
          setCues(parsed);
        }
      }
    };
    reader.readAsText(file);
  }

  function addCueAtCurrentTime() {
    const start = Math.round(currentTime * 10) / 10;
    const end = Math.round((currentTime + 3.0) * 10) / 10;
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: start,
      endTime: end,
      text: "",
    };
    const updated = [...cues, newCue].sort((a, b) => a.startTime - b.startTime);
    setCues(updated);
  }

  function updateCue(id: string, updates: Partial<SubtitleCue>) {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }

  function removeCue(id: string) {
    setCues((prev) => prev.filter((c) => c.id !== id));
  }

  function seekToCue(cue: SubtitleCue) {
    if (videoRef.current) {
      videoRef.current.currentTime = cue.startTime;
      videoRef.current.play().catch(() => {});
    }
  }

  function applyTimeShift(multiplier: 1 | -1) {
    const ms = parseFloat(shiftMs) || 0;
    const delta = (ms / 1000) * multiplier;
    setCues((prev) =>
      prev.map((c) => ({
        ...c,
        startTime: Math.max(0, Math.round((c.startTime + delta) * 1000) / 1000),
        endTime: Math.max(0.1, Math.round((c.endTime + delta) * 1000) / 1000),
      }))
    );
  }

  function generateSrtContent(): string {
    return cues
      .map((c, i) => {
        const start = formatTime(c.startTime, "srt");
        const end = formatTime(c.endTime, "srt");
        return `${i + 1}\n${start} --> ${end}\n${c.text.trim()}\n`;
      })
      .join("\n");
  }

  function generateVttContent(): string {
    const body = cues
      .map((c) => {
        const start = formatTime(c.startTime, "vtt");
        const end = formatTime(c.endTime, "vtt");
        return `${start} --> ${end}\n${c.text.trim()}\n`;
      })
      .join("\n");
    return `WEBVTT\n\n${body}`;
  }

  function downloadSrt() {
    const srt = generateSrtContent();
    downloadText(srt, "subtitles.srt", "text/plain");
  }

  function downloadVtt() {
    const vtt = generateVttContent();
    downloadText(vtt, "subtitles.vtt", "text/vtt");
  }

  function copyAll() {
    const srt = generateSrtContent();
    void navigator.clipboard.writeText(srt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="video/*,audio/*"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            🎬 {videoName ? labels.changeVideo || "Change Video" : labels.loadVideo || "Load Video / Audio"}
          </button>

          <input
            type="file"
            accept=".srt,.vtt,.txt"
            ref={subFileInputRef}
            onChange={handleSubUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => subFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            📥 {labels.importSubtitle || "Import .SRT / .VTT"}
          </button>

          <button
            type="button"
            onClick={() => setCues(SAMPLE_CUES)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            {labels.sampleData || "Load Sample"}
          </button>
          <button
            type="button"
            onClick={() => setCues([])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-red-600 hover:bg-red-50"
          >
            {labels.clearAll || "Clear"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyAll}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            {copied ? "✓ Copied!" : labels.copySrt || "Copy SRT"}
          </button>
          <button
            type="button"
            onClick={downloadSrt}
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            ⬇ {labels.downloadSrt || "Download .SRT"}
          </button>
          <button
            type="button"
            onClick={downloadVtt}
            className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            ⬇ {labels.downloadVtt || "Download .VTT"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player & Sync Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                playsInline
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                className="w-full aspect-video object-contain bg-black"
              />
            ) : (
              <div className="flex flex-col items-center justify-center aspect-video bg-slate-900 text-slate-400 p-6 text-center">
                <span className="text-4xl mb-2">🎬</span>
                <p className="text-sm font-medium text-slate-200">
                  {labels.noVideoLoaded || "No video loaded"}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {labels.noVideoHint || "Load a video file to synchronize subtitles with playback, or edit standalone."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition"
                >
                  {labels.browseVideo || "Select Video"}
                </button>
              </div>
            )}

            {/* Current Active Subtitle Overlay */}
            {activeCueId && (
              <div className="bg-slate-950/90 border-t border-slate-800 p-3 text-center">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold block mb-1">
                  Active Cue
                </span>
                <p className="text-sm font-semibold text-white">
                  {cues.find((c) => c.id === activeCueId)?.text}
                </p>
              </div>
            )}
          </div>

          {/* Time Sync & Add Cue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">{labels.currentPosition || "Current Position"}:</span>
                <p className="text-lg font-mono font-bold text-slate-900">
                  {formatTime(currentTime, "srt")}
                </p>
              </div>
              <button
                type="button"
                onClick={addCueAtCurrentTime}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                + {labels.addCueAtCurrent || "Add Cue at Current Time"}
              </button>
            </div>

            {/* Global Time Shift */}
            <div className="border-t border-slate-100 pt-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                ⏱ {labels.timeShiftTitle || "Global Time-Shift (Sync Adjustment)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="50"
                  value={shiftMs}
                  onChange={(e) => setShiftMs(e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                  placeholder="500"
                />
                <span className="text-xs text-slate-500">ms</span>
                <button
                  type="button"
                  onClick={() => applyTimeShift(1)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  title="Shift all subtitles forward"
                >
                  +{shiftMs}ms ⏩
                </button>
                <button
                  type="button"
                  onClick={() => applyTimeShift(-1)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  title="Shift all subtitles backward"
                >
                  -{shiftMs}ms ⏪
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {labels.timeShiftHint || "Fix audio desynchronization by moving all subtitles forward or backward."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Subtitle List & Editor */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              {labels.subtitlesList || "Subtitle Cues"} ({cues.length})
            </span>
            <button
              type="button"
              onClick={() => {
                const last = cues[cues.length - 1];
                const start = last ? Math.round((last.endTime + 0.5) * 10) / 10 : 0;
                setCues([
                  ...cues,
                  {
                    id: `cue-${Date.now()}`,
                    startTime: start,
                    endTime: start + 3,
                    text: "",
                  },
                ]);
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              + {labels.addNewCue || "Add New Line"}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {cues.map((cue, index) => {
              const isActive = cue.id === activeCueId;
              return (
                <div
                  key={cue.id}
                  className={`rounded-xl border p-3 transition shadow-sm ${
                    isActive
                      ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => seekToCue(cue)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition"
                        title="Jump video to cue"
                      >
                        ▶ Jump
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <input
                        type="text"
                        value={formatTime(cue.startTime, "srt")}
                        onChange={(e) =>
                          updateCue(cue.id, { startTime: parseTime(e.target.value) })
                        }
                        className="w-24 rounded border border-slate-300 px-1.5 py-0.5 text-center font-mono text-[11px] text-slate-800"
                      />
                      <span className="text-slate-400">→</span>
                      <input
                        type="text"
                        value={formatTime(cue.endTime, "srt")}
                        onChange={(e) =>
                          updateCue(cue.id, { endTime: parseTime(e.target.value) })
                        }
                        className="w-24 rounded border border-slate-300 px-1.5 py-0.5 text-center font-mono text-[11px] text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeCue(cue.id)}
                        className="ml-2 rounded p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete cue"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={cue.text}
                    onChange={(e) => updateCue(cue.id, { text: e.target.value })}
                    placeholder={labels.cueTextPlaceholder || "Enter subtitle text..."}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              );
            })}

            {cues.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <p className="text-sm">{labels.noCuesYet || "No subtitle cues added yet."}</p>
                <button
                  type="button"
                  onClick={() => setCues(SAMPLE_CUES)}
                  className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                >
                  {labels.loadSampleCues || "Load sample subtitles"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

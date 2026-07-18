"use client";

import { useCallback, useRef, useState } from "react";
import {
  formatBytes,
  MAX_FILE_BYTES,
  MAX_MERGE_TOTAL_BYTES,
} from "@/lib/pdf/utils";

type FileDropZoneProps = {
  accept: string;
  multiple?: boolean;
  dropHint: string;
  selectHint?: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

export function FileDropZone({
  accept,
  multiple,
  dropHint,
  selectHint,
  onFiles,
  disabled,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/15 ${
        dragging
          ? "border-blue-400 bg-blue-50/60"
          : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <p className="text-sm font-medium text-slate-700">{dropHint}</p>
      <p className="mt-1 text-xs text-slate-500">{selectHint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

type FileListProps = {
  files: File[];
  onRemove: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  removeLabel: string;
  upLabel?: string;
  downLabel?: string;
};

export function PdfFileList({
  files,
  onRemove,
  onMove,
  removeLabel,
  upLabel = "↑",
  downLabel = "↓",
}: FileListProps) {
  if (!files.length) return null;
  return (
    <ul className="space-y-2">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.size}-${index}`}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
            {file.name}
          </span>
          <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
          {onMove ? (
            <span className="flex gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                className="min-h-9 min-w-9 rounded-lg border border-slate-200 disabled:opacity-30"
              >
                {upLabel}
              </button>
              <button
                type="button"
                disabled={index === files.length - 1}
                onClick={() => onMove(index, index + 1)}
                className="min-h-9 min-w-9 rounded-lg border border-slate-200 disabled:opacity-30"
              >
                {downLabel}
              </button>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 hover:bg-slate-50"
          >
            {removeLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function validatePdfSize(
  file: File,
  totalBytes = 0,
): "ok" | "too_large" | "merge_too_large" {
  if (file.size > MAX_FILE_BYTES) return "too_large";
  if (totalBytes + file.size > MAX_MERGE_TOTAL_BYTES) return "merge_too_large";
  return "ok";
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

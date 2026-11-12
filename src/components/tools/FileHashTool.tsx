"use client";

import { useId, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { formatBytes } from "@/lib/files/utils";
import { FileDropZone } from "@/components/tools/pdf/PdfUi";

type Props = {
  labels: Dictionary["tools"]["fileHash"];
};

type HashAlgorithm = "SHA-256" | "SHA-512" | "SHA-384" | "SHA-1";

// Helper: Convert ArrayBuffer to Hex string
function buf2hex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
    const hex = byteArray[i]!.toString(16).padStart(2, "0");
    hexString += hex;
  }
  return hexString;
}

export default function FileHashTool({ labels }: Props) {
  const [activeTab, setActiveTab] = useState<"single" | "compare">("single");

  // Single file state
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [expectedHash, setExpectedHash] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUppercase, setIsUppercase] = useState(false);

  // Compare mode state
  const [compareFileA, setCompareFileA] = useState<File | null>(null);
  const [compareFileB, setCompareFileB] = useState<File | null>(null);
  const [hashA, setHashA] = useState<string>("");
  const [hashB, setHashB] = useState<string>("");
  const [compareBusy, setCompareBusy] = useState(false);

  const verifyInputId = useId();

  // Compute standard hashes using native Web Crypto API
  async function computeSingleFileHashes(targetFile: File) {
    setBusy(true);
    setHashes({});
    setFile(targetFile);

    try {
      const buffer = await targetFile.arrayBuffer();

      const algorithms: HashAlgorithm[] = ["SHA-256", "SHA-512", "SHA-384", "SHA-1"];
      const results: Record<string, string> = {};

      for (const algo of algorithms) {
        const hashBuf = await crypto.subtle.digest(algo, buffer);
        results[algo] = buf2hex(hashBuf);
      }

      setHashes(results);
    } catch (err) {
      console.error("Hashing failed:", err);
    } finally {
      setBusy(false);
    }
  }

  // Compare 2 files
  async function computeComparison(fA: File | null, fB: File | null) {
    if (!fA || !fB) return;
    setCompareBusy(true);
    setHashA("");
    setHashB("");

    try {
      const [bufA, bufB] = await Promise.all([fA.arrayBuffer(), fB.arrayBuffer()]);
      const [resA, resB] = await Promise.all([
        crypto.subtle.digest("SHA-256", bufA),
        crypto.subtle.digest("SHA-256", bufB),
      ]);
      setHashA(buf2hex(resA));
      setHashB(buf2hex(resB));
    } catch (err) {
      console.error("Comparison hashing failed:", err);
    } finally {
      setCompareBusy(false);
    }
  }

  function handleCopy(key: string, val: string) {
    const formatted = isUppercase ? val.toUpperCase() : val.toLowerCase();
    navigator.clipboard.writeText(formatted);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  // Verification status
  const verificationMatch = useMemo(() => {
    if (!expectedHash.trim()) return null;
    const cleanExpected = expectedHash.trim().toLowerCase();
    return Object.values(hashes).some((h) => h.toLowerCase() === cleanExpected);
  }, [expectedHash, hashes]);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Top Tabs: Single File vs Compare 2 Files */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab("single")}
          className={`flex-1 min-h-[34px] rounded-lg transition active:scale-95 ${
            activeTab === "single" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          📄 {labels.singleFileTab || "Single File Checksum"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("compare")}
          className={`flex-1 min-h-[34px] rounded-lg transition active:scale-95 ${
            activeTab === "compare" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ⚖️ {labels.compareTab || "Compare 2 Files"}
        </button>
      </div>

      {activeTab === "single" ? (
        <div className="space-y-5">
          {/* File Upload Zone */}
          {!file ? (
            <FileDropZone
              accept="*"
              dropHint={labels.dropHint || "Drop any file here or click to select"}
              selectHint={labels.selectHint || "All file formats supported — 100% locally computed"}
              onFiles={(files) => {
                if (files[0]) void computeSingleFileHashes(files[0]);
              }}
              disabled={busy}
            />
          ) : (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600 shadow-2xs">
                    🛡️
                  </span>
                  <div>
                    <h4 className="truncate text-sm font-bold text-slate-800 max-w-sm sm:max-w-md">
                      {file.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {formatBytes(file.size)} · {file.type || "binary"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUppercase(!isUppercase)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {isUppercase ? "UPPERCASE" : "lowercase"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setHashes({});
                      setExpectedHash("");
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {labels.changeFile || "Change File"}
                  </button>
                </div>
              </div>

              {/* Progress */}
              {busy && (
                <div className="rounded-xl bg-blue-50 p-4 text-center text-xs font-bold text-blue-700">
                  <span className="inline-block h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  {labels.computing || "Computing cryptographic hashes via Web Crypto…"}
                </div>
              )}

              {/* Hashes List */}
              {Object.keys(hashes).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(hashes).map(([algo, hashVal]) => {
                    const formatted = isUppercase ? hashVal.toUpperCase() : hashVal.toLowerCase();
                    const isCopied = copiedKey === algo;
                    return (
                      <div
                        key={algo}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5 transition hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold uppercase tracking-wider text-slate-700">
                            {algo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(algo, hashVal)}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                          >
                            {isCopied ? `✓ ${labels.copied || "Copied"}` : `📋 ${labels.copy || "Copy"}`}
                          </button>
                        </div>
                        <div className="font-mono text-xs break-all select-all text-slate-800 bg-white p-2 rounded-xl border border-slate-200/80">
                          {formatted}
                        </div>
                      </div>
                    );
                  })}

                  {/* Checksum Verification Box */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2 mt-4">
                    <label htmlFor={verifyInputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {labels.verifyChecksum || "Verify Against Expected Hash / Checksum"}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id={verifyInputId}
                        type="text"
                        value={expectedHash}
                        onChange={(e) => setExpectedHash(e.target.value)}
                        placeholder={labels.pasteHashPlaceholder || "Paste SHA-256 or SHA-512 checksum to verify…"}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>

                    {expectedHash.trim() && (
                      <div className="pt-1">
                        {verificationMatch ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <span>✓</span> {labels.hashMatched || "Checksum Matched! File is authentic."}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200">
                            <span>✕</span> {labels.hashMismatch || "Checksum does NOT match any algorithm!"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Compare 2 Files Mode */
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Box A */}
            <div className="space-y-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {labels.fileA || "File A (Original)"}
              </span>
              {!compareFileA ? (
                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 p-4">
                  <span className="text-xs font-semibold text-slate-600">
                    {labels.chooseFileA || "Select or drop File A"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setCompareFileA(f);
                        void computeComparison(f, compareFileB);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs">
                  <p className="font-bold truncate text-slate-800">{compareFileA.name}</p>
                  <p className="text-slate-500">{formatBytes(compareFileA.size)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareFileA(null);
                      setHashA("");
                    }}
                    className="text-xs text-rose-600 hover:underline mt-2 block"
                  >
                    {labels.change || "Change"}
                  </button>
                </div>
              )}
            </div>

            {/* Box B */}
            <div className="space-y-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {labels.fileB || "File B (Copy / Verification)"}
              </span>
              {!compareFileB ? (
                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 p-4">
                  <span className="text-xs font-semibold text-slate-600">
                    {labels.chooseFileB || "Select or drop File B"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setCompareFileB(f);
                        void computeComparison(compareFileA, f);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs">
                  <p className="font-bold truncate text-slate-800">{compareFileB.name}</p>
                  <p className="text-slate-500">{formatBytes(compareFileB.size)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCompareFileB(null);
                      setHashB("");
                    }}
                    className="text-xs text-rose-600 hover:underline mt-2 block"
                  >
                    {labels.change || "Change"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Outcome */}
          {compareBusy && (
            <div className="text-center text-xs font-bold text-blue-600">
              {labels.comparing || "Comparing cryptographic hashes…"}
            </div>
          )}

          {hashA && hashB && !compareBusy && (
            <div
              className={`rounded-2xl p-5 text-center border ${
                hashA === hashB
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <div className="text-3xl mb-1">{hashA === hashB ? "✅" : "❌"}</div>
              <h4 className="text-base font-extrabold">
                {hashA === hashB
                  ? labels.filesMatch || "Files are 100% IDENTICAL!"
                  : labels.filesDiffer || "Files are DIFFERENT!"}
              </h4>
              <p className="text-xs mt-1 text-slate-600">
                {hashA === hashB
                  ? "Both files have the exact same SHA-256 cryptographic digest."
                  : "The file contents do not match."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

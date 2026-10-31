"use client";

import { useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["whatsappCleaner"];
};

export type FormatMode =
  | "header_lines"
  | "header_paragraph"
  | "inline_each"
  | "messages_only";

export type ParsedMessage = {
  timestamp: string;
  sender: string;
  text: string;
  isSystem: boolean;
};

// Invisible Unicode directionality & non-breaking space normalizer
function normalizeUnicode(raw: string): string {
  return raw
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/[\u00A0\u202F]/g, " ");
}

// System / media placeholder patterns across 8 languages (TR, EN, DE, FR, ES, IT, PT, RU)
const SYSTEM_OR_MEDIA_PATTERNS: RegExp[] = [
  /^< *(?:medya dahil edilmedi|media omitted|medien ausgeschlossen|médias omis|multimedia omitido|media omessi|mídia oculta|arquivo de mídia oculto|без медиафайлов|이미지 생략|바탕화면) *>$/i,
  /^(?:görüntü|video|ses|çıkartma|gif|belge|kişi kartı) dahil edilmedi$/i,
  /^(?:image|video|audio|sticker|gif|document|contact card) omitted$/i,
  /^(?:bild|video|audio|sticker|gif|dokument|kontaktkarte) weggelassen$/i,
  /^(?:bu mesaj silindi|bu mesajı sildiniz|this message was deleted|you deleted this message|diese nachricht wurde gelöscht|du hast diese nachricht gelöscht|ce message a été supprimé|vous avez supprimé ce message|se eliminó este mensaje|eliminaste este mensaje|questo messaggio è stato eliminato|hai eliminato questo messaggio|esta mensagem foi apagada|você apagou esta mensagem|это сообщение удалено|вы удалили это сообщение)\.?$/i,
  /(?:uçtan uca şifrelidir|end-to-end encrypted|ende-zu-ende-verschlüsselt|chiffrés de bout en bout|cifrados de extremo a extremo|crittografati end-to-end|criptografia de ponta a ponta|защищены сквозным шифрованием)/i,
  /^(?:cevapsız sesli arama|cevapsız görüntülü arama|missed voice call|missed video call|verpasster sprach-?anruf|verpasster video-?anruf|appel vocal manqué|appel vidéo manqué|llamada perdida|videollamada perdida|chiamata vocale persa|videochiamata persa|chamada de voz perdida|chamada de vídeo perdida|пропущенный аудиозвонок|пропущенный видеозвонок)$/i,
];

// Inline "<edited>" / "<düzenlendi>" markers at the end of a line
const EDITED_SUFFIX_REGEX =
  /\s*<(?:düzenlendi|bu mesaj düzenlendi|edited|this message was edited|bearbeitet|modifié|editado|modificato|editada|изменено)>\s*$/i;

// Standalone timestamp line from WhatsApp Web drag-selection (e.g. "14:32", "02:32 PM", "ÖS 14:32")
const STANDALONE_TIME_REGEX =
  /^(?:(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП)\s*)?\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП))?$/i;

// 1. Bracketed format:
// [14:32, 31.10.2026] Name: Text
// [31.10.2026 14:32:15] Name: Text
// [31/10/2026, 2:32:10 PM] Name: Text
// [14:32] Name: Text
const BRACKETED_LINE_REGEX =
  /^\[([^\]]{3,36})\]\s*([^:]{1,80}?):\s*(.*)$/;

// Bracketed system line (no sender colon):
// [31.10.2026 14:32:15] Messages and calls are end-to-end encrypted.
const BRACKETED_SYSTEM_REGEX =
  /^\[(\d[^\]]{3,34})\]\s+(.+)$/;

// 2. Unbracketed export / mobile copy format:
// 31.10.2026 14:32 - Name: Text
// 10/31/26, 2:32 PM - Name: Text
// 31/10/2026 à 14:32 - Name: Text
// 31.10.26 um 14:32 - Name: Text
const UNBRACKETED_LINE_REGEX =
  /^(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}(?:,?\s+|\s+(?:à|um|às|alle|в)\s+)(?:(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП)\s*)?\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП))?)\s*[-–—]\s*([^:]{1,80}?):\s*(.*)$/i;

// Unbracketed system line (no sender colon):
// 31.10.2026 14:32 - Messages and calls are end-to-end encrypted.
const UNBRACKETED_SYSTEM_REGEX =
  /^(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}(?:,?\s+|\s+(?:à|um|às|alle|в)\s+)(?:(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП)\s*)?\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*(?:ÖÖ|ÖS|AM|PM|a\.?\s*m\.?|p\.?\s*m\.?|vorm\.|nachm\.|ДП|ПП))?)\s*[-–—]\s*(.+)$/i;

function isSystemOrMediaNoise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return SYSTEM_OR_MEDIA_PATTERNS.some((re) => re.test(trimmed));
}

export function parseWhatsappChat(
  rawInput: string,
  options: {
    stripEditedTag: boolean;
    stripStandaloneTime: boolean;
  },
): ParsedMessage[] {
  const normalized = normalizeUnicode(rawInput);
  const rawLines = normalized.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  for (const rawLine of rawLines) {
    let line = rawLine.trimEnd();
    if (options.stripEditedTag) {
      line = line.replace(EDITED_SUFFIX_REGEX, "");
    }

    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (options.stripStandaloneTime && STANDALONE_TIME_REGEX.test(trimmed)) {
      continue;
    }

    // Check Bracketed Message: [timestamp] Sender: Message
    const bracketMatch = line.match(BRACKETED_LINE_REGEX);
    if (bracketMatch && /\d/.test(bracketMatch[1])) {
      const timestamp = bracketMatch[1].trim();
      const sender = bracketMatch[2].trim();
      const text = bracketMatch[3].trim();
      messages.push({
        timestamp,
        sender,
        text,
        isSystem: isSystemOrMediaNoise(text),
      });
      continue;
    }

    // Check Unbracketed Message: date, time - Sender: Message
    const unbracketMatch = line.match(UNBRACKETED_LINE_REGEX);
    if (unbracketMatch) {
      const timestamp = unbracketMatch[1].trim();
      const sender = unbracketMatch[2].trim();
      const text = unbracketMatch[3].trim();
      messages.push({
        timestamp,
        sender,
        text,
        isSystem: isSystemOrMediaNoise(text),
      });
      continue;
    }

    // Check Bracketed System Line: [timestamp] System Notice
    const bracketSysMatch = line.match(BRACKETED_SYSTEM_REGEX);
    if (bracketSysMatch && /\d{1,2}[:.]\d{2}/.test(bracketSysMatch[1])) {
      messages.push({
        timestamp: bracketSysMatch[1].trim(),
        sender: "",
        text: bracketSysMatch[2].trim(),
        isSystem: true,
      });
      continue;
    }

    // Check Unbracketed System Line: date, time - System Notice
    const unbracketSysMatch = line.match(UNBRACKETED_SYSTEM_REGEX);
    if (unbracketSysMatch) {
      messages.push({
        timestamp: unbracketSysMatch[1].trim(),
        sender: "",
        text: unbracketSysMatch[2].trim(),
        isSystem: true,
      });
      continue;
    }

    // Continuation line of the previous message (multi-line WhatsApp message)
    // or plain pasted lines without timestamp
    if (messages.length > 0 && !messages[messages.length - 1].isSystem) {
      const prev = messages[messages.length - 1];
      prev.text = prev.text ? `${prev.text}\n${trimmed}` : trimmed;
    } else {
      messages.push({
        timestamp: "",
        sender: "",
        text: trimmed,
        isSystem: isSystemOrMediaNoise(trimmed),
      });
    }
  }

  return messages;
}

export default function WhatsappCleaner({ labels }: Props) {
  const [input, setInput] = useState<string>("");
  const [formatMode, setFormatMode] = useState<FormatMode>("header_lines");
  const [keepTimestamps, setKeepTimestamps] = useState<boolean>(false);
  const [removeSystemMessages, setRemoveSystemMessages] = useState<boolean>(true);
  const [stripEditedTag, setStripEditedTag] = useState<boolean>(true);
  const [speakerRenames, setSpeakerRenames] = useState<Record<string, string>>({});
  const [hiddenSpeakers, setHiddenSpeakers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsedMessages = useMemo(() => {
    if (!input.trim()) return [];
    return parseWhatsappChat(input, {
      stripEditedTag,
      stripStandaloneTime: true,
    });
  }, [input, stripEditedTag]);

  // Extract unique speakers in order of appearance
  const speakers = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const msg of parsedMessages) {
      if (msg.sender && !seen.has(msg.sender)) {
        seen.add(msg.sender);
        list.push(msg.sender);
      }
    }
    return list;
  }, [parsedMessages]);

  // Filter and format output
  const result = useMemo(() => {
    const filtered = parsedMessages.filter((msg) => {
      if (removeSystemMessages && msg.isSystem) return false;
      if (msg.sender && hiddenSpeakers[msg.sender]) return false;
      if (!msg.text.trim()) return false;
      return true;
    });

    if (filtered.length === 0) {
      return {
        outputText: "",
        messageCount: 0,
        speakerCount: speakers.length,
        groupCount: 0,
      };
    }

    const resolveName = (sender: string) => {
      const custom = speakerRenames[sender]?.trim();
      return custom && custom.length > 0 ? custom : sender;
    };

    // Group consecutive messages from the same speaker
    type SpeakerGroup = {
      speaker: string;
      items: ParsedMessage[];
    };
    const groups: SpeakerGroup[] = [];

    for (const msg of filtered) {
      const displaySpeaker = msg.sender ? resolveName(msg.sender) : "";
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.speaker === displaySpeaker) {
        lastGroup.items.push(msg);
      } else {
        groups.push({
          speaker: displaySpeaker,
          items: [msg],
        });
      }
    }

    let outputBlocks: string[] = [];

    if (formatMode === "header_lines") {
      outputBlocks = groups.map((group) => {
        const lines = group.items.map((item) =>
          keepTimestamps && item.timestamp
            ? `[${item.timestamp}] ${item.text}`
            : item.text,
        );
        if (group.speaker) {
          return `${group.speaker}:\n${lines.join("\n")}`;
        }
        return lines.join("\n");
      });
    } else if (formatMode === "header_paragraph") {
      outputBlocks = groups.map((group) => {
        const merged = group.items
          .map((item) => {
            const cleanText = item.text.replace(/\r?\n/g, " ");
            return keepTimestamps && item.timestamp
              ? `[${item.timestamp}] ${cleanText}`
              : cleanText;
          })
          .join(" ");
        if (group.speaker) {
          return `${group.speaker}: ${merged}`;
        }
        return merged;
      });
    } else if (formatMode === "inline_each") {
      const lines = filtered.map((item) => {
        const spk = item.sender ? `${resolveName(item.sender)}: ` : "";
        const ts = keepTimestamps && item.timestamp ? `[${item.timestamp}] ` : "";
        return `${ts}${spk}${item.text}`;
      });
      outputBlocks = [lines.join("\n")];
    } else {
      // messages_only
      const lines = filtered.map((item) =>
        keepTimestamps && item.timestamp
          ? `[${item.timestamp}] ${item.text}`
          : item.text,
      );
      outputBlocks = [lines.join("\n")];
    }

    const separator =
      formatMode === "header_lines" || formatMode === "header_paragraph"
        ? "\n\n"
        : "\n";

    return {
      outputText: outputBlocks.join(separator),
      messageCount: filtered.length,
      speakerCount: speakers.length,
      groupCount: groups.length,
    };
  }, [
    parsedMessages,
    removeSystemMessages,
    hiddenSpeakers,
    speakerRenames,
    formatMode,
    keepTimestamps,
    speakers.length,
  ]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setInput(reader.result);
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  function loadSample() {
    setInput(labels.sampleChat);
    setSpeakerRenames({});
    setHiddenSpeakers({});
  }

  function clearAll() {
    setInput("");
    setSpeakerRenames({});
    setHiddenSpeakers({});
  }

  function copyResult() {
    if (!result.outputText) return;
    navigator.clipboard.writeText(result.outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    if (!result.outputText) return;
    const blob = new Blob([result.outputText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whatsapp-cleaned.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7">
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 text-xs font-semibold sm:grid-cols-2 lg:grid-cols-3">
        {/* Format Mode Selection */}
        <div className="space-y-2">
          <span className="block font-bold tracking-wider text-slate-500 uppercase">
            {labels.formatModeLabel}
          </span>
          <select
            value={formatMode}
            onChange={(e) => setFormatMode(e.target.value as FormatMode)}
            className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
          >
            <option value="header_lines">{labels.modeHeaderLines}</option>
            <option value="header_paragraph">{labels.modeHeaderParagraph}</option>
            <option value="inline_each">{labels.modeInlineEach}</option>
            <option value="messages_only">{labels.modeMessagesOnly}</option>
          </select>
        </div>

        {/* Cleaning Checkboxes */}
        <div className="space-y-2">
          <span className="block font-bold tracking-wider text-slate-500 uppercase">
            {labels.cleanOptionsLabel}
          </span>
          <label className="flex min-h-[28px] cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={!keepTimestamps}
              onChange={(e) => setKeepTimestamps(!e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>{labels.removeTimestamps}</span>
          </label>
          <label className="flex min-h-[28px] cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={removeSystemMessages}
              onChange={(e) => setRemoveSystemMessages(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>{labels.removeSystemMessages}</span>
          </label>
          <label className="flex min-h-[28px] cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={stripEditedTag}
              onChange={(e) => setStripEditedTag(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>{labels.stripEditedTag}</span>
          </label>
        </div>

        {/* Quick Actions: Sample & .txt Upload */}
        <div className="space-y-2">
          <span className="block font-bold tracking-wider text-slate-500 uppercase">
            {labels.sourceActionsLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              💬 {labels.sampleButton}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              📂 {labels.uploadTxtButton}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Detected Speakers Panel (Rename & Filter) */}
      {speakers.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold tracking-wider text-emerald-900 uppercase">
              👥 {labels.speakersHeading} ({speakers.length})
            </span>
            <span className="text-xs text-slate-500">
              {labels.speakersHint}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((spk) => {
              const isVisible = !hiddenSpeakers[spk];
              return (
                <div
                  key={spk}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                    isVisible
                      ? "border-emerald-200 bg-white"
                      : "border-slate-200 bg-slate-100/70 opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) =>
                      setHiddenSpeakers((prev) => ({
                        ...prev,
                        [spk]: !e.target.checked,
                      }))
                    }
                    title={labels.toggleSpeaker}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[11px] font-semibold text-slate-400"
                      title={spk}
                    >
                      {spk}
                    </div>
                    <input
                      type="text"
                      value={speakerRenames[spk] ?? ""}
                      placeholder={spk}
                      onChange={(e) =>
                        setSpeakerRenames((prev) => ({
                          ...prev,
                          [spk]: e.target.value,
                        }))
                      }
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input & Output Side-by-Side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Raw WhatsApp Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{labels.inputLabel}</span>
            {input && (
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-400 hover:text-rose-600"
              >
                {labels.clear}
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={labels.inputPlaceholder}
            rows={14}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs leading-relaxed text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>

        {/* Right: Cleaned & Grouped Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{labels.outputLabel}</span>
            <span className="font-bold text-emerald-700">
              {result.messageCount} {labels.messagesUnit} · {result.speakerCount}{" "}
              {labels.speakersUnit}
            </span>
          </div>
          <textarea
            readOnly
            value={result.outputText}
            placeholder={labels.outputPlaceholder}
            rows={14}
            className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/20 p-3.5 font-mono text-xs leading-relaxed text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Bottom Summary & Export Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">
            {labels.statsMessages}: {result.messageCount}
          </span>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">
            {labels.statsSpeakers}: {result.speakerCount}
          </span>
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800">
            {labels.statsGroups}: {result.groupCount}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyResult}
            disabled={!result.outputText}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-40"
          >
            {copied ? `✓ ${labels.copied}` : `📋 ${labels.copyResult}`}
          </button>
          <button
            type="button"
            onClick={downloadTxt}
            disabled={!result.outputText}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40"
          >
            📥 {labels.downloadTxt}
          </button>
        </div>
      </div>
    </div>
  );
}

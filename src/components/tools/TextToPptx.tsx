"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { useToolDraft } from "@/lib/state/useToolDraft";

type Props = { labels: Dictionary["tools"]["textToPptx"] };

type Slide = { title: string; bullets: string[] };

function parseOutline(text: string): Slide[] {
  const slides: Slide[] = [];
  let current: Slide = { title: "", bullets: [] };

  function pushCurrent() {
    if (current.title || current.bullets.length) slides.push(current);
    current = { title: "", bullets: [] };
  }

  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }
    if (line.startsWith("##")) {
      pushCurrent();
      current.title = line.replace(/^#+\s*/, "");
    } else if (line.startsWith("-")) {
      current.bullets.push(line.replace(/^-\s*/, ""));
    } else if (!current.title) {
      current.title = line;
    } else {
      current.bullets.push(line);
    }
  }
  pushCurrent();
  return slides.length ? slides : [{ title: "Slide", bullets: [] }];
}

export default function TextToPptx({ labels }: Props) {
  const [text, setText, clear] = useToolDraft(
    "text-to-pptx",
    "## Introduction\n- First point\n- Second point\n\n## Summary\n- Wrap up",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      const slides = parseOutline(text);
      for (const s of slides) {
        const slide = pptx.addSlide();
        slide.addText(s.title, { x: 0.5, y: 0.4, w: 9, h: 1, fontSize: 28, bold: true });
        if (s.bullets.length) {
          slide.addText(
            s.bullets.map((b) => ({ text: b, options: { bullet: true } })),
            { x: 0.7, y: 1.5, w: 8.5, h: 4.5, fontSize: 18 },
          );
        }
      }
      await pptx.writeFile({ fileName: "presentation.pptx" });
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={labels.placeholder}
        rows={14}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-blue-400"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !text.trim()}
          className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {labels.download}
        </button>
        <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">
          {labels.clear}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { toolMetaList } from "@/lib/tools/metadata";

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

interface ExtendedDocument extends Document {
  modelContext?: {
    registerTool: (
      tool: ModelContextTool,
      options?: { signal?: AbortSignal },
    ) => Promise<unknown>;
  };
}

export default function WebMcpProvider() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const doc = document as ExtendedDocument;
    if (!doc.modelContext || typeof doc.modelContext.registerTool !== "function") {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    // 1. Search tools
    void doc.modelContext
      .registerTool(
        {
          name: "search_office_tools",
          description:
            "Search and discover 60+ online office utilities (PDF, OCR, text, documents, images).",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search keyword or tool capability",
              },
            },
            required: ["query"],
          },
          execute: async ({ query }) => {
            const q = String(query || "").toLowerCase();
            const results = toolMetaList
              .filter(
                (t) =>
                  t.slug.includes(q) ||
                  t.keywords.some((k) => k.toLowerCase().includes(q)) ||
                  t.category.toLowerCase().includes(q),
              )
              .slice(0, 5)
              .map((t) => ({
                slug: t.slug,
                category: t.category,
                url: `/en/tools/${t.slug}`,
              }));
            return { query, count: results.length, tools: results };
          },
        },
        { signal },
      )
      .catch(() => undefined);

    // 2. Word counter
    void doc.modelContext
      .registerTool(
        {
          name: "count_words",
          description:
            "Count words, characters, sentences, and paragraphs in a text string.",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", description: "Text content to analyze" },
            },
            required: ["text"],
          },
          execute: async ({ text }) => {
            const str = String(text || "");
            const words = (str.match(/[\p{L}\p{N}]+/gu) || []).length;
            const characters = str.length;
            const charactersNoSpaces = str.replace(/\s+/g, "").length;
            const sentences = (str.match(/[^.!?]+[.!?]+/g) || []).length;
            const paragraphs = str
              .split(/\n+/)
              .map((s) => s.trim())
              .filter(Boolean).length;
            return {
              words,
              characters,
              charactersNoSpaces,
              sentences,
              paragraphs,
            };
          },
        },
        { signal },
      )
      .catch(() => undefined);

    // 3. Case converter
    void doc.modelContext
      .registerTool(
        {
          name: "convert_text_case",
          description:
            "Convert text between uppercase, lowercase, titlecase, camelCase, snake_case, and kebab-case.",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", description: "Input text" },
              style: {
                type: "string",
                description: "Target case: upper, lower, title, camel, snake, kebab",
              },
            },
            required: ["text", "style"],
          },
          execute: async ({ text, style }) => {
            const str = String(text || "");
            const s = String(style || "lower").toLowerCase();
            let result = str;
            if (s === "upper") result = str.toUpperCase();
            else if (s === "lower") result = str.toLowerCase();
            else if (s === "snake")
              result = str.trim().toLowerCase().replace(/[\s\W-]+/g, "_");
            else if (s === "kebab")
              result = str.trim().toLowerCase().replace(/[\s\W_]+/g, "-");
            else if (s === "camel") {
              const words = str.match(/[\p{L}\p{N}]+/gu) || [];
              result = words
                .map((w, i) =>
                  i === 0
                    ? w.toLowerCase()
                    : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                )
                .join("");
            }
            return { style: s, result };
          },
        },
        { signal },
      )
      .catch(() => undefined);

    // 4. Base64 encode/decode
    void doc.modelContext
      .registerTool(
        {
          name: "base64_convert",
          description: "Encode or decode strings using standard Base64 encoding.",
          inputSchema: {
            type: "object",
            properties: {
              data: { type: "string", description: "String to process" },
              action: {
                type: "string",
                description: "'encode' or 'decode'",
              },
            },
            required: ["data", "action"],
          },
          execute: async ({ data, action }) => {
            const str = String(data || "");
            const act = String(action || "encode").toLowerCase();
            try {
              if (act === "decode") {
                const binary = atob(str);
                const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
                const result = new TextDecoder().decode(bytes);
                return { action: "decode", result };
              } else {
                const bytes = new TextEncoder().encode(str);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const result = btoa(binary);
                return { action: "encode", result };
              }
            } catch (err) {
              return { error: (err as Error).message };
            }
          },
        },
        { signal },
      )
      .catch(() => undefined);

    // 5. Password generator
    void doc.modelContext
      .registerTool(
        {
          name: "generate_secure_password",
          description:
            "Generate a cryptographically secure random password with customizable length.",
          inputSchema: {
            type: "object",
            properties: {
              length: {
                type: "number",
                description: "Length of the password (default: 16)",
              },
            },
          },
          execute: async ({ length }) => {
            const len = Math.max(8, Math.min(64, Number(length) || 16));
            const chars =
              "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()-_=+";
            const bytes = new Uint32Array(len);
            crypto.getRandomValues(bytes);
            let password = "";
            for (let i = 0; i < len; i++) {
              password += chars[bytes[i] % chars.length];
            }
            return { length: len, password };
          },
        },
        { signal },
      )
      .catch(() => undefined);

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="sr-only" aria-hidden="true">
      {/* Declarative WebMCP forms for AI agent discovery */}
      <form
        // @ts-expect-error declarative WebMCP attributes
        toolname="search_office_tools"
        tooldescription="Search 60+ online office utilities including PDF, OCR, text, spreadsheets, images, and developer tools"
        action="/en"
        method="GET"
      >
        <input
          name="query"
          type="text"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Search keyword, tool name, or capability to discover"
        />
      </form>
      <form
        // @ts-expect-error declarative WebMCP attributes
        toolname="count_words"
        tooldescription="Count words, characters, sentences, lines, and reading time in text"
        action="/en/tools/word-counter"
        method="POST"
      >
        <textarea
          name="text"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Input text to analyze for word count and statistics"
        />
      </form>
      <form
        // @ts-expect-error declarative WebMCP attributes
        toolname="convert_text_case"
        tooldescription="Convert text case to uppercase, lowercase, title case, camelCase, snake_case, or kebab-case"
        action="/en/tools/case-converter"
        method="POST"
      >
        <textarea
          name="text"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Text to convert"
        />
        <input
          name="style"
          type="text"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Target case format (upper, lower, title, camel, snake, kebab)"
        />
      </form>
      <form
        // @ts-expect-error declarative WebMCP attributes
        toolname="base64_convert"
        tooldescription="Encode or decode strings using standard Base64 encoding"
        action="/en/tools/base64-encode-decode"
        method="POST"
      >
        <textarea
          name="data"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Data to encode or decode"
        />
        <input
          name="action"
          type="text"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Operation: 'encode' or 'decode'"
        />
      </form>
      <form
        // @ts-expect-error declarative WebMCP attributes
        toolname="generate_secure_password"
        tooldescription="Generate cryptographically secure random passwords"
        action="/en/tools/password-generator"
        method="GET"
      >
        <input
          name="length"
          type="number"
          // @ts-expect-error declarative WebMCP attributes
          toolparamdescription="Length of password to generate (8-64 characters)"
        />
      </form>
    </div>
  );
}

import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const agentCard = {
    name: "Online Office Tools",
    version: "1.0.0",
    description:
      "Privacy-first client-side office suite providing 65+ in-browser PDF, image, video, audio, text, and developer tools executing 100% locally via WebAssembly.",
    url: `${SITE_URL}/en`,
    provider: {
      organization: "Online Office Tools",
      url: SITE_URL,
    },
    documentationUrl: `${SITE_URL}/auth.md`,
    supportedInterfaces: [
      {
        url: `${SITE_URL}/api/health`,
        transport: "HTTP+JSON",
        protocolBinding: "HTTP+JSON",
      },
    ],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/markdown", "application/json"],
    skills: [
      {
        id: "pdf-studio",
        name: "PDF Studio & Document Processing",
        description:
          "Merge, split, organize, rotate, number pages, watermark, sign, redact, and convert PDF files locally in the browser.",
        tags: ["pdf", "document", "merge", "split", "organize", "ocr"],
        examples: [
          "Merge multiple PDF files into one document",
          "Add page numbers and organize PDF pages",
        ],
      },
      {
        id: "image-media-tools",
        name: "Image, Audio & Video Processing",
        description:
          "Compress, resize, crop, remove background, censor/blur sensitive areas, generate favicons, and extract MP3/WAV audio from video files.",
        tags: ["image", "video", "audio", "favicon", "censor", "background-removal"],
        examples: [
          "Generate a complete favicon package from a PNG logo",
          "Extract MP3 audio from an MP4 video file",
        ],
      },
      {
        id: "office-calculators-text",
        name: "Office Calculators & Text Utilities",
        description:
          "Calculate VAT/tax, overtime & work hours, clean and deduplicate lists, format JSON/SQL, and convert spreadsheets.",
        tags: ["calculator", "vat", "work-hours", "text", "list-cleaner", "developer"],
        examples: [
          "Calculate VAT inclusive and exclusive prices",
          "Deduplicate and sort a list of text items",
        ],
      },
    ],
  };

  return new NextResponse(JSON.stringify(agentCard, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

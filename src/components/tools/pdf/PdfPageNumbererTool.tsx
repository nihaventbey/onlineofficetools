"use client";

import PdfStudioCore from "@/components/tools/pdf/PdfStudioCore";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["pdfPageNumberer"];
};

export default function PdfPageNumbererTool({ labels }: Props) {
  return <PdfStudioCore initialMode="numbering" labels={labels} />;
}

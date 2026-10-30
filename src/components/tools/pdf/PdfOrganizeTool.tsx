"use client";

import PdfStudioCore from "@/components/tools/pdf/PdfStudioCore";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  labels: Dictionary["tools"]["pdfOrganize"];
};

export default function PdfOrganizeTool({ labels }: Props) {
  return <PdfStudioCore initialMode="organize" labels={labels} />;
}

"use client";

import { use } from "react";
import ToolEditor from "@/components/admin/ToolEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditToolPage({ params }: PageProps) {
  const { id } = use(params);
  return <ToolEditor toolId={id} />;
}

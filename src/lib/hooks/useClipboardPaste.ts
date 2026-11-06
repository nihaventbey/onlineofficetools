"use client";

import { useEffect } from "react";

type PasteHandlerProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
};

/**
 * Checks if a given file matches the accept pattern (e.g. "image/*", "image/png,image/jpeg", ".pdf")
 */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept || accept === "*" || accept === "*/*") return true;

  const patterns = accept.split(",").map((p) => p.trim().toLowerCase());
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      const baseType = pattern.slice(0, -2);
      return fileType.startsWith(baseType + "/");
    }
    return fileType === pattern;
  });
}

/**
 * Global window paste listener for file-handling tools.
 * Enables users to simply press Ctrl+V / Cmd+V anywhere on the page to paste an image/file from clipboard.
 * Ignores paste events originating from input, textarea, or contentEditable elements.
 */
export function useClipboardPaste({ onFiles, accept, disabled }: PasteHandlerProps) {
  useEffect(() => {
    if (disabled) return;

    function handlePaste(e: ClipboardEvent) {
      // If user is currently focused on an input/textarea/editable, let native paste handle it
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      const matchedFiles: File[] = [];

      // 1. First check clipboardData.items for files / image blobs
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              // Synthetic filename if clipboard gave an anonymous file
              let finalFile = file;
              if (!file.name || file.name === "image.png") {
                const ext = file.type.split("/")[1] || "png";
                finalFile = new File([file], `clipboard-${Date.now()}.${ext}`, {
                  type: file.type,
                });
              }

              if (matchesAccept(finalFile, accept)) {
                matchedFiles.push(finalFile);
              }
            }
          }
        }
      }

      // 2. Fallback to clipboardData.files
      if (matchedFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (matchesAccept(file, accept)) {
            matchedFiles.push(file);
          }
        }
      }

      if (matchedFiles.length > 0) {
        e.preventDefault();
        onFiles(matchedFiles);
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [onFiles, accept, disabled]);
}

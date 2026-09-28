"use client";

import { renderMarkdown } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FiBold, FiCode, FiImage, FiItalic, FiLink, FiList } from "react-icons/fi";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your blog content here...",
  className,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.getElementById("blog-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: FiBold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: FiItalic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: FiLink, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: FiList, label: "List", action: () => insertMarkdown("\n- ") },
    { icon: FiCode, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: FiImage, label: "Image", action: () => insertMarkdown("![alt text](", ")") },
  ];

  const previewHtml = { __html: renderMarkdown(value) };

  return (
    <div className={cn("border border-neutral-300 rounded-lg overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 sm:p-2 bg-neutral-50 border-b border-neutral-300">
        <div className="flex flex-wrap items-center gap-0.5">
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={button.action}
              className="min-h-10 min-w-10 inline-flex items-center justify-center p-2 rounded hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors touch-manipulation"
              title={button.label}
              aria-label={button.label}
            >
              <button.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={cn(
              "min-h-9 px-3 py-1.5 text-sm font-medium rounded transition-colors touch-manipulation",
              activeTab === "write" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "min-h-9 px-3 py-1.5 text-sm font-medium rounded transition-colors touch-manipulation",
              activeTab === "preview"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {activeTab === "write" ? (
        <textarea
          id="blog-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-60 sm:min-h-75 p-3 sm:p-4 resize-y bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 font-sans text-base leading-relaxed"
        />
      ) : (
        <div
          className="w-full min-h-60 sm:min-h-75 p-3 sm:p-4 prose prose-neutral max-w-none break-words"
          dangerouslySetInnerHTML={previewHtml}
        />
      )}

      <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-300 text-xs text-neutral-500">
        Supports Markdown: **bold**, *italic*, `code`, [links](url), - lists
      </div>
    </div>
  );
}

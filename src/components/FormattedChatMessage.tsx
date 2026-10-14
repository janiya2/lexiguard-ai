"use client";

import React from "react";

interface FormattedChatMessageProps {
  content: string;
  isUser?: boolean;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, and cleans up raw markdown artifacts
 */
function renderInlineFormatting(text: string, isUser: boolean = false): React.ReactNode[] {
  // First, clean up any triple or quadrupled asterisks (e.g. **** or ***)
  const sanitized = text
    .replace(/\*{3,}/g, "**")
    .replace(/_{3,}/g, "__");

  // Regex to match **bold**, *italic*, `code`, and regular text
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|`[^`]+`)/g;
  const parts = sanitized.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold (**text** or __text__)
    if ((part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length > 4)) {
      const inner = part.slice(2, -2).trim();
      return (
        <strong
          key={index}
          className={
            isUser
              ? "font-bold text-white underline decoration-cyan-400/50"
              : "font-bold text-cyan-200 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/25 tracking-normal inline-block my-0.5"
          }
        >
          {inner}
        </strong>
      );
    }

    // Italic (*text*)
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      const inner = part.slice(1, -1).trim();
      return (
        <em key={index} className="italic text-slate-300 font-medium">
          {inner}
        </em>
      );
    }

    // Inline Code (`code`)
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="font-mono text-[11px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-white/10"
        >
          {inner}
        </code>
      );
    }

    // Clean any remaining lone asterisks
    const cleanedText = part.replace(/\*{1,2}/g, "");
    return <span key={index}>{cleanedText}</span>;
  });
}

export default function FormattedChatMessage({ content, isUser = false }: FormattedChatMessageProps) {
  if (isUser) {
    return <div className="leading-relaxed whitespace-pre-wrap">{content}</div>;
  }

  // Split into lines to parse block structure (bullets, headers, numbered lists)
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-200">
      {lines.map((rawLine, lineIndex) => {
        const line = rawLine.trim();

        // Empty line -> spacing
        if (!line) {
          return <div key={lineIndex} className="h-1.5" />;
        }

        // Heading: ### or ## or #
        if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
          const headingText = line.replace(/^#{1,3}\s+/, "");
          return (
            <div
              key={lineIndex}
              className="font-black text-white text-xs sm:text-sm tracking-wide pt-1 pb-0.5 border-b border-cyan-500/20 text-cyan-300 flex items-center gap-1.5"
            >
              <span>⚖️</span>
              <span>{renderInlineFormatting(headingText, isUser)}</span>
            </div>
          );
        }

        // Numbered list item: e.g. "1. " or "2. "
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={lineIndex} className="flex items-start gap-2.5 my-1.5 pl-0.5">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black font-mono shadow-sm mt-0.5">
                {num}
              </span>
              <div className="flex-1 text-slate-200">
                {renderInlineFormatting(rest, isUser)}
              </div>
            </div>
          );
        }

        // Bullet point: "- " or "* " or "• "
        if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
          const bulletText = line.replace(/^[-*•]\s+/, "");
          return (
            <div key={lineIndex} className="flex items-start gap-2.5 my-1 pl-1.5">
              <span className="text-cyan-400 mt-1 shrink-0 text-sm leading-none">•</span>
              <div className="flex-1 text-slate-300">
                {renderInlineFormatting(bulletText, isUser)}
              </div>
            </div>
          );
        }

        // Normal text paragraph
        return (
          <p key={lineIndex} className="leading-relaxed">
            {renderInlineFormatting(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

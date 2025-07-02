import React from "react";
import ReactMarkdown from "react-markdown";

export default function ParsedMarkdownContent({ markdown }) {
  return (
    <div className="prose prose-invert max-w-none text-cyan-100">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

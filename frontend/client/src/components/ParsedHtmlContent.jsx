import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function ParsedMarkdownContent({ markdown }) {
  return (
    <div
      className="prose max-w-none text-cyan-100"
      style={{
        fontFamily: `'Segoe UI', 'Verdana', 'Arial', 'Helvetica Neue', Helvetica, sans-serif`,
        fontSize: "1.1rem",
        lineHeight: 1.7,
        letterSpacing: "0.01em",
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: ({ node, inline, className, children, ...props }) => (
            <code
              className={
                "bg-gray-800 px-1.5 py-0.5 rounded text-pink-300 font-mono text-base" +
                (inline ? "" : " block my-2 p-2 text-sm")
              }
              style={{
                fontFamily: `'Fira Mono', 'Fira Code', 'Consolas', 'Menlo', 'Monaco', 'monospace'`,
                background: inline ? undefined : "#232323",
                color: inline ? undefined : "#ffb86c",
              }}
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ node, children, ...props }) => (
            <pre
              className="bg-gray-900 rounded p-3 overflow-x-auto my-3 border border-gray-700"
              style={{
                fontFamily: `'Fira Mono', 'Fira Code', 'Consolas', 'Menlo', 'Monaco', 'monospace'`,
                fontSize: "1em",
              }}
              {...props}
            >
              {children}
            </pre>
          ),
          h1: ({ node, ...props }) => (
            <h1
              className="font-bold text-2xl mb-2 mt-6 text-cyan-300 border-b border-cyan-700 pb-1"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="font-bold text-xl mb-2 mt-5 text-cyan-200 border-b border-cyan-700 pb-1"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="font-semibold text-lg mb-2 mt-4 text-cyan-100"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="mb-1 pl-1"
              style={{ fontSize: "1.05em" }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2" style={{ fontSize: "1.1em" }} {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

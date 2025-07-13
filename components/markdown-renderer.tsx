"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("max-w-full break-words", className)}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeSanitize]}
            components={{
            p: ({ node, ...props }) => (
                <p {...props} />
            ),
            ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5" {...props} />
            ),
            ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5" {...props} />
            ),
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            strong: ({ node, ...props }) => (
                <strong className="font-bold" {...props} />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            code: ({ node, ...props }) => (
                <code className="bg-gray-200 rounded px-1" {...props} />
            ),
            pre: ({ node, ...props }) => (
                <pre className="bg-gray-900 text-gray-100 rounded p-2 overflow-x-auto text-sm" {...props} />
            ),
            h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-bold" {...props} />
            ),
            h2: ({ node, ...props }) => (
                <h2 className="text-xl font-semibold" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 pl-2 italic text-gray-600 my-1" {...props} />
            ),
            a: ({ node, ...props }) => (
                <a
                {...props}
                className="underline transition text-shadow-md"
                target="_blank"
                rel="noopener noreferrer"
                />
            ),
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
  );
}
"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useMarkdownToggle } from "@/hooks/use-markdown";
import { ButtonUseMarkdown } from "../button-use-markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface UseAutosizeTextAreaProps {
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  minHeight?: number;
  maxHeight?: number;
  triggerValue: string;
}

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerValue,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  const [init, setInit] = React.useState(true);

  React.useEffect(() => {
    const offsetBorder = 6;
    const el = textAreaRef.current;
    if (!el) return;

    if (init) {
      el.style.minHeight = `${minHeight + offsetBorder}px`;
      if (maxHeight > minHeight) {
        el.style.maxHeight = `${maxHeight}px`;
      }
      setInit(false);
    }

    // Reset to minimum to recalculate
    el.style.height = `${minHeight + offsetBorder}px`;

    const scrollHeight = el.scrollHeight;
    if (scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
    } else {
      el.style.height = `${scrollHeight + offsetBorder}px`;
    }
  }, [triggerValue, textAreaRef, maxHeight, minHeight, init]);
};

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement;
  maxHeight: number;
  minHeight: number;
  markdownEnabled: boolean;
  focus: () => void;
};

type AutosizeTextAreaProps = {
  maxHeight?: number;
  minHeight?: number;
  markdown?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 52,
      markdown = false,
      className,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [triggerValue, setTriggerValue] = React.useState("");
    const {
    markdownEnabled,
    toggleMarkdown,
  } = useMarkdownToggle();

    useAutosizeTextArea({
      textAreaRef,
      triggerValue,
      maxHeight,
      minHeight,
    });

    React.useImperativeHandle(ref, () => ({
      textArea: textAreaRef.current as HTMLTextAreaElement,
      focus: () => textAreaRef.current?.focus(),
      maxHeight,
      minHeight,
      markdownEnabled
    }));

    React.useEffect(() => {
      setTriggerValue(typeof value === "string" ? value : "");
    }, [value]);

    return (
      <div className="relative">
        <textarea
          {...props}
          ref={textAreaRef}
          value={value}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
            markdown && "pr-10",
            triggerValue.includes("\n") && "whitespace-pre-wrap",
            className
          )}
          onChange={(e) => {
            setTriggerValue(e.target.value);
            onChange?.(e);
          }}
        />

        <ButtonUseMarkdown
          markdownEnabled={markdownEnabled}
          toggleMarkdown={toggleMarkdown}
          className={`absolute top-1 right-1 bg-gray-100 dark:bg-[#090050] lg:dark:bg-[#090040] rounded-lg p-1 border ${markdownEnabled ? "border-gray-800 dark:border-gray-200" : "border-none"}`}
        />
        
        {markdownEnabled && triggerValue && (
          <div className="mt-2 px-2 py-3 max-h-64 overflow-y-auto rounded-xl bg-gray-100 dark:bg-[#090050] lg:dark:bg-[#090040] ring-2 ring-inset ring-gray-900 dark:ring-gray-100">
            <MarkdownRenderer content={triggerValue} />
          </div>
        )}
      </div>
    );
  }
);

AutosizeTextarea.displayName = "AutosizeTextarea";
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMarkdownToggle } from "@/hooks/use-markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  React.useEffect(() => {
    const offsetBorder = 6;
    const el = textAreaRef.current;
    if (!el) return;

    el.style.minHeight = `${minHeight + offsetBorder}px`;
    el.style.maxHeight = `${maxHeight}px`;
    el.style.height = `${minHeight + offsetBorder}px`;

    const scrollHeight = el.scrollHeight;
    el.style.height = scrollHeight > maxHeight ? `${maxHeight}px` : `${scrollHeight + offsetBorder}px`;
  }, [triggerValue, textAreaRef, maxHeight, minHeight]);
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
    const { markdownEnabled, toggleMarkdown } = useMarkdownToggle();

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
      <div className="flex flex-col gap-2">
        {/* Textarea */}
        <Textarea
          {...props}
          ref={textAreaRef}
          value={value}
          onChange={(e) => {
            setTriggerValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            "w-full resize-none break-words",
            markdown && "pr-10",
            triggerValue.includes("\n") && "whitespace-pre-wrap",
            className
          )}
        />

        {/* Switch toggle markdown */}
        <div className="flex items-center space-x-1 ml-3">
          <span className="flex items-center">
            MD
            <svg width="15" height="auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d='M12 4.5v15m0 0-6-5.625m6 5.625 6-5.625'/>
            </svg>
          </span>
          <Switch
            id="markdown-toggle"
            checked={markdownEnabled}
            onCheckedChange={toggleMarkdown}
          />
        </div>

        {/* Markdown Preview */}
        {markdownEnabled && triggerValue && (
          <div className="px-2 py-3 max-h-64 overflow-y-auto rounded-xl bg-gray-100 dark:bg-[#090050] lg:dark:bg-[#090040] border-1 border-gray-800 dark:border-gray-300">
            <MarkdownRenderer content={triggerValue} />
          </div>
        )}
      </div>
    );
  }
);

AutosizeTextarea.displayName = "AutosizeTextarea";
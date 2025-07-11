"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
  focus: () => void;
};

type AutosizeTextAreaProps = {
  maxHeight?: number;
  minHeight?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<AutosizeTextAreaRef, AutosizeTextAreaProps>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 52,
      className,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [triggerValue, setTriggerValue] = React.useState("");

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
    }));

    React.useEffect(() => {
      setTriggerValue(typeof value === "string" ? value : "");
    }, [value]);

    return (
      <textarea
        {...props}
        ref={textAreaRef}
        value={value}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={(e) => {
          setTriggerValue(e.target.value);
          onChange?.(e);
        }}
      />
    );
  }
);

AutosizeTextarea.displayName = "AutosizeTextarea";
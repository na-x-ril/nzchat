"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonUseMarkdownProps {
  markdownEnabled: boolean;
  toggleMarkdown: () => void;
  className?: string;
}

export function ButtonUseMarkdown({
  markdownEnabled,
  toggleMarkdown,
  className,
}: ButtonUseMarkdownProps) {
  return (
    <Button
      type="button"
      variant={markdownEnabled ? "default" : "outline"}
      size="icon"
      onClick={toggleMarkdown}
      className={cn(
        "transition-all",
        markdownEnabled
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "hover:bg-gray-100",
        className
      )}
    >
      <FileText className="w-5 h-5" />
      <span className="sr-only">Toggle Markdown Preview</span>
    </Button>
  );
}

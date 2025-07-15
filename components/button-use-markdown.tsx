"use client";

import { FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SwitchUseMarkdownProps {
  markdownEnabled: boolean;
  toggleMarkdown: () => void;
  className?: string;
}

export function SwitchUseMarkdown({
  markdownEnabled,
  toggleMarkdown,
  className,
}: SwitchUseMarkdownProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch checked={markdownEnabled} onChange={toggleMarkdown} />
    </div>
  );
}
"use client";

import React, { forwardRef } from "react";
import { AutosizeTextarea, AutosizeTextAreaRef } from "@/components/ui/autosize-textarea";
import { cn } from "@/lib/utils";

interface AutosizeTextareaWithRefProps
  extends React.ComponentPropsWithoutRef<typeof AutosizeTextarea> {}

const AutosizeTextareaWithRef = forwardRef<AutosizeTextAreaRef, AutosizeTextareaWithRefProps>(
  ({ className, ...props }, ref) => {
    return (
      <AutosizeTextarea
        ref={ref}
        maxHeight={200}
        className={cn("w-full text-sm placeholder:text-gray-400", className)}
        {...props}
      />
    );
  }
);

AutosizeTextareaWithRef.displayName = "AutosizeTextareaWithRef";
export default AutosizeTextareaWithRef;
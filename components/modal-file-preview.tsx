"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import Image from "next/image"

interface ModalFilePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  type: string
  name: string
}

export function ModalFilePreview({ open, onOpenChange, url, type, name }: ModalFilePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[80%] p-0 bg-black">
        <VisuallyHidden>
          <DialogTitle>File Preview</DialogTitle>
        </VisuallyHidden>
        {type.startsWith("image/") && (
          <Image
            src={url}
            alt={name}
            width={1200}
            height={800}
            className="w-full h-auto object-contain rounded"
            unoptimized
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, ImageIcon, Video, Music, Archive, Eye } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

interface FilePreviewProps {
  fileId: Id<"_storage">
  fileName: string
  fileType: string
  fileSize: number
}

export function FilePreview({ fileId, fileName, fileType, fileSize }: FilePreviewProps) {
  const fileUrl = useQuery(api.files.getFileUrl, { fileId })

  // Tambahkan class warna gelap untuk icon dan button
  const iconClass = "w-5 h-5 text-gray-800 dark:text-gray-200"
  const buttonClass =
    "h-8 w-8 p-0 text-gray-800 dark:text-gray-200 hover:text-black hover:bg-white/20"

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = () => {
    if (fileType.startsWith("image/")) return <ImageIcon className={iconClass} />
    if (fileType.startsWith("video/")) return <Video className={iconClass} />
    if (fileType.startsWith("audio/")) return <Music className={iconClass} />
    if (fileType.includes("pdf") || fileType.includes("document")) return <ImageIcon className={iconClass} />
    if (fileType.includes("zip") || fileType.includes("rar")) return <Archive className={iconClass} />
    return <ImageIcon className={iconClass} />
  }

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!fileUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
        <div className="animate-pulse">{getFileIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 p-3 bg-white/10 rounded-lg">
        <div className="flex items-center gap-3">
          <div>{getFileIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{fileName}</p>
            <p className="text-xs opacity-75 text-gray-700 dark:text-gray-300">{formatFileSize(fileSize)}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={buttonClass}
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
        {/* Inline media preview */}
        {fileType.startsWith("image/") && (
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-64 object-contain rounded-lg"
          />
        )}
        {fileType.startsWith("video/") && (
          <video src={fileUrl} controls className="max-w-full max-h-64 rounded-lg border">
            Your browser does not support the video tag.
          </video>
        )}
        {fileType.startsWith("audio/") && (
          <div className="w-full max-w-md">
            <audio src={fileUrl} controls className="w-full">
              Your browser does not support the audio tag.
            </audio>
          </div>
        )}
      </div>
    </>
  )
}

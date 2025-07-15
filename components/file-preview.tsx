"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Download, ImageIcon, Video, Music, Archive, FileText } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"
import { useState } from "react"
import { ModalFilePreview } from "@/components/modal-file-preview"

interface FilePreviewProps {
  fileId: Id<"_storage">
  fileName: string
  fileType: string
  fileSize: number
}

export function FilePreview({ fileId, fileName, fileType, fileSize }: FilePreviewProps) {
  const fileUrl = useQuery(api.files.getFileUrl, { fileId })
  const [open, setOpen] = useState(false)

  const iconClass = "w-5 h-5 text-gray-800 dark:text-gray-200"

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
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className={iconClass} />
    if (fileType.includes("zip") || fileType.includes("rar")) return <Archive className={iconClass} />
    return <FileText className={iconClass} />
  }

  function downloadFileWithXHR(url: string, fileName: string) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";

    xhr.onload = function () {
      if (xhr.status === 200) {
        const urlBlob = window.URL.createObjectURL(xhr.response);
        const a = document.createElement("a");
        a.href = urlBlob;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);
      } else {
        alert("Failed to download file.");
      }
    };

    xhr.onerror = function () {
      alert("Download error.");
    };

    xhr.send();
  }

  if (!fileUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg animate-pulse">
        {getFileIcon()}
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div
        className="relative w-full bg-white/10 rounded-lg overflow-hidden cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {fileType.startsWith("image/") && (
          <div className="message-container">
            <Image
              src={fileUrl}
              alt={fileName}
              width={500}
              height={500}
              className="w-full h-auto max-h-[350px] object-contain rounded-lg"
              loading="lazy"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 bottom-2 bg-white/80 hover:bg-white text-gray-800 dark:text-gray-200 shadow"
              onClick={(e) => {
                e.stopPropagation()
                if (fileUrl) {
                  downloadFileWithXHR(fileUrl, fileName)
                }
              }}
            >
              <Download className="w-5 h-5 dark:text-gray-700" />
            </Button>
          </div>
        )}
        {fileType.startsWith("video/") && (
          <div className="message-container">
            <video
              src={fileUrl}
              controls
              className="w-full h-auto max-h-[350px] object-contain rounded-lg"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 bg-white/80 hover:bg-white text-gray-800 dark:text-gray-200 shadow"
              onClick={(e) => {
                e.stopPropagation()
                if (fileUrl) {
                  downloadFileWithXHR(fileUrl, fileName)
                }
              }}
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        )}
        {fileType.startsWith("audio/") && (
          <div className="flex items-center rounded-lg">
            <audio src={fileUrl} controls className="w-full hide-audio-volume" />
            <Button
              size="icon"
              variant="ghost"
              className="right-2 top-2 px-4 bg-white/80 hover:bg-white text-gray-800 dark:text-gray-200 shadow rounded-l-none"
              onClick={(e) => {
                e.stopPropagation()
                if (fileUrl) {
                  downloadFileWithXHR(fileUrl, fileName)
                }
              }}
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        )}
        {!fileType.startsWith("image/") &&
          !fileType.startsWith("video/") &&
          !fileType.startsWith("audio/") && (
            <div className="flex items-center justify-between">
              <a
                href={fileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 cursor-pointer hover:bg-white/20 transition rounded-l-lg no-underline"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <div className="flex items-center gap-2">
                  {getFileIcon()}
                  <div>
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
                  </div>
                </div>
              </a>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/80 hover:bg-white text-gray-800 dark:text-gray-200 shadow"
                onClick={(e) => {
                  e.stopPropagation()
                  if (fileUrl) {
                    downloadFileWithXHR(fileUrl, fileName)
                  }
                }}
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>
        )}
      </div>

      <ModalFilePreview
        open={open}
        onOpenChange={setOpen}
        url={fileUrl}
        type={fileType}
        name={fileName}
      />
    </>
  )
}

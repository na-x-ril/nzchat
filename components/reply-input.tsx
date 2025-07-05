"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { X, Reply, Paperclip, ImageIcon, Video, Music, Loader2 } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

interface ReplyInputProps {
  replyTo: {
    messageId: Id<"messages">
    content: string
    username: string
  } | null
  message: string
  onMessageChange: (message: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onCancelReply: () => void
  isSending: boolean
  roomId: Id<"rooms">
  userId: Id<"users">
}

export function ReplyInput({
  replyTo,
  message,
  onMessageChange,
  onSendMessage,
  onCancelReply,
  isSending,
  roomId,
  userId,
}: ReplyInputProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const sendFileMessage = useMutation(api.files.sendFileMessage)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />
    if (fileType.startsWith("audio/")) return <Music className="w-4 h-4" />
    return <ImageIcon className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      })

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response.storageId)
          } else {
            reject(new Error("Upload failed"))
          }
        }
        xhr.onerror = () => reject(new Error("Upload failed"))
      })

      const formData = new FormData()
      formData.append("file", selectedFile)

      xhr.open("POST", uploadUrl)
      xhr.send(formData)

      const storageId = await uploadPromise

      // Send file message
      await sendFileMessage({
        roomId,
        userId,
        fileId: storageId as Id<"_storage">,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        content: message.trim() || undefined,
        replyToId: replyTo?.messageId,
      })

      // Log successful file upload
      console.log(`File uploaded successfully:`, {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        storageId: storageId,
        timestamp: new Date().toISOString(),
      })

      // Clear form
      setSelectedFile(null)
      onMessageChange("")
      if (replyTo) onCancelReply()
      if (fileInputRef.current) fileInputRef.current.value = ""

      toast({
        title: "File Uploaded!",
        description: `${selectedFile.name} has been shared successfully.`,
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFile) {
      await handleFileUpload()
    } else if (message.trim()) {
      onSendMessage(e)
    }
  }

  const handleCancelFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      {replyTo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Replying to {replyTo.username}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={onCancelReply}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-blue-700 mt-1 truncate">{replyTo.content}</p>
        </div>
      )}

      {selectedFile && (
        <div className="bg-gray-50 border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleCancelFile} disabled={isUploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                disabled={isUploading || isSending}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending}
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
            <Input
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={
                selectedFile ? "Add a caption (optional)..." : replyTo ? "Reply to message..." : "Type your message..."
              }
              className="pl-12 pr-4 rounded-full"
              disabled={isSending || isUploading}
            />
          </div>
          <Button
            type="submit"
            disabled={isSending || isUploading || (!message.trim() && !selectedFile)}
            className="rounded-full"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>{selectedFile ? <Paperclip className="w-4 h-4" /> : <Reply className="w-4 h-4" />}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

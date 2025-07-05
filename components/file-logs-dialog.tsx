"use client"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Copy, ExternalLink, FileText, ImageIcon, Video, Music, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"

interface FileLogsDialogProps {
  isOpen: boolean
  onClose: () => void
  roomId?: Id<"rooms">
}

export function FileLogsDialog({ isOpen, onClose, roomId }: FileLogsDialogProps) {
  const { toast } = useToast()
  const fileLogs = useQuery(api.files.getFileUploadLogs, { roomId, limit: 100 })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-green-600" />
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4 text-blue-600" />
    if (fileType.startsWith("audio/")) return <Music className="w-4 h-4 text-purple-600" />
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className="w-4 h-4 text-red-600" />
    if (fileType.includes("zip") || fileType.includes("rar")) return <Archive className="w-4 h-4 text-orange-600" />
    return <FileText className="w-4 h-4 text-gray-600" />
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const openUrl = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Upload Logs
          </DialogTitle>
          <DialogDescription>
            {roomId ? "Files uploaded in this room" : "All file uploads across the application"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {fileLogs?.map((log) => (
              <div key={log._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={log.userImageUrl || "/placeholder.svg"} />
                      <AvatarFallback>{log.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{log.username}</p>
                      <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    File Upload
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    {getFileIcon(log.metadata?.fileType || "")}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{log.metadata?.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{log.metadata?.fileType}</span>
                        <span>•</span>
                        <span>{formatFileSize(log.metadata?.fileSize || 0)}</span>
                        {log.metadata?.hasCaption && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              Has Caption
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {log.metadata?.fileUrl && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(log.metadata.fileUrl, "File URL")}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUrl(log.metadata.fileUrl)}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {fileLogs?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No file uploads found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

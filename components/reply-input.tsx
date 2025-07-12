"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, X, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"
import { AutosizeTextarea } from "./ui/autosize-textarea"

interface ReplyInputProps {
  replyTo: {
    messageId: Id<"messages">
    content: string
    username: string
  } | null
  onCancelReply: () => void
  roomId: Id<"rooms">
  userId: Id<"users">
  onMessageSent: () => void
}

export function ReplyInput({
  replyTo,
  onCancelReply,
  roomId,
  userId,
  onMessageSent,
}: ReplyInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const sendMessage = useMutation(api.messages.sendMessage)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const sendFileMessage = useMutation(api.files.sendFileMessage)

  const modalRef = useRef<HTMLFormElement | null>(null)

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedFile(null)
        onCancelReply()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onCancelReply])

  useEffect(() => {
    if (replyTo) {
      setIsOpen(true)
    }
  }, [replyTo])

  const handleFileUpload = async () => {
    if (!selectedFile) return

    try {
      const uploadUrl = await generateUploadUrl()

      const storageId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText)
          resolve(res.storageId)
        }
        xhr.onerror = () => reject(new Error("Upload failed"))
        xhr.open("POST", uploadUrl)
        xhr.send(selectedFile)
      })

      await sendFileMessage({
        roomId,
        userId,
        fileId: storageId as Id<"_storage">,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        content: message.trim() || "",
        replyToId: replyTo?.messageId,
      })
    } catch (error) {
      throw error
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast({
        title: "Pesan kosong",
        description: "Tuliskan sesuatu atau lampirkan file sebelum mengirim.",
      })
      return
    }

    setIsSending(true)
    try {
      if (selectedFile) {
        await handleFileUpload()
      } else {
        await sendMessage({
          roomId,
          userId,
          content: message.trim(),
          replyToId: replyTo?.messageId,
        })
      }

      setMessage("")
      setSelectedFile(null)
      onCancelReply()
      setIsOpen(false)
      onMessageSent() // Panggil onMessageSent setelah pesan berhasil dikirim
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengirim pesan, coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-white/50 backdrop-blur flex items-center justify-center p-2 rounded-full shadow-lg">
          <Button
            onClick={() => setIsOpen(true)}
            className="text-lg font-bold rounded-full shadow-lg px-10 py-6"
          >
            Kirim...
          </Button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: replyTo ? 390 : 350, damping: replyTo ? 24 : 28 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/30 backdrop-blur-sm"
          >
            <motion.form
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: replyTo ? 390 : 350, damping: replyTo ? 24 : 28 }}
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="bg-white rounded-2xl w-full max-w-md p-4 shadow-xl mt-[-5vh]"
            >
              {replyTo && (
                <div className="p-2 border rounded-xl mb-2 text-sm relative bg-blue-50">
                  Membalas @{replyTo.username}: "{replyTo.content}"
                  <button
                    type="button"
                    onClick={onCancelReply}
                    className="absolute top-1 right-1 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="p-2 border rounded-xl mb-2 text-sm flex items-center gap-2 bg-muted">
                  <Image size={16} />
                  <span className="truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <AutosizeTextarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesanmu di sini..."
                className="min-h-[100px]"
                maxHeight={500}
                autoFocus
              />

              <div className="mt-4 flex justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false)
                    setSelectedFile(null)
                    onCancelReply()
                  }}
                >
                  Batal
                </Button>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1">
                    <Paperclip size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <Button type="submit" disabled={isSending}>
                    {isSending ? "Mengirim..." : "Kirim"}
                  </Button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
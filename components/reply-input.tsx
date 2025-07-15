"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AutosizeTextarea, AutosizeTextAreaRef } from "./ui/autosize-textarea";
import { useMarkdownToggle } from "@/hooks/use-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReplyInputProps {
  replyTo: {
    messageId: Id<"messages">;
    content: string;
    username: string;
  } | null;
  onCancelReply: () => void;
  roomId: Id<"rooms">;
  userId: Id<"users">;
  onMessageSent: () => void;
}

export function ReplyInput({
  replyTo,
  onCancelReply,
  roomId,
  userId,
  onMessageSent,
}: ReplyInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const textAreaRef = useRef<AutosizeTextAreaRef | null>(null);

  const sendMessage = useMutation(api.messages.sendMessage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const sendFileMessage = useMutation(api.files.sendFileMessage);

  const { markdownEnabled, toggleMarkdown } = useMarkdownToggle(false);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const uploadUrl = await generateUploadUrl();

      const storageId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText);
          resolve(res.storageId);
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", uploadUrl);
        xhr.send(selectedFile);
      });

      await sendFileMessage({
        roomId,
        userId,
        fileId: storageId as Id<"_storage">,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        content: message.trim() || "",
        useMarkdown: textAreaRef.current?.markdownEnabled || false,
        replyToId: replyTo?.messageId,
      });
    } catch (error) {
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast({
        title: "Pesan kosong",
        description: "Tuliskan sesuatu atau lampirkan file sebelum mengirim.",
      });
      return;
    }

    setIsSending(true);
    try {
      if (selectedFile) {
        await handleFileUpload();
      } else {
        await sendMessage({
          roomId,
          userId,
          content: message.trim(),
          useMarkdown: textAreaRef.current?.markdownEnabled || false,
          replyToId: replyTo?.messageId,
        });
      }

      setMessage("");
      setSelectedFile(null);
      setIsOpen(false);
      onCancelReply();
      onMessageSent();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengirim pesan, coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isOpen && !replyTo && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-white/50 backdrop-blur flex items-center justify-center p-2 rounded-full shadow-lg">
          <Button
            onClick={() => setIsOpen(true)}
            className="text-lg dark:bg-[#471396] lg:dark:bg-[#471386] dark:text-white font-bold rounded-full shadow-lg px-10 py-6"
          >
            Kirim...
          </Button>
        </div>
      )}

      <Dialog
        open={isOpen || !!replyTo}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) onCancelReply();
        }}
      >
        <DialogContent className="p-4 max-w-50 dark:bg-[#090040] lg:dark:bg-[#090030] max-sm:mt-[-10vh] max-md:mt-[-10vh]">
          <DialogHeader>
            <DialogTitle>Kirim Balasan</DialogTitle>
          </DialogHeader>

          {replyTo && (
            <div className="relative p-2 border rounded-xl text-sm dark:text-white bg-blue-50 dark:bg-blue-500/20">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                Membalas @{replyTo.username}:
              </div>
              <div className="line-clamp-3 break-all max-w-full">
                {replyTo.content}
              </div>
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
            <div className="p-2 border rounded-xl text-sm flex items-center gap-2 bg-gray-400 dark:bg-white/20">
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
            className="w-full resize-none break-words bg-transparent"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesanmu di sini... (bisa dengan markdown)"
            maxHeight={200}
            autoFocus
            ref={textAreaRef}
            markdown={markdownEnabled}
          />

          <div className="mt-4 flex justify-between items-center gap-2">
            <label className="cursor-pointer flex items-center gap-1">
              <Paperclip size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="hidden"
              />
            </label>

            <div className="flex gap-2">
              <Button
                className="hover:bg-destructive"
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  onCancelReply();
                }}
              >
                Batal
              </Button>
              <Button
                className="dark:bg-[#471396] dark:text-white"
                type="button"
                onClick={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? "Mengirim..." : "Kirim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

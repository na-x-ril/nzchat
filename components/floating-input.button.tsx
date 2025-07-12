"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function FloatingInputButton({
  onSubmit,
}: {
  onSubmit?: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    if (value.trim() !== "") {
      onSubmit?.(value.trim())
      setValue("")
      setIsOpen(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3"
        >
          Tulis Pesan
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-background/70 backdrop-blur flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-background rounded-xl w-full max-w-md p-4 shadow-lg"
            >
              <Textarea
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Tulis pesanmu di sini..."
                className="min-h-[120px]"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Batal
                </Button>
                <Button onClick={handleSubmit} type="button">
                  Kirim
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}